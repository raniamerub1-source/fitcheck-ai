import React, { useState } from 'react';
import { Download, Smartphone, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already running in standalone PWA mode, hide the install button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow when browser fired beforeinstallprompt
  if (isInstallable) {
    return (
      <button
        id="btn-install-pwa"
        onClick={install}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 transition shadow-xs cursor-pointer"
        title="Install FitCheck AI App"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (WebKit does not support beforeinstallprompt)
  if (isIOS) {
    return (
      <>
        <button
          id="btn-install-pwa-ios"
          onClick={() => setShowIOSModal(true)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300/80 transition cursor-pointer"
          title="Install FitCheck AI on iOS"
        >
          <Smartphone className="w-3.5 h-3.5 text-neutral-600" />
          <span>Install App</span>
        </button>

        {showIOSModal && (
          <div
            id="modal-ios-install"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setShowIOSModal(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-[#FBFBF9] border border-neutral-200 p-6 shadow-2xl text-neutral-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-950">Install FitCheck AI</h3>
                    <p className="text-[11px] text-neutral-500">For iPhone & iPad</p>
                  </div>
                </div>
                <button
                  id="btn-close-ios-install-modal"
                  onClick={() => setShowIOSModal(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-neutral-700 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <p>
                    Tap the <strong className="text-neutral-950 font-semibold inline-flex items-center gap-1"><Share className="w-3 h-3 inline" /> Share</strong> icon in your Safari bottom toolbar.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <p>
                    Scroll down and select <strong className="text-neutral-950 font-semibold">"Add to Home Screen"</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <p>
                    Tap <strong className="text-neutral-950 font-semibold">"Add"</strong> in the top-right corner to launch FitCheck AI in full standalone mode.
                  </p>
                </div>
              </div>

              <button
                id="btn-dismiss-ios-guide"
                onClick={() => setShowIOSModal(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
