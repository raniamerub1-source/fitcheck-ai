/**
 * FitCheck AI - Cloudflare Worker API Endpoint
 *
 * Full-stack Cloudflare Worker compatible handler for FitCheck AI:
 * - GET /api/health: Health check endpoint
 * - POST /api/analyze-fit: Real Gemini vision outfit critique with zero mock fallbacks
 * - Static Assets fallback via env.ASSETS
 *
 * Uses Cloudflare Worker secret GEMINI_API_KEY (never exposed client-side).
 */

export interface Env {
  GEMINI_API_KEY?: string;
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export interface OutfitAnalysis {
  fitScore: number;
  colorMatch: number;
  outfitBalance: number;
  shoes: {
    visible: boolean;
    score: number | null;
    displayText: string;
    comment: string;
  };
  accessories: {
    visible: boolean;
    score: number | null;
    displayText: string;
    comment: string;
  };
  overallStyling: number;
  aiStylistSays: string;
  keep: string[];
  change: string[];
  add: string[];
  glowUpPlan: string[];
  visibleGarments: string[];
  colorPalette: string[];
  vibeAlignment: string;
}

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Supported Gemini vision models in priority order
const VISION_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number, message?: string): boolean {
  if (status === 503 || status === 429 || status === 500 || status === 502 || status === 504) {
    return true;
  }
  const msg = (message || '').toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('overload') ||
    msg.includes('high demand') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted')
  );
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
    throw new Error('Could not parse JSON from Gemini vision response.');
  }
}

/**
 * Handle GET /api/health
 */
export function handleHealth(): Response {
  return new Response(
    JSON.stringify({ status: 'ok', service: 'FitCheck AI Stylist Worker' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

/**
 * Handle POST /api/analyze-fit
 */
export async function handleAnalyzeFit(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed. Please use POST.' }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  // Retrieve GEMINI_API_KEY from Cloudflare Worker secret or process.env fallback
  const apiKey =
    env.GEMINI_API_KEY ||
    (typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : '');

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'GEMINI_API_KEY is not configured in the Cloudflare Worker environment secret.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  // Parse JSON body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON request payload.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  const { image, mimeType, occasion, styleVibe } = body || {};

  if (!image || typeof image !== 'string') {
    return new Response(
      JSON.stringify({ success: false, error: 'Please upload an outfit photo to begin analysis.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  if (!occasion || !styleVibe) {
    return new Response(
      JSON.stringify({ success: false, error: 'Occasion and Style/Vibe selection are required.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  // Clean and extract base64 data and mimeType
  let cleanBase64 = image;
  let detectedMime = mimeType || 'image/jpeg';
  if (image.startsWith('data:')) {
    const match = image.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      detectedMime = match[1];
      cleanBase64 = match[2];
    }
  }

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
    type: 'OBJECT',
    properties: {
      fitScore: {
        type: 'NUMBER',
        description: 'Fit Score out of 10 assessing tailoring, silhouette drape, and fit',
      },
      colorMatch: {
        type: 'NUMBER',
        description: 'Color Match score out of 10 assessing color harmony and contrast',
      },
      outfitBalance: {
        type: 'NUMBER',
        description: 'Outfit Balance score out of 10 assessing volume, proportion, and visual weight',
      },
      shoes: {
        type: 'OBJECT',
        properties: {
          visible: { type: 'BOOLEAN', description: 'True if shoes are clearly visible' },
          score: { type: 'NUMBER', description: 'Score out of 10 if visible, otherwise null' },
          displayText: { type: 'STRING', description: "e.g. '8/10' or 'Not visible'" },
          comment: { type: 'STRING', description: 'Editorial note on footwear or why not visible' },
        },
        required: ['visible', 'displayText', 'comment'],
      },
      accessories: {
        type: 'OBJECT',
        properties: {
          visible: { type: 'BOOLEAN', description: 'True if accessories are clearly visible' },
          score: { type: 'NUMBER', description: 'Score out of 10 if visible, otherwise null' },
          displayText: { type: 'STRING', description: "e.g. '7/10' or 'Not visible'" },
          comment: { type: 'STRING', description: 'Editorial note on accessories or why not visible' },
        },
        required: ['visible', 'displayText', 'comment'],
      },
      overallStyling: {
        type: 'NUMBER',
        description: 'Overall Styling score out of 10',
      },
      aiStylistSays: {
        type: 'STRING',
        description: 'Polished editorial critique and style takeaway by the AI stylist',
      },
      keep: {
        type: 'ARRAY',
        items: { type: 'STRING' },
        description: 'Exactly 3 recommendations of what to keep',
      },
      change: {
        type: 'ARRAY',
        items: { type: 'STRING' },
        description: 'Exactly 2 recommendations of what to change or swap',
      },
      add: {
        type: 'ARRAY',
        items: { type: 'STRING' },
        description: 'Exactly 3 recommendations of what to add to complete the look',
      },
      glowUpPlan: {
        type: 'ARRAY',
        items: { type: 'STRING' },
        description: 'Exactly 3 numbered steps for the glow up plan',
      },
      visibleGarments: {
        type: 'ARRAY',
        items: { type: 'STRING' },
        description: 'Visible clothing pieces identified accurately',
      },
      colorPalette: {
        type: 'ARRAY',
        items: { type: 'STRING' },
        description: 'Colors detected in the outfit',
      },
      vibeAlignment: {
        type: 'STRING',
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

  // Multi-model vision retry loop
  for (const modelName of VISION_MODELS) {
    let attempt = 0;
    const MAX_RETRIES = 2;

    while (attempt <= MAX_RETRIES) {
      try {
        console.log(`Analyzing outfit with model ${modelName} (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: detectedMime,
                      data: cleanBase64,
                    },
                  },
                  {
                    text: promptText,
                  },
                ],
              },
            ],
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            generationConfig: {
              temperature: 0.35,
              responseMimeType: 'application/json',
              responseSchema,
            },
          }),
        });

        if (!geminiResponse.ok) {
          const errBody = await geminiResponse.text().catch(() => '');
          console.warn(`Model ${modelName} returned status ${geminiResponse.status}: ${errBody}`);

          if (isRetryableStatus(geminiResponse.status, errBody) && attempt < MAX_RETRIES) {
            attempt++;
            const backoffMs = attempt * 1200;
            await sleep(backoffMs);
            continue;
          } else {
            lastError = new Error(`Gemini API status ${geminiResponse.status}: ${errBody}`);
            break;
          }
        }

        const data: any = await geminiResponse.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!candidateText) {
          throw new Error('Gemini returned an empty candidate content.');
        }

        parsedData = extractJson(candidateText);

        // STRICT VALIDATION: Ensure all required fields exist directly from the Gemini model
        // No mock fallbacks allowed!
        if (
          typeof parsedData.fitScore !== 'number' ||
          typeof parsedData.colorMatch !== 'number' ||
          typeof parsedData.outfitBalance !== 'number' ||
          typeof parsedData.overallStyling !== 'number' ||
          !parsedData.shoes ||
          typeof parsedData.shoes.visible !== 'boolean' ||
          !parsedData.accessories ||
          typeof parsedData.accessories.visible !== 'boolean' ||
          typeof parsedData.aiStylistSays !== 'string' ||
          !parsedData.aiStylistSays.trim() ||
          !Array.isArray(parsedData.keep) ||
          parsedData.keep.length < 3 ||
          !Array.isArray(parsedData.change) ||
          parsedData.change.length < 2 ||
          !Array.isArray(parsedData.add) ||
          parsedData.add.length < 3 ||
          !Array.isArray(parsedData.glowUpPlan) ||
          parsedData.glowUpPlan.length < 3
        ) {
          throw new Error('Incomplete data received from Gemini vision analysis.');
        }

        break; // Successfully obtained and validated response
      } catch (err: any) {
        lastError = err;
        console.warn(`Error on ${modelName} attempt ${attempt + 1}:`, err?.message || err);

        if (attempt < MAX_RETRIES && isRetryableStatus(500, err?.message)) {
          attempt++;
          await sleep(attempt * 1200);
        } else {
          break;
        }
      }
    }

    if (parsedData) {
      break;
    }
  }

  if (!parsedData) {
    console.error('All vision models failed:', lastError);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'The AI styling service is experiencing high demand right now. Please click "Try Again" in a few moments.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  // Format the real Gemini output without mock fallbacks
  const shoesVisible = Boolean(parsedData.shoes.visible);
  const shoesScore =
    shoesVisible && typeof parsedData.shoes.score === 'number' ? parsedData.shoes.score : null;
  const shoesDisplayText = shoesVisible
    ? (parsedData.shoes.displayText || (shoesScore !== null ? `${shoesScore}/10` : 'Visible'))
    : 'Not visible';

  const accVisible = Boolean(parsedData.accessories.visible);
  const accScore =
    accVisible && typeof parsedData.accessories.score === 'number'
      ? parsedData.accessories.score
      : null;
  const accDisplayText = accVisible
    ? (parsedData.accessories.displayText || (accScore !== null ? `${accScore}/10` : 'Visible'))
    : 'Not visible';

  const analysis: OutfitAnalysis = {
    fitScore: parsedData.fitScore,
    colorMatch: parsedData.colorMatch,
    outfitBalance: parsedData.outfitBalance,
    shoes: {
      visible: shoesVisible,
      score: shoesScore,
      displayText: shoesDisplayText,
      comment:
        parsedData.shoes.comment ||
        (shoesVisible ? 'Shoes styled as visible in frame.' : 'Shoes are not visible in this frame.'),
    },
    accessories: {
      visible: accVisible,
      score: accScore,
      displayText: accDisplayText,
      comment:
        parsedData.accessories.comment ||
        (accVisible ? 'Visible accessories complement the look.' : 'No accessories are clearly visible in this frame.'),
    },
    overallStyling: parsedData.overallStyling,
    aiStylistSays: parsedData.aiStylistSays,
    keep: parsedData.keep.slice(0, 3),
    change: parsedData.change.slice(0, 2),
    add: parsedData.add.slice(0, 3),
    glowUpPlan: parsedData.glowUpPlan.slice(0, 3),
    visibleGarments: Array.isArray(parsedData.visibleGarments) ? parsedData.visibleGarments : [],
    colorPalette: Array.isArray(parsedData.colorPalette) ? parsedData.colorPalette : [],
    vibeAlignment:
      parsedData.vibeAlignment || `Tailored for ${occasion} with a ${styleVibe} aesthetic.`,
  };

  return new Response(
    JSON.stringify({
      success: true,
      analysis,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

/**
 * Cloudflare Worker Default Fetch Handler
 */
export default {
  async fetch(request: Request, env: Env, ctx?: any): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Health check endpoint
    if (url.pathname === '/api/health') {
      return handleHealth();
    }

    // Analyze fit endpoint
    if (url.pathname === '/api/analyze-fit') {
      return handleAnalyzeFit(request, env);
    }

    // Digital Asset Links for Android TWA verification
    if (url.pathname === '/.well-known/assetlinks.json') {
      const assetLinks = [
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: 'com.fitcheck.ai',
            sha256_cert_fingerprints: [
              'FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C',
            ],
          },
        },
      ];
      return new Response(JSON.stringify(assetLinks, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Explicit /privacy URL rewrite for static asset serving
    if (url.pathname === '/privacy') {
      const privacyRequest = new Request(new URL('/privacy.html', request.url), request);
      if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
        return env.ASSETS.fetch(privacyRequest);
      }
    }

    // Cloudflare Workers Static Assets handler
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    // Fallback for missing API routes
    if (url.pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ success: false, error: 'API endpoint not found.' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    return new Response('Not found', { status: 404 });
  },
};
