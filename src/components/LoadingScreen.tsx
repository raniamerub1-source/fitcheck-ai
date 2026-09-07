import React, { useEffect, useState } from 'react';
import { Sparkles, Scan, Palette, Shirt, CheckCircle } from 'lucide-react';
import { Occasion, StyleVibe } from '../types';

interface LoadingScreenProps {
  imagePreview: string | null;
  occasion: Occasion;
  styleVibe: StyleVibe;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  imagePreview,
  occasion,
  styleVibe,
}) => {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    { label: 'Analyzing your fit...', sub: 'Checking colors, balance & styling...' },
    { label: 'Scanning silhouette drape...', sub: 'Evaluating garment tailoring and proportions...' },
    { label: 'Inspecting footwear & accessories...', sub: 'Checking if shoes & accents are visible in frame...' },
    { label: `Calibrating for ${occasion}...`, sub: `Testing aesthetic adherence to ${styleVibe} standards...` },
    { label: 'Synthesizing recommendations...', sub: 'Finalizing KEEP, CHANGE, ADD and your Glow Up Plan...' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2400);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
      {/* Scanner Visual Container */}
      <div className="relative w-64 h-84 sm:w-72 sm:h-96 rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 bg-neutral-950 mb-8">
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Outfit being analyzed"
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600 bg-neutral-900">
            <Shirt className="w-16 h-16 stroke-[1]" />
          </div>
        )}

        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

        {/* Fashion Scanner Line with glow */}
        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.9)] animate-scan-line pointer-events-none z-10" />

        {/* Subtle grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>AI SCAN ACTIVE</span>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-neutral-300 text-[10px] font-mono">
            {styleVibe}
          </div>
        </div>

        {/* Bottom Details Overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-20 text-left">
          <p className="text-[10px] uppercase tracking-widest text-amber-300 font-semibold mb-0.5">
            Target Setting
          </p>
          <p className="text-sm font-bold text-white leading-tight">
            {occasion} &bull; {styleVibe}
          </p>
        </div>
      </div>

      {/* Primary Status Text */}
      <div className="max-w-md mx-auto mb-8">
        <h3 className="font-editorial text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-2 transition-all">
          {steps[stepIndex].label}
        </h3>
        <p className="text-sm sm:text-base text-neutral-500 font-normal">
          {steps[stepIndex].sub}
        </p>
      </div>

      {/* Progress Dots / Steps */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === stepIndex
                ? 'w-8 bg-neutral-900'
                : i < stepIndex
                ? 'w-3 bg-neutral-400'
                : 'w-3 bg-neutral-200'
            }`}
          />
        ))}
      </div>

      <div className="inline-flex items-center gap-2 text-xs font-medium text-neutral-400">
        <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
        <span>Powered by Gemini Multimodal Vision Intelligence</span>
      </div>
    </div>
  );
};
