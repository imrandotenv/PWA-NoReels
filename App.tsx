import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WellbeingState } from './src/engine/types';
import { WellbeingHUD } from './src/components/WellbeingHUD';
import {
  InstagramBrowser,
  InstagramBrowserRef,
} from './src/components/InstagramBrowser';
import { AttributionModal } from './src/components/AttributionModal';
import { PWAInstallBanner } from './src/components/PWAInstallBanner';
import { Toast } from './src/components/Toast';
import { storage } from './src/utils/storage';

import { useDoubleTapBack } from './src/hooks/useDoubleTapBack';

const INITIAL_STATE: WellbeingState = {
  currentPath: '/direct/inbox/',
  activeFeedSeconds: 0,
  feedSecondsRemaining: 300,
  cooldownActive: false,
  cooldownSecondsRemaining: 0,
  isDmReelLocked: false,
  isFeedRoute: false,
  isSafeRoute: true,
  timestamp: Date.now(),
};

const STORAGE_KEY_ATTRIBUTION = 'noreels_attribution_shown_v1';
const STORAGE_KEY_CACHED_STATE = 'noreels_cached_state_v1';

export default function App() {
  const [wellbeingState, setWellbeingState] = useState<WellbeingState>(INITIAL_STATE);
  const [attributionVisible, setAttributionVisible] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const browserRef = useRef<InstagramBrowserRef>(null);

  // Intercept hardware back button on Android Native & Web/PWA
  useDoubleTapBack({
    canGoBack: browserRef.current?.canGoBack ?? false,
    onGoBack: () => {
      browserRef.current?.goBack();
    },
    currentPath: wellbeingState.currentPath,
    onShowToast: (msg: string) => setToastMessage(msg),
  });

  // Check one-time startup attribution modal and restore cached state
  useEffect(() => {
    const initApp = async () => {
      try {
        const shown = await storage.getItem(STORAGE_KEY_ATTRIBUTION);
        if (!shown) {
          setAttributionVisible(true);
        }
      } catch {
        setAttributionVisible(true);
      }

      try {
        const raw = await storage.getItem(STORAGE_KEY_CACHED_STATE);
        if (raw) {
          const cached = JSON.parse(raw) as WellbeingState;
          const now = Date.now();
          if (cached.cooldownActive && cached.cooldownSecondsRemaining > 0) {
            const elapsed = Math.floor((now - (cached.timestamp || now)) / 1000);
            const remaining = Math.max(0, cached.cooldownSecondsRemaining - elapsed);
            if (remaining > 0) {
              setWellbeingState(prev => ({
                ...prev,
                ...cached,
                cooldownActive: true,
                cooldownSecondsRemaining: remaining,
                timestamp: now,
              }));
            }
          }
        }
      } catch {}
    };
    initApp();
  }, []);

  const handleDismissAttribution = async () => {
    setAttributionVisible(false);
    try {
      await storage.setItem(STORAGE_KEY_ATTRIBUTION, 'true');
    } catch {
      // storage write ignored
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleNavigateDirect = () => {
    if (browserRef.current) {
      browserRef.current.navigateTo('/direct/inbox/');
      showToast('Switched to Safe Zone (Direct Inbox)');
    }
  };

  const handleRefresh = () => {
    if (browserRef.current) {
      browserRef.current.reload();
      showToast('Refreshed');
    }
  };

  const handleUpdateState = (newState: WellbeingState) => {
    setWellbeingState(newState);
    storage.setItem(STORAGE_KEY_CACHED_STATE, JSON.stringify(newState)).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* AMOLED Top Wellbeing HUD */}
      <WellbeingHUD
        state={wellbeingState}
        onNavigateDirect={handleNavigateDirect}
        onRefresh={handleRefresh}
        onOpenInfo={() => setAttributionVisible(true)}
      />

      {/* Main Instagram Browser Layer (Native WebView or Web Companion) */}
      <View style={styles.browserContainer}>
        <InstagramBrowser
          ref={browserRef}
          initialPath="/direct/inbox/"
          state={wellbeingState}
          onUpdateState={handleUpdateState}
          onShowToast={showToast}
        />
      </View>

      {/* One-time Startup Attribution Modal */}
      <AttributionModal
        visible={attributionVisible}
        onDismiss={handleDismissAttribution}
      />

      {/* Web PWA Install Banner */}
      <PWAInstallBanner />

      {/* AMOLED Floating Toast */}
      <Toast message={toastMessage} onHide={() => setToastMessage(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  browserContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
