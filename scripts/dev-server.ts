// Minimal local dev server for the api/cards/* routes.
// Uses Node's built-in http module + a tiny adapter that exposes the
// VercelRequest/VercelResponse surface the handlers expect.
//
// Run with: npm run dev
// Then open: http://localhost:3000/
import 'dotenv/config';
import http from 'http';
import {URL} from 'url';
import {readFileSync} from 'fs';
import {join} from 'path';
import type {VercelRequest, VercelResponse} from '@vercel/node';
import {ThemeMap} from '../src/const/theme';

import profileDetailsHandler from '../api/cards/profile-details';
import reposPerLanguageHandler from '../api/cards/repos-per-language';
import mostCommitLanguageHandler from '../api/cards/most-commit-language';
import statsHandler from '../api/cards/stats';
import productiveTimeHandler from '../api/cards/productive-time';
import {parseAnimation, applyAnimation} from '../src/utils/animation';
import {renderMockCard} from './mock-cards';

type RouteHandler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void;

const routes: Record<string, RouteHandler> = {
    '/api/cards/profile-details': profileDetailsHandler,
    '/api/cards/repos-per-language': reposPerLanguageHandler,
    '/api/cards/most-commit-language': mostCommitLanguageHandler,
    '/api/cards/stats': statsHandler,
    '/api/cards/productive-time': productiveTimeHandler
};

const PORT = Number(process.env.PORT ?? 3000);

// Mock mode renders cards from local fixtures (no GitHub token, no network),
// which is ideal for previewing themes/animations. It is on by default when no
// token is configured; force it on/off per request with `?mock=1` / `?mock=0`.
const HAS_TOKEN = Boolean(process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN_0);
function isMock(query: Record<string, string>): boolean {
    if (query.mock === '1') return true;
    if (query.mock === '0') return false;
    return !HAS_TOKEN;
}

const indexHtml = (host: string) => `<!doctype html>
<!-- mock mode: ${HAS_TOKEN ? 'off (token found)' : 'on (no token)'} -->
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
${
    HAS_TOKEN
        ? `<p class="small">GitHub token detected — cards use live data. Append <code>&amp;mock=1</code> to any card URL to preview from fixtures instead.</p>`
        : `<p class="small" style="background:#fff8c5;border:1px solid #d4c65a;padding:.5rem;border-radius:4px">
    <strong>Mock mode</strong> (no GitHub token found): cards render from local fixtures, so the login field is ignored and no network calls are made — perfect for previewing themes &amp; animations. Add a token to <code>.env</code> for live data.</p>`
}
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
  <label>Animation<select name="animation">
    <option value="">none</option>
    <option value="fade">fade</option>
    <option value="rise">rise</option>
    <option value="draw">draw</option>
    <option value="stagger">stagger</option>
    <option value="load">load</option>
    <option value="sequence">sequence</option>
    <option value="tint">tint</option>
    <option value="rgb">rgb</option>
    <option value="rgb-soft">rgb-soft</option>
  </select></label>
  <label>Duration (s)<input name="duration" type="number" step="0.1" min="0.2" max="5" placeholder="default" style="width:6rem"></label>
  <label>Name override<input name="name" type="text" placeholder="(profile-details title)" autocomplete="off" style="width:12rem"></label>
  <button type="submit">Render</button>
  <button type="button" id="replayBtn" title="Re-fetch the cards so the entrance animation plays again">Replay ▶</button>
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

  function render(login, theme, animation, duration, name) {
    grid.replaceChildren();
    if (!login) return;
    // Cache-buster so re-rendering the same login/theme still re-fetches the SVG,
    // which lets a CSS entrance animation play from the start again.
    var bust = Date.now();
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
        + '&theme=' + encodeURIComponent(theme)
        + (animation ? '&animation=' + encodeURIComponent(animation) : '')
        + (animation && duration ? '&duration=' + encodeURIComponent(duration) : '')
        + (name ? '&name=' + encodeURIComponent(name) : '')
        + '&_t=' + bust;
      img.src = url;
      img.alt = c;
      wrap.appendChild(label);
      wrap.appendChild(img);
      grid.appendChild(wrap);
    });
  }

  function selectOption(sel, value) {
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === value) { sel.selectedIndex = i; return; }
    }
  }

  // Restore the last login + theme + animation on page load so a refresh doesn't blank the grid.
  try {
    var savedLogin = localStorage.getItem('devLogin') || '';
    var savedTheme = localStorage.getItem('devTheme') || '';
    var savedAnim = localStorage.getItem('devAnimation') || '';
    var savedDur = localStorage.getItem('devDuration') || '';
    var savedName = localStorage.getItem('devName') || '';
    if (savedLogin) form.login.value = savedLogin;
    if (savedTheme) selectOption(form.theme, savedTheme);
    if (savedAnim) selectOption(form.animation, savedAnim);
    if (savedDur) form.duration.value = savedDur;
    if (savedName) form.name.value = savedName;
    // Fall back to whatever the form is currently showing (default "vercel") so a fresh
    // first-time visitor with empty localStorage still gets a populated grid on load.
    var initialLogin = savedLogin || form.login.value.trim();
    if (initialLogin) render(initialLogin, form.theme.value, form.animation.value, form.duration.value.trim(), form.name.value.trim());
  } catch (err) { /* localStorage unavailable; non-fatal */ }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var login = e.target.login.value.trim();
    var theme = e.target.theme.value;
    var animation = e.target.animation.value;
    var duration = e.target.duration.value.trim();
    var name = e.target.name.value.trim();
    try {
      localStorage.setItem('devLogin', login);
      localStorage.setItem('devTheme', theme);
      localStorage.setItem('devAnimation', animation);
      localStorage.setItem('devDuration', duration);
      localStorage.setItem('devName', name);
    } catch (err) { /* ignore */ }
    render(login, theme, animation, duration, name);
  });

  // Replay re-renders with the current values (new cache-buster) so the animation plays again.
  document.getElementById('replayBtn').addEventListener('click', function() {
    render(form.login.value.trim(), form.theme.value, form.animation.value, form.duration.value.trim(), form.name.value.trim());
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
        // Serve the real landing page (api/pages/demo.html) so it can be tested here
        // against the mock cards — no Vercel CLI, no token needed.
        if (url.pathname === '/demo' || url.pathname === '/demo.html') {
            rawRes.setHeader('Content-Type', 'text/html; charset=utf-8');
            rawRes.end(readFileSync(join(__dirname, '../api/pages/demo.html'), 'utf-8'));
            return;
        }
        // The landing page fetches this to populate the theme dropdown.
        if (url.pathname === '/api/theme') {
            rawRes.setHeader('Content-Type', 'application/json');
            rawRes.end(JSON.stringify({themes: [...ThemeMap.keys()]}));
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

        // Mock mode: render from fixtures without touching GitHub, then apply the
        // same animation the real send path would.
        if (isMock(query)) {
            const card = url.pathname.replace('/api/cards/', '');
            const parsed = Number(query.utcOffset);
            const utcOffset = Number.isFinite(parsed) ? Math.min(14, Math.max(-12, parsed)) : 0;
            const svg = renderMockCard(card, query.theme ?? 'default', utcOffset, query.name);
            rawRes.setHeader('Content-Type', 'image/svg+xml');
            rawRes.end(applyAnimation(svg, parseAnimation(query.animation), query.duration));
            return;
        }
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
