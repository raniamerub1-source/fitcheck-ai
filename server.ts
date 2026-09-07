import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Support large image uploads (base64)
app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'FitCheck AI Stylist Server' });
});

// Lazy Gemini client helper
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Supported Gemini vision models in priority order
const VISION_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

function isRetryableError(error: any): boolean {
  const msg = String(error?.message || error || '').toLowerCase();
  const status = error?.status || error?.statusCode || error?.code;
  return (
    status === 503 ||
    status === 429 ||
    status === 'UNAVAILABLE' ||
    status === 'RESOURCE_EXHAUSTED' ||
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('temporarily')
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractJson(text: string): any {
  const clean = text.trim();
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      return JSON.parse(match[1]);
    }
    throw new Error('Could not parse response JSON.');
  }
}

// POST /api/analyze-fit
app.post('/api/analyze-fit', async (req, res) => {
  try {
    const { image, mimeType, occasion, styleVibe } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an outfit photo to begin analysis.',
      });
    }

    if (!occasion || !styleVibe) {
      return res.status(400).json({
        success: false,
        error: 'Occasion and Style/Vibe selection are required.',
      });
    }

    // Clean base64 string
    let cleanBase64 = image;
    let detectedMime = mimeType || 'image/jpeg';
    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        detectedMime = match[1];
        cleanBase64 = match[2];
      }
    }

    const ai = getGeminiClient();

    const promptText = `Please analyze this outfit photo in detail as an expert personal stylist.
Target Occasion: ${occasion}
Target Style/Vibe Aesthetic: ${styleVibe}

Follow all instructions strictly:
1. Examine what is strictly visible in the image.
2. If shoes are visible, rate them out of 10 and give a comment. If shoes are cut off, hidden, or not in frame, set visible: false, displayText: "Not visible", and score: null.
3. If visible accessories (bags, jewelry, watches, glasses, belts, hats) exist, rate them out of 10. If none are visible or clear, set visible: false, displayText: "Not visible", and score: null.
4. Give honest, constructive, elevated scores between 1 and 10 based on tailoring, color coordination, silhouette balance, and execution for "${occasion}" in the "${styleVibe}" aesthetic.
5. Provide KEEP (3 distinct items), CHANGE (2 distinct items), ADD (3 distinct items), and a Glow Up Plan (3 actionable numbered steps).
6. Do not comment on the person's physical body, weight, age, or appearance—critique the clothes, fit, styling, and coordination exclusively.`;

    const systemInstruction = `You are a high-taste, world-class personal outfit stylist and fashion editor for FitCheck AI.
Your task is to analyze the user's uploaded outfit photo with extreme precision and discerning aesthetic judgment.

CRITICAL FASHION INTEGRITY RULES:
1. Grounding in Reality: Analyze ONLY what is physically visible in the image.
   - Never invent clothing items.
   - Never invent colors.
   - Never invent shoes.
   - Never invent accessories.
   - Never claim something is visible when it isn't.
   - If shoes cannot be clearly seen, mark shoes as visible: false and displayText: "Not visible".
   - If no accessories are visible, mark accessories as visible: false and displayText: "Not visible".
2. Contextual Nuance: Evaluate the outfit specifically against the user's selected Occasion and Style/Vibe aesthetic.
3. Strict Respect:
   - Do NOT judge or comment on the person's body, weight, attractiveness, skin, race, ethnicity, age, or personal physical characteristics.
   - Focus exclusively on clothing items, tailoring, fit, silhouette proportions, color harmony, fabric pairing, coordination, and styling execution.
4. Quantifiable scoring:
   - Provide realistic, nuanced scores (e.g. 7.5, 8, 9) rather than generic round numbers where appropriate.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        fitScore: {
          type: Type.NUMBER,
          description: 'Fit Score out of 10 assessing tailoring, silhouette drape, and fit',
        },
        colorMatch: {
          type: Type.NUMBER,
          description: 'Color Match score out of 10 assessing color harmony and contrast',
        },
        outfitBalance: {
          type: Type.NUMBER,
          description: 'Outfit Balance score out of 10 assessing volume, proportion, and visual weight',
        },
        shoes: {
          type: Type.OBJECT,
          properties: {
            visible: { type: Type.BOOLEAN, description: 'True if shoes are clearly visible' },
            score: { type: Type.NUMBER, description: 'Score out of 10 if visible, otherwise null' },
            displayText: { type: Type.STRING, description: "e.g. '8/10' or 'Not visible'" },
            comment: { type: Type.STRING, description: 'Editorial note on footwear or why not visible' },
          },
          required: ['visible', 'displayText', 'comment'],
        },
        accessories: {
          type: Type.OBJECT,
          properties: {
            visible: { type: Type.BOOLEAN, description: 'True if accessories are clearly visible' },
            score: { type: Type.NUMBER, description: 'Score out of 10 if visible, otherwise null' },
            displayText: { type: Type.STRING, description: "e.g. '7/10' or 'Not visible'" },
            comment: { type: Type.STRING, description: 'Editorial note on accessories or why not visible' },
          },
          required: ['visible', 'displayText', 'comment'],
        },
        overallStyling: {
          type: Type.NUMBER,
          description: 'Overall Styling score out of 10',
        },
        aiStylistSays: {
          type: Type.STRING,
          description: 'Polished editorial critique and style takeaway by the AI stylist',
        },
        keep: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Exactly 3 recommendations of what to keep',
        },
        change: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Exactly 2 recommendations of what to change or swap',
        },
        add: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Exactly 3 recommendations of what to add to complete the look',
        },
        glowUpPlan: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Exactly 3 numbered steps for the glow up plan',
        },
        visibleGarments: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Visible clothing pieces identified accurately',
        },
        colorPalette: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Colors detected in the outfit',
        },
        vibeAlignment: {
          type: Type.STRING,
          description: 'Summary of alignment with the chosen aesthetic and occasion',
        },
      },
      required: [
        'fitScore',
        'colorMatch',
        'outfitBalance',
        'shoes',
        'accessories',
        'overallStyling',
        'aiStylistSays',
        'keep',
        'change',
        'add',
        'glowUpPlan',
      ],
    };

    let lastError: any = null;
    let parsedData: any = null;

    // Model fallback & auto-retry loop:
    // Try each vision model, with up to 2 retries on 503 / UNAVAILABLE / high demand
    for (const modelName of VISION_MODELS) {
      let attempt = 0;
      const MAX_RETRIES = 2; // Initial attempt + 2 retries

      while (attempt <= MAX_RETRIES) {
        try {
          console.log(`Analyzing outfit with model: ${modelName} (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType: detectedMime,
                  },
                },
                {
                  text: promptText,
                },
              ],
            },
            config: {
              systemInstruction,
              temperature: 0.35,
              responseMimeType: 'application/json',
              responseSchema,
            },
          });

          const responseText = response.text;
          if (!responseText) {
            throw new Error('Gemini returned an empty response.');
          }

          parsedData = extractJson(responseText);
          break; // Success! Break retry loop
        } catch (err: any) {
          lastError = err;
          console.warn(`Attempt ${attempt + 1} with ${modelName} failed:`, err?.message || err);

          if (attempt < MAX_RETRIES && isRetryableError(err)) {
            attempt++;
            const backoffMs = attempt * 1200; // 1200ms, then 2400ms
            console.log(`Retrying in ${backoffMs}ms...`);
            await sleep(backoffMs);
          } else {
            // Retries for this model exhausted or error not retryable for this model
            break;
          }
        }
      }

      if (parsedData) {
        break; // Successfully got analysis from this model
      }
    }

    if (!parsedData) {
      console.error('All vision models failed:', lastError);
      return res.status(503).json({
        success: false,
        error: 'The AI styling service is experiencing high demand right now. Please click "Try Again" in a few moments.',
      });
    }

    // Normalize and sanitize fields to guarantee format integrity
    const analysis = {
      fitScore: typeof parsedData.fitScore === 'number' ? parsedData.fitScore : 7.5,
      colorMatch: typeof parsedData.colorMatch === 'number' ? parsedData.colorMatch : 8.0,
      outfitBalance: typeof parsedData.outfitBalance === 'number' ? parsedData.outfitBalance : 7.5,
      shoes: {
        visible: Boolean(parsedData.shoes?.visible),
        score: parsedData.shoes?.visible && typeof parsedData.shoes?.score === 'number' ? parsedData.shoes.score : null,
        displayText: parsedData.shoes?.visible
          ? (parsedData.shoes.displayText || `${parsedData.shoes.score || 8}/10`)
          : 'Not visible',
        comment: parsedData.shoes?.comment || (parsedData.shoes?.visible ? 'Shoes are styled nicely.' : 'Shoes are not visible in this frame.'),
      },
      accessories: {
        visible: Boolean(parsedData.accessories?.visible),
        score: parsedData.accessories?.visible && typeof parsedData.accessories?.score === 'number' ? parsedData.accessories.score : null,
        displayText: parsedData.accessories?.visible
          ? (parsedData.accessories.displayText || `${parsedData.accessories.score || 7}/10`)
          : 'Not visible',
        comment: parsedData.accessories?.comment || (parsedData.accessories?.visible ? 'Accessories complement the look.' : 'No accessories are clearly visible.'),
      },
      overallStyling: typeof parsedData.overallStyling === 'number' ? parsedData.overallStyling : 8.0,
      aiStylistSays: parsedData.aiStylistSays || 'A stylish ensemble that exhibits great visual personality.',
      keep: Array.isArray(parsedData.keep) ? parsedData.keep.slice(0, 3) : ['The foundational silhouette', 'The primary color combination', 'The overall balance'],
      change: Array.isArray(parsedData.change) ? parsedData.change.slice(0, 2) : ['Tuck or taper for sharper lines', 'Adjust proportions to balance the silhouette'],
      add: Array.isArray(parsedData.add) ? parsedData.add.slice(0, 3) : ['A structured outerwear layer', 'A complementary leather or metal accessory', 'Subtle footwear refinement'],
      glowUpPlan: Array.isArray(parsedData.glowUpPlan) ? parsedData.glowUpPlan.slice(0, 3) : [
        'Fine-tune the drape and break of the hems.',
        'Incorporate one focal texture or statement detail.',
        'Tie the color palette together with a cohesive accessory.',
      ],
      visibleGarments: Array.isArray(parsedData.visibleGarments) ? parsedData.visibleGarments : [],
      colorPalette: Array.isArray(parsedData.colorPalette) ? parsedData.colorPalette : [],
      vibeAlignment: parsedData.vibeAlignment || `Tailored for ${occasion} with a ${styleVibe} attitude.`,
    };

    return res.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Error analyzing fit:', error);
    return res.status(500).json({
      success: false,
      error: 'An unexpected issue occurred while analyzing the outfit. Please try again.',
    });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist'))
      ? path.join(process.cwd(), 'dist')
      : process.cwd();
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FitCheck AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
