import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (Platform.OS !== 'web' || isInstalled || dismissed) {
    return null;
  }

  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await promptInstall();
    }
  };

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>📲</Text>
        </View>

        <View style={styles.textBox}>
          <Text style={styles.title}>Install NoReels PWA</Text>
          <Text style={styles.subtitle}>
            {isIOS
              ? 'Tap Share ⎋ then "Add to Home Screen" ⊞ for full-screen focus.'
              : 'Add to home screen for fullscreen AMOLED focus & instant alerts.'}
          </Text>
        </View>

        <View style={styles.actions}>
          {isInstallable && (
            <TouchableOpacity
              style={styles.installBtn}
              onPress={handleInstallClick}
              activeOpacity={0.8}
            >
              <Text style={styles.installBtnText}>Install</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setDismissed(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 16, 16, 0.96)',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  iconText: {
    fontSize: 16,
  },
  textBox: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    color: '#999999',
    fontSize: 10,
    lineHeight: 13,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  installBtn: {
    backgroundColor: '#00F0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  installBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '700',
  },
});
