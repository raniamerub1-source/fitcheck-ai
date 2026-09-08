import React from 'react';
import { Sparkles, Shirt, RefreshCw } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentScreen: 'landing' | 'upload' | 'loading' | 'results';
  onNavigateHome: () => void;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentScreen, onNavigateHome, onReset }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 bg-[#FBFBF9]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          id="nav-brand-button"
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 text-left group transition focus:outline-none"
        >
          <div className="w-9 h-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center shadow-sm group-hover:bg-neutral-800 transition">
            <Shirt className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-editorial text-2xl font-bold tracking-tight text-neutral-900 leading-none">
                FitCheck
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-800">
                AI
              </span>
            </div>
            <p className="text-[10px] tracking-wider uppercase text-neutral-500 font-medium">
              Personal Outfit Stylist
            </p>
          </div>
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-neutral-600 bg-neutral-100/80 px-3 py-1.5 rounded-full border border-neutral-200/60">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Vision Intelligence</span>
          </div>

          <PWAInstallButton />

          {currentScreen === 'results' && (
            <button
              id="nav-new-fit-button"
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 transition shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check New Fit</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
