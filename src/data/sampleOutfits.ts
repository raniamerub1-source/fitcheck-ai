import { Occasion, StyleVibe } from '../types';

export interface SampleOutfit {
  id: string;
  name: string;
  occasion: Occasion;
  styleVibe: StyleVibe;
  imageUrl: string;
  description: string;
}

export const SAMPLE_OUTFITS: SampleOutfit[] = [
  {
    id: 'old-money-blazer',
    name: 'Tailored Linen Blazer & Trousers',
    occasion: 'Work',
    styleVibe: 'Old Money',
    description: 'Crisp cream double-breasted blazer paired with pleated ecru trousers and leather loafers.',
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'streetwear-oversized',
    name: 'Oversized Trench & Relaxed Denim',
    occasion: 'Casual',
    styleVibe: 'Streetwear',
    description: 'Urban silhouette featuring dropped shoulders, raw-hem wide leg denim, and layered essentials.',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'minimal-date-look',
    name: 'Monochrome Slate Knit & Tailored Slacks',
    occasion: 'Date',
    styleVibe: 'Minimal',
    description: 'Clean high-neck fine gauge knit, fluid pleated trousers, minimalist leather Chelsea boots.',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'clean-girl-coat',
    name: 'Neutral Trench & Structured Tote',
    occasion: 'College',
    styleVibe: 'Clean Girl',
    description: 'Warm camel wool-blend coat, crisp white crewneck base, gold hoop accents and sleek sneakers.',
    imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80',
  },
];

export const OCCASIONS: { id: Occasion; label: string; desc: string }[] = [
  { id: 'Casual', label: 'Casual', desc: 'Everyday effortless & relaxed' },
  { id: 'College', label: 'College', desc: 'Campus-ready comfortable & cool' },
  { id: 'Work', label: 'Work', desc: 'Professional, sharp & polished' },
  { id: 'Date', label: 'Date', desc: 'Charming, memorable & refined' },
  { id: 'Party', label: 'Party', desc: 'High-energy, expressive & bold' },
  { id: 'Wedding', label: 'Wedding', desc: 'Celebratory, respectful & elegant' },
  { id: 'Formal', label: 'Formal', desc: 'Black tie & gala sophistication' },
];

export const STYLE_VIBES: { id: StyleVibe; label: string; desc: string; tag: string }[] = [
  { id: 'Old Money', label: 'Old Money', desc: 'Quiet luxury, heritage tailoring, neutrals', tag: 'Heritage' },
  { id: 'Minimal', label: 'Minimal', desc: 'Clean lines, zero clutter, curated silhouettes', tag: 'Understated' },
  { id: 'Streetwear', label: 'Streetwear', desc: 'Relaxed proportions, sneakers, graphic edge', tag: 'Contemporary' },
  { id: 'Y2K', label: 'Y2K', desc: 'Playful nostalgia, low-rise, metallics, vibrant', tag: 'Retro Future' },
  { id: 'Soft Girl', label: 'Soft Girl', desc: 'Pastel palettes, knit textures, gentle romance', tag: 'Whimsical' },
  { id: 'Clean Girl', label: 'Clean Girl', desc: 'Sleek basics, gold accents, fresh effortless poise', tag: 'Aesthetic' },
  { id: 'Classic', label: 'Classic', desc: 'Timeless staples, crisp shirting, balanced cuts', tag: 'Enduring' },
  { id: 'Trendy', label: 'Trendy', desc: 'Current runway cues, statement cuts, bold layering', tag: 'Runway' },
];
