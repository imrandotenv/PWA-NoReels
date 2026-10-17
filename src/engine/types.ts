export interface WellbeingState {
  currentPath: string;
  activeFeedSeconds: number; // 0 to 300 (5 minutes max)
  feedSecondsRemaining: number; // 300 down to 0
  cooldownActive: boolean;
  cooldownSecondsRemaining: number; // 3600 down to 0 when active
  isDmReelLocked: boolean;
  isFeedRoute: boolean;
  isSafeRoute: boolean;
  timestamp: number;
}

export interface WellbeingConfig {
  feedTimeLimitSeconds: number; // default: 300 (5 minutes)
  cooldownDurationSeconds: number; // default: 3600 (1 hour)
  storagePrefix: string; // default: 'noreels_'
  defaultRedirectPath: string; // default: '/direct/inbox/'
  amoledDarkMode: boolean; // default: true
  suppressOpenInApp: boolean; // default: true
  singleReelLock: boolean; // default: true
}

export type BridgeAction =
  | { type: 'NOREELS_STATE_UPDATE'; payload: WellbeingState }
  | { type: 'NOREELS_NAVIGATE'; payload: { path: string } }
  | { type: 'NOREELS_RESET_TIMER' }
  | { type: 'NOREELS_TRIGGER_COOLDOWN' };
