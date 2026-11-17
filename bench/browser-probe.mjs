// Requires: npm i playwright-core and a Chromium build (set CHROMIUM=path). Web rendering is not native evidence.
// Browser probe of the exported Lab (react-native-web in headless Chromium).
// Web rendering approximates RN layout; it is NOT native iOS/Android evidence.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
const [webDir, registryFile, outDir] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  let p = path.join(webDir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(webDir, 'index.html');
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] ?? 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? process.env.HOME + '/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome' });
const ids = JSON.parse(fs.readFileSync(registryFile, 'utf8')).map((r) => r.id);
const LAB_CHROME = new Set(['System', 'Light', 'Dark']);
const results = [];
for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme });
  for (const id of ids) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 200)}`); });
    await page.goto(`http://localhost:${port}/component/${id}`, { waitUntil: 'networkidle' }).catch((e) => errors.push(`goto: ${e.message}`));
    await page.waitForTimeout(400);
    const data = await page.evaluate((chrome) => {
      const els = [...document.querySelectorAll('[role=button],[role=checkbox],[role=radio],[role=switch],[role=tab],[role=combobox],[role=link],button,input,[role=slider]')];
      const small = els.map((e) => ({ role: e.getAttribute('role') ?? e.tagName.toLowerCase(), label: (e.getAttribute('aria-label') ?? e.textContent ?? '').trim().slice(0, 40), w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) }))
        .filter((e) => e.w > 0 && e.h > 0 && !chrome.includes(e.label) && !/^Back|^‹/.test(e.label) && (e.w < 44 || e.h < 44));
      const found = document.body.innerText.includes('Showcase unavailable') || document.body.innerText.includes('Not found');
      const bg = getComputedStyle(document.querySelector('[data-testid], div') ?? document.body).backgroundColor;
      return { small, unavailable: found, roles: [...new Set([...document.querySelectorAll('[role]')].map((e) => e.getAttribute('role')))] };
    }, [...LAB_CHROME]);
    if (scheme === 'light' && ['controls.button', 'composites.dialog', 'patterns.schedulepicker', 'patterns.metricspotlight', 'controls.select'].includes(id)) await page.screenshot({ path: `${outDir}/${id}-${scheme}.png`, fullPage: true });
    results.push({ id, scheme, errors, ...data });
    await page.close();
  }
  await ctx.close();
}
await browser.close(); server.close();
fs.writeFileSync(`${outDir}/probe-results.json`, JSON.stringify(results, null, 2));
const light = results.filter((r) => r.scheme === 'light');
console.log(JSON.stringify({
  pages: light.length,
  pagesWithErrors: results.filter((r) => r.errors.length).map((r) => `${r.id}/${r.scheme}: ${r.errors[0]}`),
  unavailable: light.filter((r) => r.unavailable).map((r) => r.id),
  smallTargets: light.filter((r) => r.small.length).map((r) => `${r.id}: ${r.small.map((s) => `${s.role}"${s.label}" ${s.w}x${s.h}`).join('; ')}`),
}, null, 1));
