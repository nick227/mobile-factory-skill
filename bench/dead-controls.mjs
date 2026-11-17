#!/usr/bin/env node
// Dead-control sweep: on a fresh load of each scenario's first screen, click every button and
// flag clicks that change neither the visible text, the URL, nor any aria state. Web evidence only.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const [webDir] = process.argv.slice(2);
const require = createRequire(process.env.PLAYWRIGHT_FROM ? path.join(process.env.PLAYWRIGHT_FROM, 'x.js') : import.meta.url);
const { chromium } = require('playwright-core');
const server = http.createServer((req, res) => { let p = path.join(webDir, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(webDir, 'index.html'); res.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); fs.createReadStream(p).pipe(res); }).listen(0);
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? `${process.env.HOME}/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome` });
const snapshot = (page) => page.evaluate(() => document.body.innerText + '|' + [...document.querySelectorAll('[aria-checked],[aria-selected],[aria-expanded],[aria-disabled]')].map((e) => `${e.getAttribute('aria-checked')}${e.getAttribute('aria-selected')}${e.getAttribute('aria-expanded')}${e.getAttribute('aria-disabled')}`).join(''));
const report = {};
for (const scenario of ['eventDiscovery', 'onboardingCheckout', 'progressDashboard', 'marketplaceCommerce', 'activityTimeline']) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${base}/scenario/${scenario}`, { waitUntil: 'networkidle' });
  const count = await page.locator('[role=button],[role=checkbox],[role=tab],[role=radio],[role=combobox]').count();
  const dead = [];
  for (let i = 0; i < count; i++) {
    await page.goto(`${base}/scenario/${scenario}`, { waitUntil: 'networkidle' });
    const el = page.locator('[role=button],[role=checkbox],[role=tab],[role=radio],[role=combobox]').nth(i);
    const label = ((await el.getAttribute('aria-label')) ?? (await el.innerText().catch(() => ''))).trim().replace(/\s+/g, ' ').slice(0, 50);
    if ((await el.getAttribute('aria-disabled')) === 'true' || !(await el.isVisible())) continue;
    const before = await snapshot(page); const url = page.url();
    await el.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(350);
    if ((await snapshot(page)) === before && page.url() === url) dead.push(label || `(unlabelled #${i})`);
  }
  report[scenario] = { controls: count, dead };
  await page.close();
}
await browser.close(); server.close();
console.log(JSON.stringify(report, null, 1));
