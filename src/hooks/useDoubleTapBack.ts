import { useEffect, useRef } from 'react';
import { BackHandler, Platform } from 'react-native';

interface UseDoubleTapBackProps {
  canGoBack: boolean;
  onGoBack: () => void;
  currentPath?: string;
  onShowToast: (message: string) => void;
}

export function useDoubleTapBack({
  canGoBack,
  onGoBack,
  currentPath = '',
  onShowToast,
}: UseDoubleTapBackProps) {
  const lastBackPressTime = useRef<number>(0);

  // 1. Android Native BackHandler Interception
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onHardwareBack = () => {
      const isAtRootOrDirect =
        !currentPath ||
        currentPath === '/' ||
        currentPath === '/direct/' ||
        currentPath === '/direct/inbox/' ||
        currentPath.startsWith('/direct/inbox');

      // If we can go back in WebView history and not at the root/inbox screen
      if (canGoBack && !isAtRootOrDirect) {
        onGoBack();
        return true;
      }

      // At root or inbox: require double-tap within 2000ms
      const now = Date.now();
      if (now - lastBackPressTime.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPressTime.current = now;
      onShowToast('Tap back again to exit NoReels');
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => subscription.remove();
  }, [canGoBack, onGoBack, currentPath, onShowToast]);

  // 2. Web / PWA Hardware Back-Button Interception (Android Chrome & PWA Standalone)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const isAtRootOrDirect =
      !currentPath ||
      currentPath === '/' ||
      currentPath === '/direct/' ||
      currentPath === '/direct/inbox/' ||
      currentPath.startsWith('/direct/inbox');

    // Seed history state so the Android hardware back button does not instantly close the PWA
    try {
      if (!window.history.state || !window.history.state.noReelsGuard) {
        window.history.pushState({ noReelsGuard: true }, document.title);
      }
    } catch {}

    const onPopState = () => {
      if (canGoBack && !isAtRootOrDirect) {
        onGoBack();
        return;
      }

      const now = Date.now();
      if (now - lastBackPressTime.current < 2000) {
        // Double tap confirmed: let standard browser exit/close happen
        window.history.back();
        return;
      }

      // First tap at root/inbox: keep user inside PWA and warn
      lastBackPressTime.current = now;
      try {
        window.history.pushState({ noReelsGuard: true }, document.title);
      } catch {}
      onShowToast('Tap back again to exit NoReels');
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [canGoBack, onGoBack, currentPath, onShowToast]);
}
