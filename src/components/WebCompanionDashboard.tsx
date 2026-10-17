import React, { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { generateBookmarklet, generateUserscript } from '../engine/userscript';
import { WellbeingState } from '../engine/types';

interface WebCompanionDashboardProps {
  state: WellbeingState;
  onUpdateState: (newState: Partial<WellbeingState>) => void;
  onShowToast: (msg: string) => void;
  activePath: string;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
}

export const WebCompanionDashboard: React.FC<WebCompanionDashboardProps> = ({
  state,
  onUpdateState,
  onShowToast,
  activePath,
  iframeRef,
}) => {
  const [proxyUrl, setProxyUrl] = useState<string>('http://localhost:3001');
  const [activeTab, setActiveTab] = useState<'proxy' | 'companion'>('proxy');
  const [proxyOnline, setProxyOnline] = useState<boolean | null>(null);
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

  // Check proxy health on load
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const checkProxyHealth = async () => {
      try {
        const res = await fetch(`${proxyUrl}/health`, { mode: 'cors' });
        if (res.ok) {
          setProxyOnline(true);
        } else {
          setProxyOnline(false);
        }
      } catch {
        setProxyOnline(false);
      }
    };

    checkProxyHealth();
  }, [proxyUrl]);

  // Listen for iframe postMessage
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data && data.type === 'NOREELS_STATE_UPDATE' && data.payload) {
          onUpdateState(data.payload);
        }
      } catch {
        // Not a NoReels message
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onUpdateState]);

  const handleCopyBookmarklet = () => {
    const code = generateBookmarklet();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedBookmarklet(true);
      onShowToast('Bookmarklet code copied to clipboard!');
      setTimeout(() => setCopiedBookmarklet(false), 3000);
    }
  };

  const handleDownloadUserscript = () => {
    if (typeof window === 'undefined') return;
    const content = generateUserscript();
    const blob = new Blob([content], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'noreels.user.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('Downloading noreels.user.js');
  };

  const handleOpenDirectWeb = () => {
    if (typeof window !== 'undefined') {
      window.open('https://www.instagram.com/direct/inbox/', '_blank');
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'proxy' && styles.activeTabItem]}
          onPress={() => setActiveTab('proxy')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'proxy' && styles.activeTabText]}>
            Proxy View {proxyOnline ? '🟢' : '⚪'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'companion' && styles.activeTabItem]}
          onPress={() => setActiveTab('companion')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'companion' && styles.activeTabText]}>
            Companion & Userscript
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'proxy' ? (
        <View style={styles.proxyWrapper}>
          {/* Proxy URL bar & Status */}
          <View style={styles.proxyControls}>
            <View style={styles.proxyInputContainer}>
              <Text style={styles.proxyPrefix}>Proxy:</Text>
              <TextInput
                style={styles.proxyInput}
                value={proxyUrl}
                onChangeText={setProxyUrl}
                placeholder="http://localhost:3001 or worker URL"
                placeholderTextColor="#666"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.proxyStatusChip}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: proxyOnline ? '#30D158' : '#FF453A' },
                ]}
              />
              <Text style={styles.proxyStatusText}>
                {proxyOnline ? 'Connected' : 'Offline / Setup Needed'}
              </Text>
            </View>
          </View>

          {/* Iframe View */}
          {proxyOnline ? (
            <View style={styles.iframeContainer}>
              {/* On web, an iframe element can be rendered directly */}
              <iframe
                ref={iframeRef}
                title="Instagram Frame"
                src={`${proxyUrl}${activePath || '/direct/inbox/'}`}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '100%',
                  flex: 1,
                  border: 'none',
                  backgroundColor: '#000000',
                }}
                allow="camera; microphone; clipboard-write"
              />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.offlineNotice}>
              <View style={styles.card}>
                <Text style={styles.cardBadge}>BROWSER X-FRAME-OPTIONS BYPASS</Text>
                <Text style={styles.cardTitle}>Run Local Proxy or Deploy Edge Worker</Text>
                <Text style={styles.cardDesc}>
                  Browsers block instagram.com in an iframe due to X-Frame-Options: DENY. NoReels Universal includes a zero-dependency reverse proxy that strips frame-blocking headers and injects the Anti-Doomscroll Engine.
                </Text>

                <View style={styles.codeBlock}>
                  <Text style={styles.codeTitle}>1. Start Local Proxy (in terminal):</Text>
                  <Text style={styles.codeSnippet}>node proxy/proxy-server.js</Text>
                  <Text style={styles.codeSub}>Or: npm run proxy</Text>
                </View>

                <View style={styles.codeBlock}>
                  <Text style={styles.codeTitle}>2. Or Deploy Cloudflare Worker:</Text>
                  <Text style={styles.codeSnippet}>npx wrangler deploy proxy/cloudflare-worker.js</Text>
                </View>

                <View style={styles.divider} />

                <Text style={styles.fallbackTitle}>Prefer No Proxy? Use Direct Mode Below:</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => setActiveTab('companion')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryBtnText}>View 1-Click Userscript & Bookmarklet</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={handleOpenDirectWeb}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.secondaryBtnText}>Open Instagram Direct Web</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      ) : (
        /* Companion & Tools View */
        <ScrollView contentContainerStyle={styles.companionContainer}>
          {/* Card 1: 1-Click Bookmarklet */}
          <View style={styles.card}>
            <Text style={styles.cardBadge}>OPTION 1: MOBILE & DESKTOP BOOKMARKLET</Text>
            <Text style={styles.cardTitle}>1-Click Bookmarklet</Text>
            <Text style={styles.cardDesc}>
              Works in Safari, Chrome, and Firefox without any browser extensions. Create a bookmark named &quot;NoReels&quot; with this code, then tap it whenever viewing Instagram!
            </Text>

            <TouchableOpacity
              style={[styles.copyBtn, copiedBookmarklet && styles.copiedBtn]}
              onPress={handleCopyBookmarklet}
              activeOpacity={0.8}
            >
              <Text style={styles.copyBtnText}>
                {copiedBookmarklet ? '✓ Copied to Clipboard!' : '📋 Copy Bookmarklet Code'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Card 2: 1-Click Userscript */}
          <View style={styles.card}>
            <Text style={styles.cardBadge}>OPTION 2: AUTOMATIC USERSCRIPT</Text>
            <Text style={styles.cardTitle}>Violentmonkey / Tampermonkey Script</Text>
            <Text style={styles.cardDesc}>
              Runs automatically on every Instagram page. Ideal for Kiwi Browser (Android), Orion (iOS Safari), or desktop browsers.
            </Text>

            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={handleDownloadUserscript}
              activeOpacity={0.8}
            >
              <Text style={styles.downloadBtnText}>⬇ Download noreels.user.js</Text>
            </TouchableOpacity>
          </View>

          {/* Card 3: Direct Focus Launch */}
          <View style={styles.card}>
            <Text style={styles.cardBadge}>SAFE ZONE</Text>
            <Text style={styles.cardTitle}>Launch Instagram Direct Safe Zone</Text>
            <Text style={styles.cardDesc}>
              Open direct messages directly, bypassing the doomscroll home feed entirely.
            </Text>

            <TouchableOpacity
              style={styles.launchBtn}
              onPress={handleOpenDirectWeb}
              activeOpacity={0.8}
            >
              <Text style={styles.launchBtnText}>Open Instagram Direct (Inbox)</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: '#00F0FF',
  },
  tabText: {
    color: '#777777',
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  proxyWrapper: {
    flex: 1,
  },
  proxyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0F0F0F',
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  proxyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#181818',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  proxyPrefix: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 6,
  },
  proxyInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    paddingVertical: 6,
  },
  proxyStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  proxyStatusText: {
    color: '#AAAAAA',
    fontSize: 11,
    fontWeight: '600',
  },
  iframeContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  offlineNotice: {
    padding: 16,
    alignItems: 'center',
  },
  companionContainer: {
    padding: 16,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 580,
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardBadge: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardDesc: {
    color: '#8E8E93',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  codeBlock: {
    backgroundColor: '#000000',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262626',
    padding: 12,
    marginBottom: 10,
  },
  codeTitle: {
    color: '#AAAAAA',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  codeSnippet: {
    color: '#00F0FF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    fontWeight: '700',
  },
  codeSub: {
    color: '#666666',
    fontSize: 10,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#222222',
    marginVertical: 14,
  },
  fallbackTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#00F0FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  copyBtn: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#00F0FF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  copiedBtn: {
    backgroundColor: 'rgba(48, 209, 88, 0.2)',
    borderColor: '#30D158',
  },
  copyBtnText: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '700',
  },
  downloadBtn: {
    backgroundColor: 'rgba(225, 48, 108, 0.15)',
    borderWidth: 1,
    borderColor: '#E1306C',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  downloadBtnText: {
    color: '#E1306C',
    fontSize: 13,
    fontWeight: '700',
  },
  launchBtn: {
    backgroundColor: '#30D158',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  launchBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
  },
});
