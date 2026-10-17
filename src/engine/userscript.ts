import { getWellbeingEngineScript } from './wellbeingEngine';

export function generateBookmarklet(): string {
  const rawCode = getWellbeingEngineScript();
  // Encode URI components safely for bookmarklet URL
  const minified = rawCode
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  return `javascript:(function(){try{${minified}}catch(e){console.error('NoReels Bookmarklet Error:',e);}})();`;
}

export function generateUserscript(): string {
  const engineCode = getWellbeingEngineScript();
  return `// ==UserScript==
// @name         NoReels Universal — Instagram Anti-Doomscroll Shield
// @namespace    https://noreels.universal
// @version      1.0.0
// @description  Cross-platform Digital Wellbeing: 5-minute feed limits, 1-hour lockout, single-reel DM lock, and AMOLED dark mode.
// @author       Imran Ahmad
// @match        https://*.instagram.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';
  ${engineCode}
})();
`;
}
