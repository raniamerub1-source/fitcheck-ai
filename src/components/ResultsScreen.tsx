import React, { useState } from 'react';
import {
  Sparkles,
  RotateCcw,
  Share2,
  Check,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Footprints,
  Watch,
  Palette,
  Layers,
  Award,
  Quote,
  Copy,
} from 'lucide-react';
import { OutfitAnalysis, Occasion, StyleVibe } from '../types';

interface ResultsScreenProps {
  analysis: OutfitAnalysis;
  imagePreview: string | null;
  occasion: Occasion;
  styleVibe: StyleVibe;
  onReset: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  analysis,
  imagePreview,
  occasion,
  styleVibe,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);

  // Score tier evaluator
  const getScoreVerdict = (score: number) => {
    if (score >= 9.0) return { label: 'Couture Grade', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (score >= 8.0) return { label: 'Elevated & Harmonious', color: 'text-neutral-900 bg-neutral-100 border-neutral-300' };
    if (score >= 7.0) return { label: 'Solid Everyday Style', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    return { label: 'Opportunity for Refinement', color: 'text-amber-800 bg-amber-50 border-amber-200' };
  };

  const scoreVerdict = getScoreVerdict(analysis.fitScore);

  const handleShare = async () => {
    const summaryText = `FitCheck AI Analysis
Occasion: ${occasion} | Vibe: ${styleVibe}
Overall Fit Score: ${analysis.fitScore}/10 (${scoreVerdict.label})
Color Match: ${analysis.colorMatch}/10
Outfit Balance: ${analysis.outfitBalance}/10
Overall Styling: ${analysis.overallStyling}/10
Shoes: ${analysis.shoes.displayText}
Accessories: ${analysis.accessories.displayText}

AI Stylist Says: "${analysis.aiStylistSays}"

Glow Up Plan:
1. ${analysis.glowUpPlan[0] || ''}
2. ${analysis.glowUpPlan[1] || ''}
3. ${analysis.glowUpPlan[2] || ''}

Analyzed with FitCheck AI`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My FitCheck AI Outfit Analysis',
          text: summaryText,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Top Banner: ANALYSIS COMPLETE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-neutral-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 text-white text-[11px] font-bold uppercase tracking-widest mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ANALYSIS COMPLETE</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-neutral-950">
            Stylist Assessment Report
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-share-fit"
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-semibold shadow-xs transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share My Fit</span>
              </>
            )}
          </button>

          <button
            id="btn-check-another"
            onClick={onReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Check Another Outfit</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
        {/* Left Column: Image & Garment Metadata (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Photo Frame */}
          <div className="bg-white rounded-3xl p-3 border border-neutral-200/90 shadow-sm overflow-hidden">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-950">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Analyzed outfit"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-500">
                  <span>Photo not available</span>
                </div>
              )}

              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                <span className="px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-white text-[11px] font-semibold tracking-wide">
                  {styleVibe}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-white/95 backdrop-blur-md text-neutral-900 text-[10px] font-medium tracking-wide">
                  {occasion}
                </span>
              </div>
            </div>

            {analysis.vibeAlignment && (
              <p className="text-xs text-neutral-600 font-medium italic mt-3 px-2 leading-relaxed">
                &ldquo;{analysis.vibeAlignment}&rdquo;
              </p>
            )}
          </div>

          {/* Detected Palette & Garments Card */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/90 shadow-xs space-y-5">
            {analysis.colorPalette && analysis.colorPalette.length > 0 && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block mb-2.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Visible Color Palette</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.colorPalette.map((color, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-medium border border-neutral-200/60"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.visibleGarments && analysis.visibleGarments.length > 0 && (
              <div className="border-t border-neutral-100 pt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block mb-2.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Identified Pieces</span>
                </span>
                <ul className="space-y-1.5">
                  {analysis.visibleGarments.map((item, idx) => (
                    <li key={idx} className="text-xs text-neutral-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Scores & Recommendations (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Main Hero Fit Score Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-neutral-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 block mb-1">
                  Primary Evaluation
                </span>
                <h3 className="font-editorial text-3xl font-bold text-neutral-900">
                  Overall Fit Score
                </h3>
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border border-neutral-200 bg-neutral-50 text-neutral-800">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>{scoreVerdict.label}</span>
                </div>
              </div>

              {/* Large Score Dial Badge */}
              <div className="flex items-baseline gap-1 self-start sm:self-auto bg-neutral-950 text-white px-7 py-5 rounded-2xl shadow-sm">
                <span className="font-editorial text-5xl sm:text-6xl font-bold leading-none tracking-tight text-white">
                  {analysis.fitScore}
                </span>
                <span className="text-xl sm:text-2xl font-light text-neutral-400">
                  /10
                </span>
              </div>
            </div>

            {/* Score Breakdown Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-6">
              {/* Color Match */}
              <div className="bg-neutral-50/90 rounded-2xl p-4 border border-neutral-200/80 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-neutral-700">Color Match</span>
                  <Palette className="w-4 h-4 text-neutral-500" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-neutral-900 font-editorial">
                    {analysis.colorMatch}
                  </span>
                  <span className="text-xs text-neutral-500">/10</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-neutral-900 h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, analysis.colorMatch * 10)}%` }}
                  />
                </div>
              </div>

              {/* Outfit Balance */}
              <div className="bg-neutral-50/90 rounded-2xl p-4 border border-neutral-200/80 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-neutral-700">Outfit Balance</span>
                  <Layers className="w-4 h-4 text-neutral-500" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-neutral-900 font-editorial">
                    {analysis.outfitBalance}
                  </span>
                  <span className="text-xs text-neutral-500">/10</span>
                </div>
                <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-neutral-900 h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, analysis.outfitBalance * 10)}%` }}
                  />
                </div>
              </div>

              {/* Overall Styling */}
              <div className="bg-neutral-50/90 rounded-2xl p-4 border border-neutral-200/80 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-neutral-700">Overall Styling</span>
                  <TrendingUp className="w-4 h-4 text-neutral-500" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-neutral-900 font-editorial">
                    {analysis.overallStyling}
                  </span>
                  <span className="text-xs text-neutral-500">/10</span>
                </div>
                <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-neutral-900 h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, analysis.overallStyling * 10)}%` }}
                  />
                </div>
              </div>

              {/* Shoes Card (Rate or Not visible) */}
              <div className="bg-neutral-50/90 rounded-2xl p-4 border border-neutral-200/80 flex flex-col justify-between sm:col-span-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-neutral-700">Shoes</span>
                  <Footprints className="w-4 h-4 text-neutral-500" />
                </div>
                <div>
                  {analysis.shoes.visible && analysis.shoes.score !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-neutral-900 font-editorial">
                        {analysis.shoes.score}
                      </span>
                      <span className="text-xs text-neutral-500">/10</span>
                    </div>
                  ) : (
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-neutral-200 text-neutral-700 text-xs font-semibold">
                      Not visible
                    </span>
                  )}
                  <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2 leading-snug">
                    {analysis.shoes.comment}
                  </p>
                </div>
              </div>

              {/* Accessories Card (Rate or Not visible) */}
              <div className="bg-neutral-50/90 rounded-2xl p-4 border border-neutral-200/80 flex flex-col justify-between sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-neutral-700">Accessories</span>
                  <Watch className="w-4 h-4 text-neutral-500" />
                </div>
                <div>
                  {analysis.accessories.visible && analysis.accessories.score !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-neutral-900 font-editorial">
                        {analysis.accessories.score}
                      </span>
                      <span className="text-xs text-neutral-500">/10</span>
                    </div>
                  ) : (
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-neutral-200 text-neutral-700 text-xs font-semibold">
                      Not visible
                    </span>
                  )}
                  <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2 leading-snug">
                    {analysis.accessories.comment}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Stylist Says Quote Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-xs relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                <Quote className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-editorial text-xl font-bold text-neutral-900">
                  AI Stylist Says
                </h4>
                <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                  Editorial Critique &amp; Takeaway
                </p>
              </div>
            </div>

            <p className="font-editorial text-lg sm:text-xl text-neutral-800 leading-relaxed italic">
              &ldquo;{analysis.aiStylistSays}&rdquo;
            </p>
          </div>

          {/* Recommendations Breakdown: KEEP, CHANGE, ADD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* KEEP — 3 recommendations */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">
                      KEEP
                    </h4>
                    <span className="text-[10px] text-neutral-500 font-medium">
                      3 Core Strengths
                    </span>
                  </div>
                </div>

                <ul className="space-y-3">
                  {analysis.keep.map((rec, i) => (
                    <li key={i} className="text-xs text-neutral-700 flex items-start gap-2.5 leading-relaxed">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                        &check;
                      </span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CHANGE — 2 recommendations */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">
                      CHANGE
                    </h4>
                    <span className="text-[10px] text-neutral-500 font-medium">
                      2 High-Impact Edits
                    </span>
                  </div>
                </div>

                <ul className="space-y-3">
                  {analysis.change.map((rec, i) => (
                    <li key={i} className="text-xs text-neutral-700 flex items-start gap-2.5 leading-relaxed">
                      <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                        &bull;
                      </span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ADD — 3 recommendations */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">
                      ADD
                    </h4>
                    <span className="text-[10px] text-neutral-500 font-medium">
                      3 Tasteful Accents
                    </span>
                  </div>
                </div>

                <ul className="space-y-3">
                  {analysis.add.map((rec, i) => (
                    <li key={i} className="text-xs text-neutral-700 flex items-start gap-2.5 leading-relaxed">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                        +
                      </span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Glow Up Plan — 3 Numbered Steps */}
          <div className="bg-neutral-950 text-white rounded-3xl p-6 sm:p-8 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-1">
                  Stylist Masterclass
                </span>
                <h3 className="font-editorial text-2xl sm:text-3xl font-bold">
                  Glow Up Plan
                </h3>
              </div>
              <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.glowUpPlan.map((step, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between"
                >
                  <div>
                    <span className="font-editorial text-3xl font-bold text-neutral-500 mb-2 block leading-none">
                      0{idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed">
                      {step}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action CTA Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-neutral-200/90 shadow-xs">
            <div>
              <h4 className="font-bold text-neutral-900 text-sm">
                Ready for your next outfit critique?
              </h4>
              <p className="text-xs text-neutral-500">
                Test another variation, swap shoes, or experiment with a different aesthetic vibe.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                id="footer-share-fit"
                onClick={handleShare}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy Summary'}</span>
              </button>

              <button
                id="footer-check-another"
                onClick={onReset}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Check Another Outfit</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
