import http from 'node:http';
import https from 'node:https';
import { spawn } from 'node:child_process';

const publicPort = Number(process.env.PORT || 3000);
const expoPort = publicPort === 3000 ? 3001 : publicPort + 1;

// Main veraapp.app backend (auth, categories, services, cart, etc.)
const veraOrigin = new URL('https://veraapp.app');

// Replit API server handles: orders + payments (Stripe/Tabby/Tamara)
// Port is passed via REPLIT_API_PORT (default 5000)
const replitApiPort = Number(process.env.REPLIT_API_PORT || 5000);
const replitApiOrigin = new URL(`http://127.0.0.1:${replitApiPort}`);

// Paths that must be routed to the local Replit API server
const REPLIT_API_PREFIXES = [
  '/api/buyer/orders',
  '/api/payments/stripe',
  '/api/payments/tabby',
  '/api/payments/tamara',
  '/api/healthz',
];

function isReplitApiPath(pathname) {
  return REPLIT_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/') || pathname.startsWith(prefix + '?'));
}

const expo = spawn(
  'npx',
  ['expo', 'start', '--web', '--port', String(expoPort)],
  {
    env: { ...process.env, BROWSER: 'none' },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

expo.stdout.on('data', (chunk) => process.stdout.write(`[expo] ${chunk}`));
expo.stderr.on('data', (chunk) => process.stderr.write(`[expo] ${chunk}`));
expo.on('exit', (code, signal) => {
  if (code !== 0 && signal !== 'SIGTERM') {
    console.error(`Expo preview exited unexpectedly (${code ?? signal ?? 'unknown'})`);
    process.exitCode = 1;
  }
});

function proxyRequest(req, res, target) {
  const client = target.protocol === 'https:' ? https : http;
  const headers = { ...req.headers, host: target.host };
  delete headers.origin;
  delete headers.referer;

  const upstream = client.request(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || (target.protocol === 'https:' ? 443 : 80),
      method: req.method,
      path: `${target.pathname}${target.search}`,
      headers,
    },
    (upstreamResponse) => {
      const responseHeaders = { ...upstreamResponse.headers };
      if (responseHeaders['set-cookie']) {
        responseHeaders['set-cookie'] = responseHeaders['set-cookie'].map((cookie) =>
          cookie.replace(/;\s*secure/gi, ''),
        );
      }
      res.writeHead(upstreamResponse.statusCode || 502, responseHeaders);
      upstreamResponse.pipe(res);
    },
  );

  upstream.on('error', (error) => {
    console.error(`Preview proxy error for ${target.href}: ${error.message}`);
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'تعذر الاتصال بالخادم' }));
  });

  req.pipe(upstream);
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const { pathname, search } = requestUrl;

  if (pathname === '/api' || pathname.startsWith('/api/')) {
    if (isReplitApiPath(pathname)) {
      // Route to local Replit API server
      const target = new URL(pathname + search, replitApiOrigin);
      proxyRequest(req, res, target);
    } else {
      // Route to external veraapp.app
      const target = new URL(pathname + search, veraOrigin);
      proxyRequest(req, res, target);
    }
    return;
  }

  // All other requests → Expo web dev server
  const target = new URL(pathname + search, `http://127.0.0.1:${expoPort}`);
  proxyRequest(req, res, target);
});

server.listen(publicPort, '0.0.0.0', () => {
  console.log(`Preview proxy listening on http://0.0.0.0:${publicPort}`);
  console.log(`Orders/Payments API → http://127.0.0.1:${replitApiPort}`);
  console.log(`Other API calls     → ${veraOrigin.origin}`);
});

function shutdown() {
  server.close();
  expo.kill('SIGTERM');
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
