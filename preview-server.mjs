import http from 'node:http';
import https from 'node:https';
import { spawn } from 'node:child_process';

const publicPort = Number(process.env.PORT || 3000);
const expoPort = publicPort === 3000 ? 3001 : publicPort + 1;
const apiOrigin = new URL('https://veraapp.app');

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

  if (requestUrl.pathname === '/api' || requestUrl.pathname.startsWith('/api/')) {
    const target = new URL(requestUrl.pathname + requestUrl.search, apiOrigin);
    proxyRequest(req, res, target);
    return;
  }

  const target = new URL(requestUrl.pathname + requestUrl.search, `http://127.0.0.1:${expoPort}`);
  proxyRequest(req, res, target);
});

server.listen(publicPort, '0.0.0.0', () => {
  console.log(`Preview proxy listening on http://0.0.0.0:${publicPort}`);
  console.log(`API requests are proxied to ${apiOrigin.origin}`);
});

function shutdown() {
  server.close();
  expo.kill('SIGTERM');
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);