import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WellbeingState } from '../engine/types';

interface WellbeingHUDProps {
  state: WellbeingState;
  onNavigateDirect: () => void;
  onRefresh: () => void;
  onOpenInfo: () => void;
}

export const WellbeingHUD: React.FC<WellbeingHUDProps> = ({
  state,
  onNavigateDirect,
  onRefresh,
  onOpenInfo,
}) => {
  const {
    activeFeedSeconds,
    feedSecondsRemaining,
    cooldownActive,
    cooldownSecondsRemaining,
    isDmReelLocked,
    isFeedRoute,
    isSafeRoute,
  } = state;

  // Format MM:SS
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Progress percentage (0 to 100%)
  const feedLimit = 300;
  const feedProgressPercent = Math.min(100, Math.max(0, ((feedLimit - feedSecondsRemaining) / feedLimit) * 100));
  const isFeedWarning = feedSecondsRemaining <= 60 && feedSecondsRemaining > 0;

  return (
    <View style={styles.hudContainer}>
      {/* Top Progress Bar */}
      <View style={styles.progressBarBackground}>
        {cooldownActive ? (
          <View style={[styles.progressBarFill, styles.cooldownBarFill, { width: '100%' }]} />
        ) : (
          <View
            style={[
              styles.progressBarFill,
              isFeedWarning ? styles.warningBarFill : styles.normalBarFill,
              { width: `${feedProgressPercent}%` },
            ]}
          />
        )}
      </View>

      {/* Main HUD Bar */}
      <View style={styles.mainBar}>
        {/* Left: Brand & Status Chip */}
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={onOpenInfo} style={styles.brandBadge} activeOpacity={0.7}>
            <Text style={styles.brandText}>NoReels</Text>
          </TouchableOpacity>

          {cooldownActive ? (
            <View style={[styles.statusBadge, styles.cooldownBadge]}>
              <View style={[styles.statusDot, styles.cooldownDot]} />
              <Text style={styles.cooldownBadgeText}>
                LOCKOUT: {formatTime(cooldownSecondsRemaining)}
              </Text>
            </View>
          ) : isFeedRoute ? (
            <View style={[styles.statusBadge, isFeedWarning ? styles.warningBadge : styles.feedBadge]}>
              <View style={[styles.statusDot, isFeedWarning ? styles.warningDot : styles.feedDot]} />
              <Text style={[styles.statusBadgeText, isFeedWarning && styles.warningBadgeText]}>
                Feed: {formatTime(feedSecondsRemaining)} left
              </Text>
            </View>
          ) : isSafeRoute ? (
            <View style={[styles.statusBadge, styles.safeBadge]}>
              <View style={[styles.statusDot, styles.safeDot]} />
              <Text style={styles.safeBadgeText}>Direct (Safe)</Text>
            </View>
          ) : (
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusBadgeText}>Focus Active</Text>
            </View>
          )}

          {isDmReelLocked && (
            <View style={[styles.statusBadge, styles.reelLockedBadge]}>
              <Text style={styles.reelLockedText}>🔒 Single Reel</Text>
            </View>
          )}
        </View>

        {/* Right: Quick Action Controls */}
        <View style={styles.rightSection}>
          <TouchableOpacity
            onPress={onNavigateDirect}
            style={[styles.actionBtn, styles.directBtn]}
            activeOpacity={0.7}
            accessibilityLabel="Open Direct Inbox"
          >
            <Text style={styles.directBtnText}>DMs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onRefresh}
            style={styles.actionBtn}
            activeOpacity={0.7}
            accessibilityLabel="Refresh Page"
          >
            <Text style={styles.actionBtnText}>↻</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onOpenInfo}
            style={styles.actionBtn}
            activeOpacity={0.7}
            accessibilityLabel="App Information"
          >
            <Text style={styles.actionBtnText}>ⓘ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hudContainer: {
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    zIndex: 1000,
    paddingTop: Platform.OS === 'android' ? 36 : Platform.OS === 'ios' ? 48 : 6,
  },
  progressBarBackground: {
    height: 3,
    backgroundColor: '#111111',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
  },
  normalBarFill: {
    backgroundColor: '#00F0FF',
  },
  warningBarFill: {
    backgroundColor: '#E1306C',
  },
  cooldownBarFill: {
    backgroundColor: '#FF3366',
  },
  mainBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    overflow: 'hidden',
  },
  brandBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#111111',
    marginRight: 8,
  },
  brandText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#888888',
    marginRight: 6,
  },
  statusBadgeText: {
    color: '#CCCCCC',
    fontSize: 11,
    fontWeight: '600',
  },
  feedBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  feedDot: {
    backgroundColor: '#00F0FF',
  },
  warningBadge: {
    backgroundColor: 'rgba(225, 48, 108, 0.15)',
    borderWidth: 0.5,
    borderColor: '#E1306C',
  },
  warningDot: {
    backgroundColor: '#E1306C',
  },
  warningBadgeText: {
    color: '#FF6B8B',
  },
  cooldownBadge: {
    backgroundColor: 'rgba(255, 51, 102, 0.15)',
    borderWidth: 0.5,
    borderColor: '#FF3366',
  },
  cooldownDot: {
    backgroundColor: '#FF3366',
  },
  cooldownBadgeText: {
    color: '#FF4D6D',
    fontSize: 11,
    fontWeight: '700',
  },
  safeBadge: {
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  safeDot: {
    backgroundColor: '#30D158',
  },
  safeBadgeText: {
    color: '#30D158',
    fontSize: 11,
    fontWeight: '600',
  },
  reelLockedBadge: {
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 179, 0, 0.4)',
  },
  reelLockedText: {
    color: '#FFB300',
    fontSize: 10,
    fontWeight: '600',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  directBtn: {
    width: 'auto',
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  directBtnText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '700',
  },
});
