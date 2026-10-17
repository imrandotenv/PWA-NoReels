import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Import real implementations directly from src/engine/wellbeingEngine.ts
const {
  isFeedPath,
  isReelsPath,
  isDirectPath,
  isSinglePostOrReelPath,
  isDmReelContext,
  calculateWellbeingState,
  getWellbeingEngineScript,
  DEFAULT_WELLBEING_CONFIG,
} = await import('../src/engine/wellbeingEngine.ts');

test('Route Detection - Feed vs Direct vs Reels', () => {
  // Feed paths
  assert.equal(isFeedPath('/'), true);
  assert.equal(isFeedPath(''), true);
  assert.equal(isFeedPath('/?utm_source=ig'), true);
  assert.equal(isFeedPath('/explore'), true);
  assert.equal(isFeedPath('/explore/'), true);
  assert.equal(isFeedPath('/explore/tags/coding/'), true);

  // Non-feed paths
  assert.equal(isFeedPath('/direct/inbox/'), false);
  assert.equal(isFeedPath('/direct/t/178414/'), false);
  assert.equal(isFeedPath('/reels/'), false);
  assert.equal(isFeedPath('/reel/C8qLz9x/'), false);
  assert.equal(isFeedPath('/username/'), false);

  // Direct paths
  assert.equal(isDirectPath('/direct'), true);
  assert.equal(isDirectPath('/direct/inbox/'), true);
  assert.equal(isDirectPath('/direct/t/3402823668/'), true);
  assert.equal(isDirectPath('/'), false);

  // Reels tab paths
  assert.equal(isReelsPath('/reels'), true);
  assert.equal(isReelsPath('/reels/'), true);
  assert.equal(isReelsPath('/reels/audio/123/'), true);
  assert.equal(isReelsPath('/reel/C8qLz9x/'), false); // single reel is /reel/, not /reels/ tab

  // Single post / reel permalink paths
  assert.equal(isSinglePostOrReelPath('/reel/C8qLz9x/'), true);
  assert.equal(isSinglePostOrReelPath('/p/DA123xyz/'), true);
  assert.equal(isSinglePostOrReelPath('/direct/inbox/'), false);
});

test('Single-Reel DM Lock Detection', () => {
  const now = 1700000000000;

  // Case 1: Opened reel from direct messages via referrer
  const fromReferrer = isDmReelContext('/reel/D981kLz/', 'https://www.instagram.com/direct/t/123/', 0, now);
  assert.equal(fromReferrer, true, 'Reel opened with direct referrer should lock scroll');

  // Case 2: Opened reel within 2 minutes of being in DMs
  const recentDirectTime = now - (2 * 60 * 1000);
  const fromRecentDirect = isDmReelContext('/reel/D981kLz/', '', recentDirectTime, now);
  assert.equal(fromRecentDirect, true, 'Reel opened soon after DM conversation should lock scroll');

  // Case 3: Cold navigation to a post/reel without DM context
  const oldDirectTime = now - (10 * 60 * 1000);
  const coldReel = isDmReelContext('/reel/D981kLz/', 'https://www.google.com/', oldDirectTime, now);
  assert.equal(coldReel, false, 'Cold reel navigation without DM origin should not lock DM reel flag');

  // Case 4: General inbox view should NOT be classified as a DM locked reel
  const directInbox = isDmReelContext('/direct/inbox/', '', now, now);
  assert.equal(directInbox, false, 'Inbox view alone is safe browsing, not a single-reel lock context');
});

test('Timer & Cooldown State Machine', () => {
  const now = 1700000000000;

  // Initial fresh state
  const stateInitial = calculateWellbeingState('/', 0, 0, now, false);
  assert.equal(stateInitial.activeFeedSeconds, 0);
  assert.equal(stateInitial.feedSecondsRemaining, 300);
  assert.equal(stateInitial.cooldownActive, false);
  assert.equal(stateInitial.cooldownSecondsRemaining, 0);
  assert.equal(stateInitial.isFeedRoute, true);

  // Mid-usage on explore feed
  const stateMid = calculateWellbeingState('/explore/', 180, 0, now, false);
  assert.equal(stateMid.activeFeedSeconds, 180);
  assert.equal(stateMid.feedSecondsRemaining, 120);
  assert.equal(stateMid.cooldownActive, false);

  // Active cooldown lockout (1 hour = 3600s, 30 minutes elapsed = 1800s remaining)
  const cooldownUntil = now + (1800 * 1000);
  const stateCooldown = calculateWellbeingState('/direct/inbox/', 300, cooldownUntil, now, false);
  assert.equal(stateCooldown.cooldownActive, true);
  assert.equal(stateCooldown.cooldownSecondsRemaining, 1800);
  assert.equal(stateCooldown.isSafeRoute, true);

  // Cooldown expired
  const expiredCooldownUntil = now - 1000;
  const stateExpired = calculateWellbeingState('/', 0, expiredCooldownUntil, now, false);
  assert.equal(stateExpired.cooldownActive, false);
  assert.equal(stateExpired.cooldownSecondsRemaining, 0);
});

test('Injection Engine Script Content & Architecture', () => {
  const script = getWellbeingEngineScript();
  assert.ok(typeof script === 'string' && script.length > 2000, 'Script must be a non-empty payload');

  // SPA route watcher
  assert.ok(script.includes('history.pushState'), 'Must hook history.pushState');
  assert.ok(script.includes('history.replaceState'), 'Must hook history.replaceState');
  assert.ok(script.includes('popstate'), 'Must listen to popstate');
  assert.ok(script.includes('MutationObserver'), 'Must attach MutationObserver');

  // Timer & Cooldown rules
  assert.ok(script.includes('300'), 'Must define 5-minute (300s) feed limit');
  assert.ok(script.includes('3600'), 'Must define 1-hour (3600s) cooldown lockout');
  assert.ok(script.includes('/direct/inbox/'), 'Must redirect to /direct/inbox/');
  assert.ok(script.includes('noreels-cooldown-banner'), 'Must include dynamic cooldown warning banner');

  // DM Single-Reel lock & gesture freeze
  assert.ok(script.includes('touch-action: none !important'), 'Must inject touch-action: none !important');
  assert.ok(script.includes('overflow: hidden !important'), 'Must inject overflow: hidden !important');
  assert.ok(script.includes('onTouchMove'), 'Must include onTouchMove handler');
  assert.ok(script.includes('onWheel'), 'Must include onWheel handler');
  assert.ok(script.includes('onKeyDown'), 'Must include onKeyDown handler');

  // UI Sanitization & Dark Mode
  assert.ok(script.includes('#000000 !important'), 'Must inject #000000 AMOLED pitch-black theme');
  assert.ok(script.includes('OpenInApp'), 'Must hide OpenInApp banners');
  assert.ok(script.includes('/reels/'), 'Must hide Reels tab');
  assert.ok(script.includes('intent://'), 'Must suppress intent:// deep links');

  // Bidirectional bridge
  assert.ok(script.includes('ReactNativeWebView'), 'Must post message to ReactNativeWebView');
  assert.ok(script.includes('NOREELS_NAVIGATE'), 'Must support NOREELS_NAVIGATE host command');
  assert.ok(script.includes('NOREELS_STATE_UPDATE'), 'Must emit NOREELS_STATE_UPDATE');
});

test('PWA Manifest Specification Validation', () => {
  const manifestPath = path.join(projectRoot, 'public', 'manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'public/manifest.json must exist');

  const content = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  assert.equal(content.name, 'NoReels Universal — Focus & Wellbeing');
  assert.equal(content.short_name, 'NoReels');
  assert.equal(content.display, 'standalone');
  assert.equal(content.background_color, '#000000');
  assert.equal(content.theme_color, '#000000');
  assert.equal(content.start_url, '/');
  assert.ok(Array.isArray(content.icons) && content.icons.length >= 2, 'Must have at least 2 icon sizes');

  const has192 = content.icons.some(i => i.sizes.includes('192x192'));
  const has512 = content.icons.some(i => i.sizes.includes('512x512'));
  assert.ok(has192, 'Manifest must have a 192x192 icon');
  assert.ok(has512, 'Manifest must have a 512x512 icon');
});

test('Service Worker Offline and Cache Verification', () => {
  const swPath = path.join(projectRoot, 'public', 'sw.js');
  assert.ok(fs.existsSync(swPath), 'public/sw.js must exist');

  const swContent = fs.readFileSync(swPath, 'utf-8');
  assert.ok(swContent.includes('CACHE_NAME'), 'SW must define CACHE_NAME');
  assert.ok(swContent.includes('addEventListener(\'install\''), 'SW must have install event');
  assert.ok(swContent.includes('addEventListener(\'activate\''), 'SW must have activate event');
  assert.ok(swContent.includes('addEventListener(\'fetch\''), 'SW must have fetch event');
});

test('Userscript Header and Structure Verification', () => {
  const userscriptPath = path.join(projectRoot, 'public', 'noreels.user.js');
  assert.ok(fs.existsSync(userscriptPath), 'public/noreels.user.js must exist');

  const content = fs.readFileSync(userscriptPath, 'utf-8');
  assert.ok(content.includes('// ==UserScript=='), 'Must contain UserScript header');
  assert.ok(content.includes('// @name         NoReels Universal'), 'Must contain name');
  assert.ok(content.includes('// @match        https://*.instagram.com/*'), 'Must match Instagram domains');
  assert.ok(content.includes('"feedTimeLimitSeconds":300'), 'Must define 300-second feed limit');
  assert.ok(content.includes('"cooldownDurationSeconds":3600'), 'Must define 3600-second cooldown');
  assert.ok(content.includes('touch-action: none !important'), 'Must include unified Single-Reel lock');
});

test('Reverse Proxy Server Configuration', () => {
  const proxyPath = path.join(projectRoot, 'proxy', 'proxy-server.js');
  assert.ok(fs.existsSync(proxyPath), 'proxy/proxy-server.js must exist');

  const proxyCode = fs.readFileSync(proxyPath, 'utf-8');
  assert.ok(proxyCode.includes('x-frame-options'), 'Proxy must strip x-frame-options');
  assert.ok(proxyCode.includes('content-security-policy'), 'Proxy must strip CSP');
  assert.ok(proxyCode.includes('cross-origin-opener-policy'), 'Proxy must strip COOP');
  assert.ok(proxyCode.includes('SameSite=None; Secure'), 'Proxy must rewrite SameSite cookies');
  assert.ok(proxyCode.includes('/health'), 'Proxy must provide /health endpoint');
  assert.ok(proxyCode.includes('getInjectedScript'), 'Proxy must use dynamic unified injection script');
});
