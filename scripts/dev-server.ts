// Minimal local dev server for the api/cards/* routes.
// Uses Node's built-in http module + a tiny adapter that exposes the
// VercelRequest/VercelResponse surface the handlers expect.
//
// Run with: npm run dev
// Then open: http://localhost:3000/
import 'dotenv/config';
import http from 'http';
import {URL} from 'url';
import type {VercelRequest, VercelResponse} from '@vercel/node';

import profileDetailsHandler from '../api/cards/profile-details';
import reposPerLanguageHandler from '../api/cards/repos-per-language';
import mostCommitLanguageHandler from '../api/cards/most-commit-language';
import statsHandler from '../api/cards/stats';
import productiveTimeHandler from '../api/cards/productive-time';

type RouteHandler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void;

const routes: Record<string, RouteHandler> = {
    '/api/cards/profile-details': profileDetailsHandler,
    '/api/cards/repos-per-language': reposPerLanguageHandler,
    '/api/cards/most-commit-language': mostCommitLanguageHandler,
    '/api/cards/stats': statsHandler,
    '/api/cards/productive-time': productiveTimeHandler
};

const PORT = Number(process.env.PORT ?? 3000);

const indexHtml = (host: string) => `<!doctype html>
<html><head><meta charset="utf-8"><title>Profile Summary Cards — Dev</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 960px; margin: 2rem auto; padding: 0 1rem; color: #222; }
  h1 { margin-top: 0 }
  h2 { margin-top: 2rem; border-bottom: 1px solid #ddd; padding-bottom: 0.2rem }
  form { display: flex; gap: 0.5rem; align-items: end; margin-bottom: 1rem; flex-wrap: wrap }
  label { display: flex; flex-direction: column; font-size: 0.85rem }
  input, select { padding: 0.4rem; border: 1px solid #aaa; border-radius: 4px; font: inherit }
  button { padding: 0.45rem 0.9rem; border: 0; background: #0366d6; color: #fff; border-radius: 4px; cursor: pointer; font: inherit }
  button:hover { background: #0256bd }
  ul { line-height: 1.7 }
  code { background: #eef; padding: 1px 4px; border-radius: 3px }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem }
  .grid > div { border: 1px solid #ddd; border-radius: 6px; padding: 0.5rem; background: #fafafa }
  .grid > .wide { grid-column: 1 / -1 }
  .grid img { width: 100%; height: auto }
  .small { font-size: 0.85rem; color: #666 }
</style>
</head><body>
<h1>github-profile-summary-cards — Dev</h1>
<p>This dev server runs the same Vercel route handlers locally. Type a user or org login below to render every card.</p>
<form id="renderForm">
  <label>Login (user or org)<input name="login" value="vercel" autocomplete="off" required></label>
  <label>Theme<select name="theme">
    <option>default</option>
    <option>github_dark</option>
    <option>tokyonight</option>
    <option>solarized</option>
    <option>dracula</option>
    <option>gruvbox</option>
    <option>nord_dark</option>
  </select></label>
  <button>Render</button>
</form>
<div id="preview" class="grid"></div>

<h2>Direct routes</h2>
<ul>
  <li><a href="/api/cards/profile-details?username=vercel&theme=default" target="_blank">/api/cards/profile-details?username=vercel&theme=default</a> (org)</li>
  <li><a href="/api/cards/profile-details?username=vn7n24fzkq&theme=default" target="_blank">/api/cards/profile-details?username=vn7n24fzkq&theme=default</a> (user, regression)</li>
  <li><a href="/api/cards/stats?username=vercel&theme=github_dark" target="_blank">/api/cards/stats?username=vercel&theme=github_dark</a></li>
  <li><a href="/api/cards/repos-per-language?username=vercel&theme=default" target="_blank">/api/cards/repos-per-language?username=vercel&theme=default</a></li>
  <li><a href="/api/cards/most-commit-language?username=vercel&theme=default" target="_blank">/api/cards/most-commit-language?username=vercel&theme=default</a></li>
  <li><a href="/api/cards/productive-time?username=vercel&theme=default" target="_blank">/api/cards/productive-time?username=vercel&theme=default</a> (org &rarr; error card)</li>
  <li><a href="/api/cards/productive-time?username=vn7n24fzkq&theme=default" target="_blank">/api/cards/productive-time?username=vn7n24fzkq&theme=default</a> (user)</li>
</ul>

<p class="small">Server: <code>${host}</code></p>

<script>
(function() {
  var cards = ['profile-details', 'repos-per-language', 'most-commit-language', 'stats', 'productive-time'];
  var form = document.getElementById('renderForm');
  var grid = document.getElementById('preview');

  function render(login, theme) {
    grid.replaceChildren();
    if (!login) return;
    cards.forEach(function(c) {
      var wrap = document.createElement('div');
      // profile-details has a 700x200 SVG; span both columns so the chart
      // gets real estate and the remaining four cards form a 2x2 below.
      if (c === 'profile-details') wrap.className = 'wide';
      var label = document.createElement('div');
      label.className = 'small';
      label.textContent = c;
      var img = document.createElement('img');
      var url = '/api/cards/' + c
        + '?username=' + encodeURIComponent(login)
        + '&theme=' + encodeURIComponent(theme);
      img.src = url;
      img.alt = c;
      wrap.appendChild(label);
      wrap.appendChild(img);
      grid.appendChild(wrap);
    });
  }

  // Restore the last login + theme on page load so a refresh doesn't blank the grid.
  try {
    var savedLogin = localStorage.getItem('devLogin') || '';
    var savedTheme = localStorage.getItem('devTheme') || '';
    if (savedLogin) form.login.value = savedLogin;
    if (savedTheme) {
      for (var i = 0; i < form.theme.options.length; i++) {
        if (form.theme.options[i].value === savedTheme) {
          form.theme.selectedIndex = i;
          break;
        }
      }
    }
    // Fall back to whatever the form is currently showing (default "vercel") so a fresh
    // first-time visitor with empty localStorage still gets a populated grid on load.
    var initialLogin = savedLogin || form.login.value.trim();
    if (initialLogin) render(initialLogin, form.theme.value);
  } catch (err) { /* localStorage unavailable; non-fatal */ }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var login = e.target.login.value.trim();
    var theme = e.target.theme.value;
    try {
      localStorage.setItem('devLogin', login);
      localStorage.setItem('devTheme', theme);
    } catch (err) { /* ignore */ }
    render(login, theme);
  });
})();
</script>
</body></html>`;

const server = http.createServer(async (rawReq, rawRes) => {
    try {
        const url = new URL(rawReq.url ?? '/', `http://${rawReq.headers.host}`);
        if (url.pathname === '/' || url.pathname === '/index.html') {
            rawRes.setHeader('Content-Type', 'text/html; charset=utf-8');
            rawRes.end(indexHtml(rawReq.headers.host ?? `localhost:${PORT}`));
            return;
        }
        const handler = routes[url.pathname];
        if (!handler) {
            rawRes.statusCode = 404;
            rawRes.end(`No route for ${url.pathname}`);
            return;
        }
        const query: Record<string, string> = {};
        url.searchParams.forEach((v, k) => (query[k] = v));
        const req = Object.assign(rawReq, {query, cookies: {}, body: undefined}) as unknown as VercelRequest;
        const res = Object.assign(rawRes, {
            status(code: number) {
                rawRes.statusCode = code;
                return res;
            },
            send(body: any) {
                if (typeof body === 'string' || Buffer.isBuffer(body)) {
                    rawRes.end(body);
                } else {
                    rawRes.setHeader('Content-Type', 'application/json');
                    rawRes.end(JSON.stringify(body));
                }
                return res;
            },
            json(body: any) {
                rawRes.setHeader('Content-Type', 'application/json');
                rawRes.end(JSON.stringify(body));
                return res;
            }
        }) as unknown as VercelResponse;

        await handler(req, res);
    } catch (err: any) {
        console.error(err);
        rawRes.statusCode = 500;
        rawRes.end(`Server error: ${err?.message ?? err}`);
    }
});

server.listen(PORT, () => {
    console.info(`\n  Dev server: http://localhost:${PORT}/\n`);
});
