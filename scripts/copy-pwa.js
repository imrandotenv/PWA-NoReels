const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const publicDir = path.join(projectRoot, 'public');
const assetsDir = path.join(projectRoot, 'assets');
const distAssetsDir = path.join(distDir, 'assets');

if (!fs.existsSync(distDir)) {
  console.log('[copy-pwa] dist directory does not exist, creating...');
  fs.mkdirSync(distDir, { recursive: true });
}

if (!fs.existsSync(distAssetsDir)) {
  fs.mkdirSync(distAssetsDir, { recursive: true });
}

// Copy public directory files to dist
if (fs.existsSync(publicDir)) {
  const publicFiles = fs.readdirSync(publicDir);
  for (const file of publicFiles) {
    const srcPath = path.join(publicDir, file);
    const destPath = path.join(distDir, file);
    fs.copyFileSync(srcPath, destPath);
    console.log(`[copy-pwa] Copied public/${file} -> dist/${file}`);
  }
}

// Copy assets to dist/assets
if (fs.existsSync(assetsDir)) {
  const assetFiles = fs.readdirSync(assetsDir);
  for (const file of assetFiles) {
    const srcPath = path.join(assetsDir, file);
    const destPath = path.join(distAssetsDir, file);
    fs.copyFileSync(srcPath, destPath);
    console.log(`[copy-pwa] Copied assets/${file} -> dist/assets/${file}`);
  }
}

// Enhance dist/index.html with PWA tags and Service Worker registration
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf-8');

  const pwaMetaTags = `
    <!-- NoReels PWA Meta Tags -->
    <meta name="theme-color" content="#000000" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="NoReels" />
    <meta name="description" content="Cross-platform Digital Wellbeing for Instagram with strict 5-min feed limit and single-reel lock." />
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/assets/icon.png" />
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/sw.js').then(function(reg) {
            console.log('[NoReels PWA] Service Worker registered with scope:', reg.scope);
          }).catch(function(err) {
            console.warn('[NoReels PWA] Service Worker registration failed:', err);
          });
        });
      }
    </script>
  `;

  if (!html.includes('manifest.json')) {
    html = html.replace('</head>', pwaMetaTags + '\n</head>');
    fs.writeFileSync(indexPath, html, 'utf-8');
    console.log('[copy-pwa] Injected PWA tags and Service Worker into dist/index.html');
  }
}

console.log('[copy-pwa] PWA build enhancement complete.');
