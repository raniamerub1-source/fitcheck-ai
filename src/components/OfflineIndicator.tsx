import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-banner"
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center gap-2.5 rounded-xl bg-neutral-900/95 text-white px-4 py-2.5 text-xs font-medium shadow-lg backdrop-blur-xs border border-neutral-700 animate-in slide-in-from-bottom-2 duration-300"
    >
      <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
        <WifiOff className="w-3.5 h-3.5" />
      </div>
      <div>
        <p className="font-semibold text-white">Offline Mode</p>
        <p className="text-[11px] text-neutral-300">
          App shell cached. An active connection is needed to analyze new fits.
        </p>
      </div>
    </div>
  );
};
