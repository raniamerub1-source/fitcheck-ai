import React from 'react';
import { ArrowRight, Sparkles, CheckCircle2, Sliders, Eye, Wand2 } from 'lucide-react';
import { SAMPLE_OUTFITS, OCCASIONS, STYLE_VIBES, SampleOutfit } from '../data/sampleOutfits';

interface LandingScreenProps {
  onStart: () => void;
  onSelectSample: (sample: SampleOutfit) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStart, onSelectSample }) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-6 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Haute Vision Outfit Analysis</span>
        </div>

        <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-neutral-950 leading-[1.08] mb-6">
          Your AI-powered outfit stylist.
        </h1>

        <p className="text-lg sm:text-xl text-neutral-600 font-normal leading-relaxed mb-10 max-w-2xl mx-auto">
          Upload any outfit photo, pick your occasion and target vibe. Receive an honest, discerning fashion critique—tailoring fit, color balance, visible footwear, and a concrete Glow Up Plan.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="landing-cta-start"
            onClick={onStart}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-neutral-950 text-white font-medium text-base hover:bg-neutral-800 transition duration-200 shadow-md hover:shadow-lg active:scale-[0.99]"
          >
            <span>Check My Fit</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="#sample-looks"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 rounded-full bg-white border border-neutral-300 text-neutral-800 font-medium text-base hover:bg-neutral-50 transition duration-200"
          >
            Explore Sample Looks
          </a>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        <div className="bg-white rounded-2xl p-7 border border-neutral-200/80 shadow-xs hover:shadow-sm transition">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 mb-5">
            <Eye className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="font-editorial text-2xl font-bold text-neutral-900 mb-2">
            Real Vision Grounding
          </h3>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Never hallucinated. FitCheck AI strictly evaluates what is physically visible in your image. If shoes or accessories are cropped out, it accurately states &ldquo;Not visible.&rdquo;
          </p>
        </div>

        <div className="bg-white rounded-2xl p-7 border border-neutral-200/80 shadow-xs hover:shadow-sm transition">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 mb-5">
            <Sliders className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="font-editorial text-2xl font-bold text-neutral-900 mb-2">
            Occasion & Vibe Calibration
          </h3>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Tailored specifically for 7 occasions (from Casual to Wedding) and 8 aesthetics (Old Money, Minimal, Streetwear, Y2K, and more) to align with your personal intent.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-7 border border-neutral-200/80 shadow-xs hover:shadow-sm transition">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 mb-5">
            <Wand2 className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="font-editorial text-2xl font-bold text-neutral-900 mb-2">
            Actionable Glow Up Plan
          </h3>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Beyond scores, get a tailored 3-step action plan, 3 garments to KEEP, 2 high-impact items to CHANGE, and 3 tasteful styling pieces to ADD.
          </p>
        </div>
      </div>

      {/* Occasions & Aesthetics Showcase Bar */}
      <div className="bg-neutral-900 text-white rounded-3xl p-8 sm:p-12 mb-20">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <p className="text-xs uppercase tracking-widest text-neutral-400 font-semibold mb-2">
            Curated Styling Matrix
          </p>
          <h2 className="font-editorial text-3xl sm:text-4xl font-bold mb-4">
            Critiques calibrated to your exact setting
          </h2>
          <p className="text-neutral-300 text-sm sm:text-base max-w-xl mx-auto">
            A wedding look requires different tailoring and formality than streetwear or campus casual. FitCheck AI adjusts its critique accordingly.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-3 text-center sm:text-left">
              7 Occasions Supported:
            </span>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {OCCASIONS.map((occ) => (
                <span
                  key={occ.id}
                  className="px-3.5 py-1.5 rounded-full bg-neutral-800 text-neutral-200 text-xs font-medium border border-neutral-700"
                >
                  {occ.label}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-3 text-center sm:text-left">
              8 Style Vibes Supported:
            </span>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {STYLE_VIBES.map((vibe) => (
                <span
                  key={vibe.id}
                  className="px-3.5 py-1.5 rounded-full bg-neutral-800/90 text-neutral-200 text-xs font-medium border border-neutral-700"
                >
                  {vibe.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sample Outfits Section */}
      <div id="sample-looks" className="mb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">
              Instant Test
            </span>
            <h2 className="font-editorial text-3xl font-bold text-neutral-900 mt-1">
              Try with a curated sample outfit
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              Don&rsquo;t have a photo on hand? Select any look below to test the AI stylist immediately.
            </p>
          </div>

          <button
            id="sample-upload-cta"
            onClick={onStart}
            className="self-start sm:self-auto inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 hover:text-neutral-700 underline underline-offset-4"
          >
            <span>Or upload your own photo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SAMPLE_OUTFITS.map((sample) => (
            <div
              key={sample.id}
              className="group bg-white rounded-2xl overflow-hidden border border-neutral-200/80 shadow-xs hover:shadow-md transition flex flex-col"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
                <img
                  src={sample.imageUrl}
                  alt={sample.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span className="px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-white text-[11px] font-semibold tracking-wide">
                    {sample.styleVibe}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-neutral-900 text-[10px] font-medium tracking-wide">
                    {sample.occasion}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-editorial text-lg font-bold text-neutral-900 mb-1 leading-snug">
                    {sample.name}
                  </h4>
                  <p className="text-xs text-neutral-500 line-clamp-2 mb-4 leading-relaxed">
                    {sample.description}
                  </p>
                </div>

                <button
                  id={`select-sample-${sample.id}`}
                  onClick={() => onSelectSample(sample)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-900 text-xs font-semibold transition duration-200"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze This Look</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fashion Editorial Footer Note */}
      <div className="border-t border-neutral-200 pt-8 pb-4 text-center text-xs text-neutral-500">
        <p>FitCheck AI assesses only visible garments and styling execution. Respectful, objective, and constructive fashion guidance.</p>
      </div>
    </div>
  );
};
