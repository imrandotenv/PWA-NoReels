/**
 * NoReels Universal - Cloudflare Worker Edge Proxy
 * 
 * Deployable on Cloudflare Workers (Edge network):
 * Strips X-Frame-Options and Content-Security-Policy headers,
 * rewrites Set-Cookie for iframe persistence, and uses HTMLRewriter
 * to inject the Anti-Doomscroll Wellbeing Engine payload directly into <head>.
 */

import { getWellbeingEngineScript } from '../src/engine/wellbeingEngine';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', worker: 'NoReels Edge Proxy' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    // Target Instagram URL
    const targetUrl = new URL(url.pathname + url.search, 'https://www.instagram.com');

    // Clone headers
    const newHeaders = new Headers(request.headers);
    newHeaders.set('Host', 'www.instagram.com');
    newHeaders.set('Origin', 'https://www.instagram.com');
    newHeaders.set('Referer', 'https://www.instagram.com/');

    const targetRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: newHeaders,
      body: request.body,
      redirect: 'follow',
    });

    const response = await fetch(targetRequest);
    const responseHeaders = new Headers(response.headers);

    // 1. Strip frame restrictions
    responseHeaders.delete('x-frame-options');
    responseHeaders.delete('content-security-policy');
    responseHeaders.delete('content-security-policy-report-only');
    responseHeaders.delete('cross-origin-opener-policy');
    responseHeaders.delete('cross-origin-embedder-policy');
    responseHeaders.delete('cross-origin-resource-policy');

    // 2. Set permissive CORS
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');

    // 3. Set-Cookie SameSite=None; Secure
    const cookies = responseHeaders.getAll ? responseHeaders.getAll('set-cookie') : [];
    if (cookies.length > 0) {
      responseHeaders.delete('set-cookie');
      for (const cookie of cookies) {
        let updated = cookie.replace(/;\s*Domain=[^;]+/i, '');
        if (!/;\s*SameSite=/i.test(updated)) {
          updated += '; SameSite=None; Secure';
        } else {
          updated = updated.replace(/;\s*SameSite=(Lax|Strict)/i, '; SameSite=None; Secure');
        }
        responseHeaders.append('set-cookie', updated);
      }
    }

    const contentType = responseHeaders.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    // Wellbeing Engine script to inject
    const engineScript = `<script>\n${getWellbeingEngineScript()}\n</script>`;

    // Inject into HTML using HTMLRewriter
    return new HTMLRewriter()
      .on('head', {
        element(element) {
          element.append(engineScript, { html: true });
        },
      })
      .transform(
        new Response(response.body, {
          status: response.status,
          headers: responseHeaders,
        })
      );
  },
};
