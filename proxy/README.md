# NoReels Universal — Proxy & Edge Bypass Layer

This directory contains the proxy middleware designed to bypass standard browser restrictions (`X-Frame-Options: DENY` and CSP `frame-ancestors 'self'`) when embedding Instagram in the PWA web wrapper.

## Architecture

1. **Stripping Frame-Blocking Headers**: Removes `X-Frame-Options`, `Content-Security-Policy`, and `Content-Security-Policy-Report-Only` from Instagram's response headers.
2. **SameSite Cookie Rewriting**: Adjusts `Set-Cookie` attributes to `SameSite=None; Secure` so login sessions persist reliably inside an `<iframe>`.
3. **Payload Injection**: Automatically injects the unified Anti-Doomscroll Wellbeing Engine and pitch-black `#000000` AMOLED styles directly before `</head>` in the HTML stream.
4. **Compression Handling**: Transparently decodes and re-compresses Gzip, Brotli, and Deflate streams.

---

## 1. Running the Local Proxy Server

The local proxy is written with native Node.js standard modules (`http`, `https`, `zlib`, `url`) — no external dependencies required.

### Start the Proxy:
```bash
node proxy/proxy-server.js
# Or via npm script:
npm run proxy
```

Default port is `3001`. You can customize it via the `PORT` environment variable:
```bash
PORT=8080 node proxy/proxy-server.js
```

### Health Check:
```bash
curl http://localhost:3001/health
# {"status":"ok","server":"NoReels Universal Proxy"}
```

---

## 2. Deploying to Cloudflare Workers (Edge Network)

The `cloudflare-worker.js` script allows zero-cost serverless deployment on Cloudflare's edge network in over 300 cities worldwide:

1. Create a free account at [Cloudflare](https://cloudflare.com).
2. Install Wrangler:
   ```bash
   npm install -g wrangler
   ```
3. Deploy:
   ```bash
   npx wrangler deploy proxy/cloudflare-worker.js --name noreels-proxy
   ```
4. Enter your deployed worker URL (e.g. `https://noreels-proxy.yourname.workers.dev`) into the NoReels Web Companion Dashboard.

---

## 3. Userscript & Bookmarklet Fallback (Zero Proxy Required)

If you prefer not to run a proxy or want direct navigation on mobile Safari / Chrome:
- Use the **1-Click Bookmarklet** from the NoReels Companion Dashboard.
- Or install `public/noreels.user.js` in Violentmonkey, Tampermonkey, or Orion / Kiwi browser.
