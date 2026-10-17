import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WellbeingState } from '../engine/types';
import { WebCompanionDashboard } from './WebCompanionDashboard';

export interface InstagramBrowserRef {
  goBack: () => void;
  reload: () => void;
  navigateTo: (path: string) => void;
  canGoBack?: boolean;
}

interface InstagramBrowserProps {
  onUpdateState: (state: WellbeingState) => void;
  onShowToast: (msg: string) => void;
  initialPath?: string;
  state: WellbeingState;
}

export const InstagramBrowser = forwardRef<InstagramBrowserRef, InstagramBrowserProps>(
  ({ onUpdateState, onShowToast, initialPath = '/direct/inbox/', state }, ref) => {
    const [activePath, setActivePath] = useState(initialPath);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useImperativeHandle(ref, () => ({
      goBack: () => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          try {
            iframeRef.current.contentWindow.history.back();
            return;
          } catch {}
        }
        if (typeof window !== 'undefined' && window.history) {
          window.history.back();
        }
      },
      reload: () => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          try {
            iframeRef.current.contentWindow.location.reload();
            return;
          } catch {}
        }
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      },
      navigateTo: (path: string) => {
        setActivePath(path);
        // Post message directly to child iframe window
        if (iframeRef.current && iframeRef.current.contentWindow) {
          try {
            iframeRef.current.contentWindow.postMessage(
              {
                type: 'NOREELS_NAVIGATE',
                payload: { path },
              },
              '*'
            );
          } catch {}
        }
      },
      canGoBack: false,
    }));

    const handleUpdateState = (newState: Partial<WellbeingState>) => {
      onUpdateState({
        ...state,
        ...newState,
      });
    };

    return (
      <View style={styles.container}>
        <WebCompanionDashboard
          iframeRef={iframeRef}
          state={state}
          onUpdateState={handleUpdateState}
          onShowToast={onShowToast}
          activePath={activePath}
        />
      </View>
    );
  }
);

InstagramBrowser.displayName = 'InstagramBrowser';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
