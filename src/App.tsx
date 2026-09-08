/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { LandingScreen } from './components/LandingScreen';
import { UploadScreen } from './components/UploadScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Occasion, StyleVibe, OutfitAnalysis, AnalyzeRequest, AnalyzeResponse } from './types';
import { SampleOutfit } from './data/sampleOutfits';
import { AlertCircle, ArrowLeft, RotateCcw } from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'upload' | 'loading' | 'results'>('landing');
  const [selectedSample, setSelectedSample] = useState<SampleOutfit | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [occasion, setOccasion] = useState<Occasion>('Casual');
  const [styleVibe, setStyleVibe] = useState<StyleVibe>('Minimal');
  const [analysis, setAnalysis] = useState<OutfitAnalysis | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<{
    image: string;
    mimeType: string;
    occasion: Occasion;
    styleVibe: StyleVibe;
  } | null>(null);

  // User starts from landing page
  const handleStart = () => {
    setSelectedSample(null);
    setCurrentScreen('upload');
  };

  // User selects a sample outfit from landing page
  const handleSelectSample = (sample: SampleOutfit) => {
    setSelectedSample(sample);
    setImagePreview(sample.imageUrl);
    setOccasion(sample.occasion);
    setStyleVibe(sample.styleVibe);
    setCurrentScreen('upload');
  };

  // User triggers analysis from upload screen
  const handleAnalyze = async (payload: {
    image: string;
    mimeType: string;
    occasion: Occasion;
    styleVibe: StyleVibe;
  }) => {
    setApiError(null);
    setLastPayload(payload);
    setOccasion(payload.occasion);
    setStyleVibe(payload.styleVibe);

    // If image preview wasn't set from sample, create preview or keep existing
    if (!imagePreview) {
      setImagePreview(`data:${payload.mimeType};base64,${payload.image}`);
    }

    setCurrentScreen('loading');

    try {
      const response = await fetch('/api/analyze-fit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: payload.image,
          mimeType: payload.mimeType,
          occasion: payload.occasion,
          styleVibe: payload.styleVibe,
        } as AnalyzeRequest),
      });

      const data: AnalyzeResponse = await response.json();

      if (!response.ok || !data.success || !data.analysis) {
        const errorMsg = data.error || '';
        if (
          response.status === 503 ||
          errorMsg.toLowerCase().includes('high demand') ||
          errorMsg.toLowerCase().includes('unavailable') ||
          errorMsg.toLowerCase().includes('overload')
        ) {
          throw new Error('The AI styling service is experiencing high demand right now. Please click "Try Again" in a few moments.');
        }
        throw new Error(data.error || 'The stylist analysis could not be completed. Please try again.');
      }

      setAnalysis(data.analysis);
      setCurrentScreen('results');
    } catch (err: any) {
      console.error('Stylist API Error:', err);
      const userMessage =
        err?.message?.includes('high demand') || err?.message?.includes('503') || err?.message?.includes('unavailable')
          ? 'The AI styling service is experiencing high demand right now. Please click "Try Again" in a few moments.'
          : (err.message || 'The styling service is momentarily unavailable. Please click "Try Again".');
      setApiError(userMessage);
      setCurrentScreen('upload');
    }
  };

  const handleRetry = () => {
    if (lastPayload) {
      handleAnalyze(lastPayload);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setImagePreview(null);
    setSelectedSample(null);
    setLastPayload(null);
    setApiError(null);
    setCurrentScreen('upload');
  };

  const handleNavigateHome = () => {
    setCurrentScreen('landing');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] text-[#191919] selection:bg-neutral-900 selection:text-white">
      <Navbar
        currentScreen={currentScreen}
        onNavigateHome={handleNavigateHome}
        onReset={handleReset}
      />

      <main className="flex-1 flex flex-col">
        {/* API Error Notification with Try Again button */}
        {apiError && currentScreen === 'upload' && (
          <div className="max-w-4xl mx-auto w-full px-4 pt-6">
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-300/90 text-neutral-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-neutral-950">Stylist Service Notification</p>
                  <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">{apiError}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                {lastPayload && (
                  <button
                    id="btn-try-again-error"
                    onClick={handleRetry}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold transition shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                )}
                <button
                  onClick={() => setApiError(null)}
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-800 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Screen 1: Landing */}
        {currentScreen === 'landing' && (
          <LandingScreen
            onStart={handleStart}
            onSelectSample={handleSelectSample}
          />
        )}

        {/* Screen 2: Upload & Configure */}
        {currentScreen === 'upload' && (
          <div>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
              <button
                id="btn-back-to-landing"
                onClick={handleNavigateHome}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Overview</span>
              </button>
            </div>
            <UploadScreen
              onAnalyze={handleAnalyze}
              initialSample={selectedSample}
            />
          </div>
        )}

        {/* Screen 3: Loading */}
        {currentScreen === 'loading' && (
          <LoadingScreen
            imagePreview={imagePreview}
            occasion={occasion}
            styleVibe={styleVibe}
          />
        )}

        {/* Screen 4: Results */}
        {currentScreen === 'results' && analysis && (
          <ResultsScreen
            analysis={analysis}
            imagePreview={imagePreview}
            occasion={occasion}
            styleVibe={styleVibe}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-neutral-200/80 bg-white/50 py-6 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-editorial text-sm font-semibold text-neutral-800">
            FitCheck AI &mdash; Haute Vision Stylist
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-neutral-500">
            <span>Objective fashion critique calibrated exclusively to visible garments.</span>
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-700 hover:text-neutral-900 underline underline-offset-2 transition-colors font-medium"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
      {/* Offline Connectivity Status Toast */}
      <OfflineIndicator />
    </div>
  );
}
