/**
 * FitCheck AI - Local & Container Development Server
 *
 * Translates HTTP requests into standard Web Requests and delegates all API handling
 * to the Cloudflare Worker (src/worker.ts). Contains zero Express dependencies.
 */

// Fix: tsx defines globalThis.__dirname as '.' which causes vite-plugin-pwa
// and Node createRequire() to crash when resolving relative package paths.
// Deleting it restores standard ESM behavior.
// @ts-ignore
if (typeof (globalThis as any).__dirname !== 'undefined' && (globalThis as any).__dirname === '.') {
  // @ts-ignore
  delete (globalThis as any).__dirname;
}

import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import worker from './src/worker';

dotenv.config();

const PORT = 3000;
const HOST = '0.0.0.0';

/**
 * Convert Node.js IncomingMessage to standard Web API Request
 */
async function nodeToWebRequest(req: http.IncomingMessage, port = PORT): Promise<Request> {
  const protocol = 'http';
  const host = req.headers.host || `localhost:${port}`;
  const url = new URL(req.url || '/', `${protocol}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v);
      } else {
        headers.set(key, value);
      }
    }
  }

  const method = req.method || 'GET';
  let body: BodyInit | null = null;
  if (method !== 'GET' && method !== 'HEAD') {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    body = Buffer.concat(chunks);
  }

  return new Request(url.toString(), {
    method,
    headers,
    body,
  });
}

/**
 * Stream Web API Response back to Node.js ServerResponse
 */
async function sendWebResponse(res: http.ServerResponse, webRes: Response): Promise<void> {
  res.statusCode = webRes.status;
  res.statusMessage = webRes.statusText;

  webRes.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (webRes.body) {
    const reader = webRes.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}

/**
 * Simple static file mime-type map for production fallback
 */
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  let viteMiddleware: any = null;
  let vitePromise: Promise<void> | null = null;

  function serveStatic(req: http.IncomingMessage, res: http.ServerResponse, urlPath: string) {
    const distDir = fs.existsSync(path.join(process.cwd(), 'dist'))
      ? path.join(process.cwd(), 'dist')
      : process.cwd();

    let filePath = path.join(distDir, urlPath);
    let stat: fs.Stats | null = null;
    try {
      stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
        stat = fs.statSync(filePath);
      }
    } catch {
      // Fallback for SPA routing to dist/index.html
      filePath = path.join(distDir, 'index.html');
    }

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.statusCode = 404;
      res.end('Not Found');
    }
  }

  const server = http.createServer(async (req, res) => {
    try {
      const urlPath = req.url?.split('?')[0] || '/';

      // Route all API requests through the Cloudflare Worker endpoint immediately
      if (urlPath.startsWith('/api/')) {
        const webRequest = await nodeToWebRequest(req);
        const webResponse = await worker.fetch(webRequest, {
          GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        });
        await sendWebResponse(res, webResponse);
        return;
      }

      // Digital Asset Links for Android TWA verification
      if (urlPath === '/.well-known/assetlinks.json') {
        const assetLinksPath = path.join(process.cwd(), 'public/.well-known/assetlinks.json');
        if (fs.existsSync(assetLinksPath)) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          fs.createReadStream(assetLinksPath).pipe(res);
          return;
        }
      }

      // Privacy Policy for Google Play compliance
      if (urlPath === '/privacy' || urlPath === '/privacy.html') {
        const privacyDev = path.join(process.cwd(), 'public/privacy.html');
        const privacyProd = path.join(process.cwd(), 'dist/privacy.html');
        const targetPath = fs.existsSync(privacyProd) ? privacyProd : privacyDev;
        if (fs.existsSync(targetPath)) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          fs.createReadStream(targetPath).pipe(res);
          return;
        }
      }

      // Development: Hand off to Vite middlewares for HMR / asset serving
      if (!isProduction) {
        if (!viteMiddleware && vitePromise) {
          await vitePromise;
        }
        if (viteMiddleware) {
          viteMiddleware(req, res, () => {
            serveStatic(req, res, urlPath);
          });
          return;
        }
      }

      // Production: Serve static assets from dist/
      serveStatic(req, res, urlPath);
    } catch (err: any) {
      console.error('Server error:', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    }
  });

  if (!isProduction) {
    vitePromise = createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server },
      },
      appType: 'spa',
    })
      .then((vite) => {
        viteMiddleware = vite.middlewares;
      })
      .catch((err) => {
        console.error('Failed to initialize Vite development middleware:', err);
      });
  }

  server.listen(PORT, HOST, () => {
    console.log(`FitCheck AI Server (Cloudflare Worker backend) running on http://${HOST}:${PORT}`);
  });
}

startServer();
