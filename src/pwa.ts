import { registerSW } from 'virtual:pwa-register';

export function registerPWA() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    return registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('[FitCheck PWA] New update available.');
      },
      onOfflineReady() {
        console.log('[FitCheck PWA] App shell cached and ready for offline use.');
      },
      onRegisterError(error) {
        console.warn('[FitCheck PWA] Service worker registration error:', error);
      },
    });
  }
}
