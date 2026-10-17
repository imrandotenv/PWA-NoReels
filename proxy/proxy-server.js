/**
 * NoReels Universal - Local & Production Reverse Proxy Server
 * 
 * Solves the web browser `X-Frame-Options: DENY` and `frame-ancestors 'self'` CSP restrictions
 * by proxying requests to Instagram, stripping frame-blocking headers, rewriting cookies for iframe
 * persistence, and injecting the Anti-Doomscroll Wellbeing Engine payload directly into the HTML.
 */

const http = require('http');
const https = require('https');
const zlib = require('zlib');
const url = require('url');

const PORT = process.env.PORT || 3001;
const TARGET_HOST = 'www.instagram.com';

const fs = require('fs');
const path = require('path');

// Cache for injected Wellbeing Engine script loaded from unified source
let cachedInjectionScript = null;

async function getInjectedScript() {
  if (cachedInjectionScript) return cachedInjectionScript;

  try {
    const { getWellbeingEngineScript } = await import('../src/engine/wellbeingEngine.ts');
    cachedInjectionScript = `\n<!-- NoReels Anti-Doomscroll Engine Injected by Proxy -->\n<script>\n${getWellbeingEngineScript()}\n</script>\n`;
    return cachedInjectionScript;
  } catch (err) {
    const enginePath = path.resolve(__dirname, '../src/engine/wellbeingEngine.ts');
    const content = fs.readFileSync(enginePath, 'utf-8');
    const match = content.match(/return `\([\s\S]*?\)\(\);`;/);
    if (match) {
      const code = match[0].replace(/^return `/, '').replace(/`;$/, '');
      cachedInjectionScript = `\n<!-- NoReels Anti-Doomscroll Engine Injected by Proxy -->\n<script>\n${code}\n</script>\n`;
      return cachedInjectionScript;
    }
    throw new Error('Could not load Wellbeing Engine script: ' + err.message);
  }
}

const server = http.createServer((clientReq, clientRes) => {
  const parsedUrl = new URL(clientReq.url, `http://${clientReq.headers.host || 'localhost'}`);

  // Health check endpoint
  if (parsedUrl.pathname === '/health') {
    clientRes.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    clientRes.end(JSON.stringify({ status: 'ok', server: 'NoReels Universal Proxy', timestamp: Date.now() }));
    return;
  }

  // CORS preflight
  if (clientReq.method === 'OPTIONS') {
    clientRes.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Credentials': 'true',
    });
    clientRes.end();
    return;
  }

  // Prepare proxy request to Instagram
  const headers = { ...clientReq.headers };
  headers['host'] = TARGET_HOST;
  headers['origin'] = `https://${TARGET_HOST}`;
  headers['referer'] = `https://${TARGET_HOST}/`;

  // Preserve client IP
  const clientIp = clientReq.socket.remoteAddress;
  if (clientIp) {
    headers['x-forwarded-for'] = clientIp;
  }

  const options = {
    hostname: TARGET_HOST,
    port: 443,
    path: clientReq.url,
    method: clientReq.method,
    headers: headers,
  };

  const proxyReq = https.request(options, (proxyRes) => {
    const resHeaders = { ...proxyRes.headers };

    // 1. Strip frame restrictions so iframe loads anywhere
    delete resHeaders['x-frame-options'];
    delete resHeaders['content-security-policy'];
    delete resHeaders['content-security-policy-report-only'];
    delete resHeaders['cross-origin-opener-policy'];
    delete resHeaders['cross-origin-embedder-policy'];
    delete resHeaders['cross-origin-resource-policy'];

    // 2. Set permissive CORS and iframe embedding headers
    resHeaders['access-control-allow-origin'] = clientReq.headers.origin || '*';
    resHeaders['access-control-allow-credentials'] = 'true';
    resHeaders['access-control-allow-methods'] = 'GET, POST, OPTIONS, PUT, DELETE';
    resHeaders['access-control-allow-headers'] = '*';

    // 3. Rewrite Set-Cookie for iframe persistence (SameSite=None; Secure)
    if (resHeaders['set-cookie']) {
      const cookies = Array.isArray(resHeaders['set-cookie'])
        ? resHeaders['set-cookie']
        : [resHeaders['set-cookie']];

      resHeaders['set-cookie'] = cookies.map((cookieStr) => {
        let updated = cookieStr.replace(/;\s*Domain=[^;]+/i, '');
        if (!/;\s*SameSite=/i.test(updated)) {
          updated += '; SameSite=None; Secure';
        } else {
          updated = updated.replace(/;\s*SameSite=(Lax|Strict)/i, '; SameSite=None; Secure');
        }
        return updated;
      });
    }

    const contentType = resHeaders['content-type'] || '';
    const isHtml = contentType.includes('text/html');

    if (!isHtml) {
      // Pipe non-HTML responses directly
      clientRes.writeHead(proxyRes.statusCode || 200, resHeaders);
      proxyRes.pipe(clientRes);
      return;
    }

    // Decompress and inject engine into HTML responses
    const contentEncoding = resHeaders['content-encoding'];
    const chunks = [];

    proxyRes.on('data', (chunk) => {
      chunks.push(chunk);
    });

    proxyRes.on('end', async () => {
      const buffer = Buffer.concat(chunks);
      const injectionScript = await getInjectedScript();

      const processHtml = (htmlString) => {
        // Inject script right before </head> or </body>
        let modifiedHtml = htmlString;
        if (htmlString.includes('</head>')) {
          modifiedHtml = htmlString.replace('</head>', injectionScript + '</head>');
        } else if (htmlString.includes('</body>')) {
          modifiedHtml = htmlString.replace('</body>', injectionScript + '</body>');
        } else {
          modifiedHtml = htmlString + injectionScript;
        }
        return modifiedHtml;
      };

      const sendResponse = (finalBuffer, encoding) => {
        if (encoding) {
          resHeaders['content-encoding'] = encoding;
        } else {
          delete resHeaders['content-encoding'];
        }
        delete resHeaders['content-length'];
        resHeaders['content-length'] = Buffer.byteLength(finalBuffer);

        clientRes.writeHead(proxyRes.statusCode || 200, resHeaders);
        clientRes.end(finalBuffer);
      };

      if (contentEncoding === 'gzip') {
        zlib.gunzip(buffer, (err, decoded) => {
          if (err) {
            clientRes.writeHead(500);
            clientRes.end('Decompression error');
            return;
          }
          const injected = processHtml(decoded.toString('utf-8'));
          zlib.gzip(Buffer.from(injected, 'utf-8'), (gzipErr, gzipped) => {
            if (gzipErr) {
              sendResponse(Buffer.from(injected, 'utf-8'), null);
            } else {
              sendResponse(gzipped, 'gzip');
            }
          });
        });
      } else if (contentEncoding === 'deflate') {
        zlib.inflate(buffer, (err, decoded) => {
          if (err) {
            clientRes.writeHead(500);
            clientRes.end('Decompression error');
            return;
          }
          const injected = processHtml(decoded.toString('utf-8'));
          sendResponse(Buffer.from(injected, 'utf-8'), null);
        });
      } else if (contentEncoding === 'br') {
        zlib.brotliDecompress(buffer, (err, decoded) => {
          if (err) {
            clientRes.writeHead(500);
            clientRes.end('Decompression error');
            return;
          }
          const injected = processHtml(decoded.toString('utf-8'));
          zlib.brotliCompress(Buffer.from(injected, 'utf-8'), (brErr, brotlied) => {
            if (brErr) {
              sendResponse(Buffer.from(injected, 'utf-8'), null);
            } else {
              sendResponse(brotlied, 'br');
            }
          });
        });
      } else {
        const injected = processHtml(buffer.toString('utf-8'));
        sendResponse(Buffer.from(injected, 'utf-8'), null);
      }
    });
  });

  proxyReq.on('error', (err) => {
    clientRes.writeHead(502, { 'Content-Type': 'application/json' });
    clientRes.end(JSON.stringify({ error: 'Proxy request failed', message: err.message }));
  });

  clientReq.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`[NoReels Proxy] Server running on http://localhost:${PORT}`);
  console.log(`[NoReels Proxy] Target: https://${TARGET_HOST}`);
  console.log(`[NoReels Proxy] X-Frame-Options and CSP headers stripped. Anti-Doomscroll Engine injected.`);
});

module.exports = server;
