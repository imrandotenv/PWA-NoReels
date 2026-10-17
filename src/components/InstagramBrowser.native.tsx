import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { getWellbeingEngineScript } from '../engine/wellbeingEngine';
import { WellbeingState } from '../engine/types';
import { useDoubleTapBack } from '../hooks/useDoubleTapBack';

// Accommodate React 19 JSX typing compatibility
const NativeWebViewComponent = WebView as unknown as React.ComponentType<any>;

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
  state?: WellbeingState;
}

export const InstagramBrowser = forwardRef<InstagramBrowserRef, InstagramBrowserProps>(
  ({ onUpdateState, onShowToast, initialPath = '/direct/inbox/' }, ref) => {
    const webViewRef = useRef<any>(null);
    const [canGoBack, setCanGoBack] = useState(false);
    const [currentPath, setCurrentPath] = useState(initialPath);

    useImperativeHandle(ref, () => ({
      goBack: () => {
        if (webViewRef.current && canGoBack) {
          webViewRef.current.goBack();
        }
      },
      reload: () => {
        if (webViewRef.current) {
          webViewRef.current.reload();
        }
      },
      navigateTo: (path: string) => {
        if (webViewRef.current) {
          const script = `window.location.replace('${path}'); true;`;
          webViewRef.current.injectJavaScript(script);
        }
      },
      canGoBack,
    }));

    // Intercept hardware back button with double-tap exit guard
    useDoubleTapBack({
      canGoBack,
      onGoBack: () => {
        if (webViewRef.current) {
          webViewRef.current.goBack();
        }
      },
      currentPath,
      onShowToast,
    });

    const handleNavigationStateChange = (navState: WebViewNavigation) => {
      setCanGoBack(navState.canGoBack);
      try {
        const url = new URL(navState.url);
        setCurrentPath(url.pathname);
      } catch {
        // invalid URL
      }
    };

    const handleMessage = (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data && data.type === 'NOREELS_STATE_UPDATE' && data.payload) {
          onUpdateState(data.payload);
        }
      } catch {
        // Non-JSON message ignored
      }
    };

    const handleShouldStartLoad = (request: { url: string }) => {
      const url = request.url;

      // Intercept deep links and app store redirects
      if (
        url.startsWith('intent://') ||
        url.startsWith('instagram://') ||
        url.includes('play.google.com') ||
        url.includes('itunes.apple.com') ||
        url.includes('apps.apple.com')
      ) {
        onShowToast('Blocked external app redirection');
        return false;
      }

      return true;
    };

    const engineScript = getWellbeingEngineScript();

    return (
      <View style={styles.container}>
        <NativeWebViewComponent
          ref={webViewRef}
          source={{ uri: `https://www.instagram.com${initialPath}` }}
          style={styles.webView}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          javaScriptEnabled={true}
          injectedJavaScriptBeforeContentLoaded={engineScript}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleMessage}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          allowsBackForwardNavigationGestures={true}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          applicationNameForUserAgent="NoReelsUniversal/1.0"
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
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
