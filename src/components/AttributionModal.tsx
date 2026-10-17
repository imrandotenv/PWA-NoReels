import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface AttributionModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export const AttributionModal: React.FC<AttributionModalProps> = ({ visible, onDismiss }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header Glow Badge */}
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>FOCUS & WELLBEING</Text>
            </View>

            <Text style={styles.title}>NoReels Universal</Text>

            {/* Attribution Quote */}
            <View style={styles.quoteBox}>
              <Text style={styles.quoteText}>
                “Developed by Imran Ahmad — For those seeking an escape from endless doomscrolling.”
              </Text>
            </View>

            {/* Features Breakdown */}
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIconContainer, { borderColor: '#00F0FF' }]}>
                  <Text style={styles.featureIconText}>⏱</Text>
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureHeading}>5-Minute Feed Quota</Text>
                  <Text style={styles.featureDescription}>
                    Home (`/`) and Explore (`/explore/`) share a strict 300-second active timer that only ticks while actively viewing.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIconContainer, { borderColor: '#E1306C' }]}>
                  <Text style={styles.featureIconText}>🔒</Text>
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureHeading}>1-Hour Cooldown Lockout</Text>
                  <Text style={styles.featureDescription}>
                    Once the feed timer expires, feeds are strictly locked for 60 minutes and you are redirected to Direct Messages.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIconContainer, { borderColor: '#FFB300' }]}>
                  <Text style={styles.featureIconText}>🎯</Text>
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureHeading}>Single-Reel Lock in DMs</Text>
                  <Text style={styles.featureDescription}>
                    Watch a video sent by friends in DMs without vertical swiping dragging you into an endless video vortex.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIconContainer, { borderColor: '#30D158' }]}>
                  <Text style={styles.featureIconText}>🌑</Text>
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureHeading}>AMOLED Black & Zero Distraction</Text>
                  <Text style={styles.featureDescription}>
                    High-contrast #000000 pitch-black aesthetic with all &apos;Open in App&apos; nags and Reels tabs permanently suppressed.
                  </Text>
                </View>
              </View>
            </View>

            {/* Dismiss Button */}
            <TouchableOpacity style={styles.enterButton} onPress={onDismiss} activeOpacity={0.85}>
              <Text style={styles.enterButtonText}>Enter Focus Mode</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999999,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: '#0A0A0A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222222',
    padding: 24,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  scrollContent: {
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
    marginBottom: 12,
  },
  badgeText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  quoteBox: {
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#E1306C',
    marginBottom: 20,
    width: '100%',
  },
  quoteText: {
    color: '#E0E0E0',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  featureList: {
    width: '100%',
    marginBottom: 22,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  featureIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#141414',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureIconText: {
    fontSize: 14,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureHeading: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDescription: {
    color: '#8E8E93',
    fontSize: 11,
    lineHeight: 15,
  },
  enterButton: {
    width: '100%',
    backgroundColor: '#00F0FF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  enterButtonText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.4,
  },
});
