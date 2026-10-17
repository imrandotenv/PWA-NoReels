import type { WellbeingConfig, WellbeingState } from './types';

export const DEFAULT_WELLBEING_CONFIG: WellbeingConfig = {
  feedTimeLimitSeconds: 300, // 5 minutes
  cooldownDurationSeconds: 3600, // 1 hour
  storagePrefix: 'noreels_',
  defaultRedirectPath: '/direct/inbox/',
  amoledDarkMode: true,
  suppressOpenInApp: true,
  singleReelLock: true,
};

/**
 * Pure route classification helpers (usable in Node tests and web scripts)
 */
export function isFeedPath(pathname: string): boolean {
  const clean = (pathname || '/').split('?')[0].split('#')[0];
  return clean === '/' || clean === '' || clean === '/explore' || clean.startsWith('/explore/');
}

export function isReelsPath(pathname: string): boolean {
  const clean = (pathname || '/').split('?')[0].split('#')[0];
  return clean === '/reels' || clean.startsWith('/reels/');
}

export function isDirectPath(pathname: string): boolean {
  const clean = (pathname || '/').split('?')[0].split('#')[0];
  return clean === '/direct' || clean.startsWith('/direct/');
}

export function isSinglePostOrReelPath(pathname: string): boolean {
  const clean = (pathname || '/').split('?')[0].split('#')[0];
  return clean.startsWith('/reel/') || clean.startsWith('/p/');
}

export function isDmReelContext(
  currentPath: string,
  referrer: string = '',
  lastDirectTimestamp: number = 0,
  now: number = Date.now()
): boolean {
  if (isSinglePostOrReelPath(currentPath)) {
    const isDirectReferrer = (referrer || '').includes('/direct/');
    const wasRecentDirect = (now - lastDirectTimestamp) < (5 * 60 * 1000);
    return isDirectReferrer || wasRecentDirect;
  }
  return false;
}

/**
 * Calculate state given timestamps and feed seconds
 */
export function calculateWellbeingState(
  currentPath: string,
  feedSeconds: number,
  cooldownUntil: number,
  now: number,
  isDmLocked: boolean,
  config: WellbeingConfig = DEFAULT_WELLBEING_CONFIG
): WellbeingState {
  const isCooldown = cooldownUntil > now;
  const cooldownRemaining = isCooldown ? Math.ceil((cooldownUntil - now) / 1000) : 0;
  const feedRemaining = Math.max(0, config.feedTimeLimitSeconds - feedSeconds);
  const isFeed = isFeedPath(currentPath);
  const isSafe = isDirectPath(currentPath);

  return {
    currentPath,
    activeFeedSeconds: Math.min(config.feedTimeLimitSeconds, Math.max(0, feedSeconds)),
    feedSecondsRemaining: feedRemaining,
    cooldownActive: isCooldown,
    cooldownSecondsRemaining: cooldownRemaining,
    isDmReelLocked: isDmLocked,
    isFeedRoute: isFeed,
    isSafeRoute: isSafe,
    timestamp: now,
  };
}

/**
 * Returns the complete standalone JavaScript payload to be injected into
 * Native WebView, Web Proxy, or Userscript.
 * Zero external dependencies, self-executing, and safe against duplicate runs.
 */
export function getWellbeingEngineScript(userConfig?: Partial<WellbeingConfig>): string {
  const config = { ...DEFAULT_WELLBEING_CONFIG, ...userConfig };

  return `(function() {
  if (window.__NOREELS_INITIALIZED__) {
    return;
  }
  window.__NOREELS_INITIALIZED__ = true;

  var CONFIG = ${JSON.stringify(config)};
  var STORAGE_FEED = CONFIG.storagePrefix + 'feed_seconds';
  var STORAGE_COOLDOWN = CONFIG.storagePrefix + 'cooldown_until';
  var STORAGE_LAST_DIRECT = CONFIG.storagePrefix + 'last_direct_time';

  var isDmReelLockActive = false;
  var touchStartY = 0;
  var touchStartX = 0;

  function safeGet(key, fallback) {
    try {
      var val = window.localStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch(e) {
      return fallback;
    }
  }

  function safeSet(key, val) {
    try {
      window.localStorage.setItem(key, String(val));
    } catch(e) {}
  }

  function isFeed(path) {
    var clean = (path || window.location.pathname).split('?')[0].split('#')[0];
    return clean === '/' || clean === '' || clean === '/explore' || clean.indexOf('/explore/') === 0;
  }

  function isReels(path) {
    var clean = (path || window.location.pathname).split('?')[0].split('#')[0];
    return clean === '/reels' || clean.indexOf('/reels/') === 0;
  }

  function isDirect(path) {
    var clean = (path || window.location.pathname).split('?')[0].split('#')[0];
    return clean === '/direct' || clean.indexOf('/direct/') === 0;
  }

  function isSinglePostOrReel(path) {
    var clean = (path || window.location.pathname).split('?')[0].split('#')[0];
    return clean.indexOf('/reel/') === 0 || clean.indexOf('/p/') === 0;
  }

  function postToHost(msg) {
    try {
      if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
    } catch(e) {}

    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(msg, '*');
      }
    } catch(e) {}
  }

  // 1. AMOLED Dark Mode & UI Sanitization CSS Injection
  function injectStyles() {
    if (document.getElementById('noreels-injected-styles')) return;

    var style = document.createElement('style');
    style.id = 'noreels-injected-styles';
    style.textContent = [
      '/* NoReels AMOLED Pitch-Black Theme */',
      'html, body, #mount_0_0_*, div[role="main"], div[role="navigation"], header, nav {',
      '  background-color: #000000 !important;',
      '  color: #f5f5f5 !important;',
      '}',
      '/* Hide Open in App banners, modals, and deep links */',
      'div[class*="OpenInApp"], div[class*="AppBanner"], div[class*="x1n2onr6"]:has(a[href*="instagram://"]),',
      'a[href^="intent://"], a[href^="instagram://"], a[href*="play.google.com"], a[href*="apps.apple.com"],',
      'div[role="dialog"]:has(a[href*="play.google.com"]), div[role="dialog"]:has(a[href*="apps.apple.com"]),',
      '.open-in-app, [aria-label*="Install app"], [aria-label*="Open in Instagram app"] {',
      '  display: none !important;',
      '  visibility: hidden !important;',
      '  pointer-events: none !important;',
      '  height: 0 !important;',
      '  max-height: 0 !important;',
      '  overflow: hidden !important;',
      '}',
      '/* Hide Reels tab in bottom and side navigation */',
      'a[href*="/reels/"], a[role="link"][href^="/reels/"], div[role="tablist"] a[href*="/reels"],',
      'svg[aria-label="Reels"], svg[aria-label="reels"] {',
      '  display: none !important;',
      '  visibility: hidden !important;',
      '  pointer-events: none !important;',
      '}',
      '/* Single-Reel lock on DM shared videos - lock vertical snap scroll while keeping controls clickable */',
      'html.noreels-single-reel-locked,',
      'body.noreels-single-reel-locked,',
      'body.noreels-single-reel-locked div,',
      'body.noreels-single-reel-locked main,',
      'body.noreels-single-reel-locked [role="main"],',
      'body.noreels-single-reel-locked [role="dialog"],',
      'body.noreels-single-reel-locked article,',
      'body.noreels-single-reel-locked section {',
      '  touch-action: none !important;',
      '  overscroll-behavior: none !important;',
      '  scroll-snap-type: none !important;',
      '}',
      'html.noreels-single-reel-locked,',
      'body.noreels-single-reel-locked,',
      'body.noreels-single-reel-locked main,',
      'body.noreels-single-reel-locked [role="main"],',
      'body.noreels-single-reel-locked [role="dialog"],',
      'body.noreels-single-reel-locked div[style*="overflow"] {',
      '  overflow: hidden !important;',
      '}',
      '/* Dynamic In-Page Banner for Cooldown Warnings */',
      '#noreels-cooldown-banner {',
      '  position: fixed;',
      '  top: 0;',
      '  left: 0;',
      '  right: 0;',
      '  z-index: 999999;',
      '  background: #000000;',
      '  border-bottom: 2px solid #E1306C;',
      '  color: #ffffff;',
      '  padding: 10px 14px;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '  font-size: 13px;',
      '  font-weight: 600;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  box-shadow: 0 4px 15px rgba(225, 48, 108, 0.4);',
      '}'
    ].join('\\n');

    (document.head || document.documentElement).appendChild(style);
  }

  // 2. Cooldown Warning Banner DOM Manager
  function updateCooldownBanner(remainingSec) {
    var existing = document.getElementById('noreels-cooldown-banner');
    if (remainingSec <= 0) {
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
      return;
    }

    if (!existing) {
      existing = document.createElement('div');
      existing.id = 'noreels-cooldown-banner';
      (document.body || document.documentElement).appendChild(existing);
    }

    var mins = Math.floor(remainingSec / 60);
    var secs = remainingSec % 60;
    var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;

    existing.innerHTML = '<span>🔒 <strong>NoReels Lockout Active</strong>: ' + timeStr + ' left</span>' +
      '<button id="noreels-banner-dm-btn" style="background:#E1306C; color:#fff; border:none; padding:4px 10px; border-radius:12px; font-size:11px; cursor:pointer;">Go to DMs</button>';

    var dmBtn = document.getElementById('noreels-banner-dm-btn');
    if (dmBtn) {
      dmBtn.onclick = function() {
        window.location.replace(CONFIG.defaultRedirectPath);
      };
    }
  }

  // 3. Single-Reel Lock in DMs: freeze vertical swipe/scroll
  function updateDmReelLock(currentPath) {
    var now = Date.now();
    var lastDirect = parseInt(safeGet(STORAGE_LAST_DIRECT, '0'), 10);
    var hasVideoDialog = false;
    try {
      hasVideoDialog = !!document.querySelector('div[role="dialog"] video, article video');
    } catch(e) {}
    var isDmMedia = (isSinglePostOrReel(currentPath) && (document.referrer.indexOf('/direct/') !== -1 || (now - lastDirect) < 300000)) ||
                    (isDirect(currentPath) && hasVideoDialog);

    isDmReelLockActive = isDmMedia;

    if (isDmMedia) {
      document.documentElement.classList.add('noreels-single-reel-locked');
      document.body && document.body.classList.add('noreels-single-reel-locked');
    } else {
      document.documentElement.classList.remove('noreels-single-reel-locked');
      document.body && document.body.classList.remove('noreels-single-reel-locked');
    }
  }

  // Non-passive gesture & scroll interceptors for single reel lock
  function onTouchStart(e) {
    if (!isDmReelLockActive || !e.touches || !e.touches[0]) return;
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
  }

  function onTouchMove(e) {
    if (!isDmReelLockActive || !e.touches || !e.touches[0]) return;
    var currentY = e.touches[0].clientY;
    var currentX = e.touches[0].clientX;
    var deltaY = Math.abs(currentY - touchStartY);
    var deltaX = Math.abs(currentX - touchStartX);

    var target = e.target;
    var isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    if (isInput) return;

    // Freeze all vertical swipe gestures to lock on single reel
    if (deltaY > 2 && deltaY >= deltaX) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function onWheel(e) {
    if (!isDmReelLockActive) return;
    var target = e.target;
    var isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    if (!isInput) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function onKeyDown(e) {
    if (!isDmReelLockActive) return;
    var target = e.target;
    var isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    if (isInput) return;

    // Block vertical scroll keys that flip reels
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'PageDown' || e.key === 'PageUp' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
  window.addEventListener('wheel', onWheel, { passive: false, capture: true });
  window.addEventListener('keydown', onKeyDown, { passive: false, capture: true });

  // 4. Intercept clicks on deep links and Reels tab
  var origOpen = window.open;
  try {
    window.open = function(url) {
      if (typeof url === 'string') {
        if (url.indexOf('intent://') === 0 || url.indexOf('instagram://') === 0 || url.indexOf('play.google.com') !== -1 || url.indexOf('apps.apple.com') !== -1) {
          return null;
        }
      }
      return origOpen ? origOpen.apply(this, arguments) : null;
    };
  } catch(e) {}

  document.addEventListener('click', function(e) {
    var target = e.target;
    while (target && target !== document.body) {
      if (target.tagName === 'A') {
        var href = target.getAttribute('href') || '';
        // Intercept deep links
        if (href.indexOf('intent://') === 0 || href.indexOf('instagram://') === 0 || href.indexOf('play.google.com') !== -1 || href.indexOf('itunes.apple.com') !== -1 || href.indexOf('apps.apple.com') !== -1) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        // Intercept Reels navigation
        if (isReels(href)) {
          e.preventDefault();
          e.stopPropagation();
          window.location.replace(CONFIG.defaultRedirectPath);
          return;
        }
        // Intercept feeds during cooldown
        var now = Date.now();
        var cooldownUntil = parseInt(safeGet(STORAGE_COOLDOWN, '0'), 10);
        if (cooldownUntil > now && isFeed(href)) {
          e.preventDefault();
          e.stopPropagation();
          window.location.replace(CONFIG.defaultRedirectPath);
          return;
        }
      }
      target = target.parentNode;
    }
  }, true);

  // 5. Timer & Cooldown State Machine
  function tick() {
    var now = Date.now();
    var currentPath = window.location.pathname;
    var cooldownUntil = parseInt(safeGet(STORAGE_COOLDOWN, '0'), 10);
    var isCooldown = cooldownUntil > now;

    if (isDirect(currentPath)) {
      safeSet(STORAGE_LAST_DIRECT, now);
    }

    updateDmReelLock(currentPath);

    if (isCooldown) {
      var cooldownRemaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
      updateCooldownBanner(cooldownRemaining);

      // Lockout: redirect away from Feeds and Reels
      if (isFeed(currentPath) || isReels(currentPath)) {
        window.location.replace(CONFIG.defaultRedirectPath);
      }

      postToHost({
        type: 'NOREELS_STATE_UPDATE',
        payload: {
          currentPath: currentPath,
          activeFeedSeconds: CONFIG.feedTimeLimitSeconds,
          feedSecondsRemaining: 0,
          cooldownActive: true,
          cooldownSecondsRemaining: cooldownRemaining,
          isDmReelLocked: isDmReelLockActive,
          isFeedRoute: isFeed(currentPath),
          isSafeRoute: isDirect(currentPath),
          timestamp: now
        }
      });
      return;
    }

    // Cooldown expired
    if (cooldownUntil > 0 && cooldownUntil <= now) {
      safeSet(STORAGE_COOLDOWN, '0');
      safeSet(STORAGE_FEED, '0');
      updateCooldownBanner(0);
    }

    var feedSeconds = parseInt(safeGet(STORAGE_FEED, '0'), 10);

    // Active feed timer: only tick if tab is visible and on feed route
    var isTabActive = !document.hidden && (document.visibilityState ? document.visibilityState === 'visible' : true);
    if (isFeed(currentPath) && isTabActive) {
      feedSeconds += 1;
      safeSet(STORAGE_FEED, feedSeconds);

      // Trigger cooldown when feed limit is reached
      if (feedSeconds >= CONFIG.feedTimeLimitSeconds) {
        var newCooldown = now + (CONFIG.cooldownDurationSeconds * 1000);
        safeSet(STORAGE_COOLDOWN, newCooldown);
        safeSet(STORAGE_FEED, '0');
        window.location.replace(CONFIG.defaultRedirectPath);
        return;
      }
    }

    var feedRemaining = Math.max(0, CONFIG.feedTimeLimitSeconds - feedSeconds);
    updateCooldownBanner(0);

    postToHost({
      type: 'NOREELS_STATE_UPDATE',
      payload: {
        currentPath: currentPath,
        activeFeedSeconds: feedSeconds,
        feedSecondsRemaining: feedRemaining,
        cooldownActive: false,
        cooldownSecondsRemaining: 0,
        isDmReelLocked: isDmReelLockActive,
        isFeedRoute: isFeed(currentPath),
        isSafeRoute: isDirect(currentPath),
        timestamp: now
      }
    });
  }

  // 6. SPA Route Watcher
  function onRouteChange() {
    injectStyles();
    tick();
  }

  var origPushState = history.pushState;
  if (origPushState) {
    history.pushState = function() {
      var ret = origPushState.apply(this, arguments);
      onRouteChange();
      return ret;
    };
  }

  var origReplaceState = history.replaceState;
  if (origReplaceState) {
    history.replaceState = function() {
      var ret = origReplaceState.apply(this, arguments);
      onRouteChange();
      return ret;
    };
  }

  window.addEventListener('popstate', onRouteChange);
  window.addEventListener('hashchange', onRouteChange);

  // Fallback route watcher with MutationObserver
  var lastObservedPath = window.location.pathname;
  var observer = new MutationObserver(function() {
    if (window.location.pathname !== lastObservedPath) {
      lastObservedPath = window.location.pathname;
      onRouteChange();
    }
  });

  function startObserver() {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      setTimeout(startObserver, 200);
    }
  }

  // 7. Host Command Listener (for bidirectional messaging)
  window.addEventListener('message', function(event) {
    try {
      var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (!data || !data.type) return;

      if (data.type === 'NOREELS_NAVIGATE' && data.payload && data.payload.path) {
        window.location.replace(data.payload.path);
      } else if (data.type === 'NOREELS_RESET_TIMER') {
        safeSet(STORAGE_FEED, '0');
        safeSet(STORAGE_COOLDOWN, '0');
        tick();
      } else if (data.type === 'NOREELS_TRIGGER_COOLDOWN') {
        var newCooldown = Date.now() + (CONFIG.cooldownDurationSeconds * 1000);
        safeSet(STORAGE_COOLDOWN, newCooldown);
        safeSet(STORAGE_FEED, '0');
        window.location.replace(CONFIG.defaultRedirectPath);
      }
    } catch(e) {}
  });

  // Start engine
  injectStyles();
  startObserver();
  onRouteChange();
  setInterval(tick, 1000);
})();`;
}
