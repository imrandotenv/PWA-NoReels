# NoReels Universal 🧘‍♂️🚫📱
> **Escape the Doomscroll — Cross-Platform Digital Wellbeing Application & Progressive Web App (PWA)**

[![React Native](https://img.shields.io/badge/React%20Native-0.88.0-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-v58.0-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Author](https://img.shields.io/badge/Author-Imran%20Ahmad-blue)](https://github.com/imrandotenv)

---

## 💡 The Philosophy ("The Why")

Modern social media platforms are intentionally engineered with variable reward schedules and infinite feeds designed to capture and hold human attention indefinitely. The algorithm thrives on compulsive micro-consumption, fragmenting focus and destroying attention spans.

Yet, going completely cold turkey is often impractical: friends, family, and colleagues communicate primarily via direct messages.

**NoReels Universal** resolves this dilemma. It acts as a strict digital firewall between meaningful human communication and algorithm-driven doomscrolling. You can connect, message, and respond to direct interactions without falling into algorithmic rabbit holes.

---

## ⚡ Core Anti-Doomscroll Protocols

1. **Shared 5-Minute Feed Limit**
   - A single unified 5-minute (300-second) active countdown shared between Home (`/`) and Explore (`/explore/`) feeds.
   - Timer counts down exclusively during active engagement and persists across sessions and page reloads.

2. **Strict 1-Hour Cooldown Lockout**
   - Once the 5-minute allocation is exhausted, the app triggers a strict 60-minute lockout.
   - Any attempt to access `/`, `/explore/`, or `/reels/` is instantly blocked and redirected straight to Direct Messages (`/direct/inbox/`) with live cooldown notifications.

3. **Single-Reel Lock in Direct Messages**
   - When a friend sends a Reel in DMs, you can open and watch that single video in full quality.
   - However, vertical scrolling and swipe gestures are actively intercepted and frozen (`touch-action: none !important`, `overflow: hidden !important`, blocking `touchmove` and `wheel` propagation).
   - Prevents accidental or impulsive swiping into infinite recommendations.

4. **Deep Link & Aggressive Upsell Suppression**
   - Suppresses intrusive "Open in App" banners, App Store deep link redirects (`intent://`, `instagram://`), and bottom-bar Reels navigation icons.

5. **Pitch-Black AMOLED Dark Theme**
   - High-contrast pure black (`#000000`) minimal interface designed to reduce eye strain and minimize visual stimulation.

6. **Hardware Back-Button Guard**
   - Unified double-tap back button handler across both Native Android and Web/PWA to prevent accidental application exit.

---

## 🌐 Universal Cross-Platform Architecture

NoReels Universal runs anywhere through a unified codebase:

```
                              ┌────────────────────────────────────────┐
                              │           NoReels Universal            │
                              │       (React Native + Expo Web)        │
                              └──────────────────┬─────────────────────┘
                                                 │
                     ┌───────────────────────────┴───────────────────────────┐
                     ▼                                                       ▼
      ┌─────────────────────────────┐                         ┌─────────────────────────────┐
      │     Native Mobile App       │                         │    Progressive Web App      │
      │       (Android & iOS)       │                         │    (Installable in Browser) │
      └──────────────┬──────────────┘                         └──────────────┬──────────────┘
                     │                                                       │
                     ▼                                                       ▼
      ┌─────────────────────────────┐                         ┌─────────────────────────────┐
      │     react-native-webview    │                         │   Dual-Engine Web Delivery  │
      │  - Persistent Cookie Jar    │                         │  1. Proxy Iframe Mode       │
      │  - DOM Storage Enabled      │                         │  2. Companion Dashboard     │
      │  - Injected Script Bridge   │                         │     + Userscript/Bookmarklet│
      └──────────────┬──────────────┘                         └──────────────┬──────────────┘
                     │                                                       │
                     └───────────────────────────┬───────────────────────────┘
                                                 ▼
                              ┌────────────────────────────────────────┐
                              │     wellbeingEngine.ts (Core JS)       │
                              │  - SPA History Interception (pushState)│
                              │  - MutationObserver Route Watcher      │
                              │  - Touch & Scroll Lock Subsystem       │
                              │  - LocalStorage State Machine          │
                              └────────────────────────────────────────┘
```

### 1. Native Mobile (Android & iOS)
- Powered by `react-native-webview` with `sharedCookiesEnabled` and `domStorageEnabled`.
- Direct JavaScript injection via `injectedJavaScriptBeforeContentLoaded` guarantees seamless session persistence and un-bypassable anti-doomscroll protection.

### 2. Progressive Web App (PWA) & Browser Bypass
Standard web browsers block embedding Instagram in an `<iframe>` due to `X-Frame-Options: SAMEORIGIN` and `frame-ancestors` Content Security Policy headers. NoReels Universal solves this via two flexible modes:

- **Mode A: Proxy Iframe Mode**
  - Includes a lightweight Node.js/Express reverse proxy (`proxy/proxy-server.js`) or zero-latency Cloudflare Worker (`proxy/cloudflare-worker.js`).
  - Strips framing headers, injects `wellbeingEngine.ts` into the HTML payload, and serves Instagram within the standalone PWA wrapper.
- **Mode B: PWA Companion Dashboard & Userscript / Bookmarklet**
  - For zero-proxy setups, the PWA provides a live Wellbeing Companion HUD with one-click exportable Bookmarklets and Tampermonkey Userscripts (`noreels.user.js`).

---

## 📁 Project Structure

```
PWA-NoReels/
├── assets/                 # App icons, splash screens, adaptive icons
├── proxy/
│   ├── cloudflare-worker.js # Edge proxy script for serverless deployment
│   ├── proxy-server.js      # Local/remote Node.js Express reverse proxy
│   └── README.md            # Proxy configuration & deployment guide
├── public/
│   ├── manifest.json        # W3C Web App Manifest (standalone, #000000)
│   ├── noreels.user.js      # Standalone browser userscript
│   └── sw.js                # Service Worker for PWA installability & caching
├── scripts/
│   └── copy-pwa.js          # Build script copying PWA assets into dist/
├── src/
│   ├── components/
│   │   ├── AttributionModal.tsx       # Imran Ahmad author attribution modal
│   │   ├── InstagramBrowser.native.tsx # React Native WebView implementation
│   │   ├── InstagramBrowser.web.tsx    # Dual-mode PWA web implementation
│   │   ├── PWAInstallBanner.tsx       # iOS/Android "Add to Home Screen" banner
│   │   ├── Toast.tsx                  # AMOLED animated status toasts
│   │   ├── WebCompanionDashboard.tsx  # Direct browser fallback dashboard
│   │   └── WellbeingHUD.tsx           # Floating timer & cooldown status bar
│   ├── engine/
│   │   ├── types.ts                   # Protocol event & state types
│   │   ├── userscript.ts              # Userscript bundling utilities
│   │   └── wellbeingEngine.ts         # Unified anti-doomscroll runtime engine
│   ├── hooks/
│   │   ├── useDoubleTapBack.ts        # Android/Web back navigation handler
│   │   └── usePWAInstall.ts           # beforeinstallprompt hook
│   └── utils/
│       └── storage.ts                 # Cross-platform persistent storage
├── __tests__/
│   └── wellbeingEngine.test.mjs       # Test suite (8/8 automated tests)
├── App.tsx                  # Root cross-platform application component
├── app.json                 # Expo universal application configuration
├── package.json             # Dependencies and build scripts
└── tsconfig.json            # Strict TypeScript compiler options
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/)

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/imrandotenv/PWA-NoReels.git
cd PWA-NoReels
npm install
```

### 2. Run the PWA / Web Version
Launch the Expo development server in web mode:
```bash
npm run web
```
To run the automated reverse proxy simultaneously:
```bash
npm run proxy
```

### 3. Build Production PWA
Export an optimized static PWA bundle ready for Vercel, Netlify, or GitHub Pages:
```bash
npm run build:web
```
The compiled files with `manifest.json` and `sw.js` will be generated in `dist/`.

### 4. Run on Android or iOS (Native)
Start the Expo Metro bundler:
```bash
npm run android
# or
npm run ios
```

---

## 🧪 Testing

Execute the automated test suite for the Wellbeing Engine:
```bash
npm test
```
Typecheck the entire TypeScript codebase:
```bash
npm run typecheck
```

---

## 👤 Author & Attribution

- **Developer**: Imran Ahmad
- **GitHub**: [@imrandotenv](https://github.com/imrandotenv)
- **Project**: [PWA-NoReels](https://github.com/imrandotenv/PWA-NoReels)

*Dedicated to everyone seeking an escape from algorithmic doomscrolling and reclaiming their focus.*

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
