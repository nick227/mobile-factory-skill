#!/usr/bin/env node
// Drives an assembled Pantry Pal web export through its journeys in headless Chromium and screenshots
// each page in light and dark. Web rendering (react-native-web) approximates native layout; it is
// functional and visual evidence for the web target only, NOT iOS/Android device evidence.
//
//   PLAYWRIGHT_DIR=<dir with playwright-core installed> node bench/assembly/journey-probe.mjs <web export dir> <out dir>
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const [webDir, outDir] = process.argv.slice(2);
const { chromium } = createRequire(path.join(process.env.PLAYWRIGHT_DIR ?? process.cwd(), 'x.js'))('playwright-core');
fs.mkdirSync(outDir, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  let p = path.join(webDir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(webDir, 'index.html');
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] ?? 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? `${process.env.HOME}/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome` });
const checks = [];
const check = (name, ok, detail) => { checks.push({ name, ok: Boolean(ok), detail }); console.log(`${ok ? '✓' : '✗'} ${name}${detail && !ok ? ` — ${detail}` : ''}`); };

for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  const shot = (name) => page.screenshot({ path: path.join(outDir, `${scheme}-${name}.png`) });
  const visible = (text) => page.getByText(text, { exact: true }).first().isVisible().catch(() => false);
  const tag = (s) => `[${scheme}] ${s}`;

  await page.goto(base + '/', { waitUntil: 'commit' });
  let sawSkeleton = false;
  for (let i = 0; i < 100 && !sawSkeleton; i++) {
    sawSkeleton = await page.evaluate(() => Boolean(document.querySelector('[aria-label="Loading"]'))).catch(() => false);
    if (!sawSkeleton) await page.waitForTimeout(30);
  }
  check(tag('first load shows calm skeletons'), sawSkeleton);
  await page.getByText('Spinach', { exact: true }).waitFor({ timeout: 5000 });
  const order = await page.evaluate(() => ['Spinach', 'Milk', 'Basmati rice'].map((t) => [...document.querySelectorAll('div')].find((d) => d.textContent === t)?.getBoundingClientRect().top ?? -1));
  check(tag('list sorted soonest expiry first'), order.every((y, i) => y > 0 && (i === 0 || y > order[i - 1])), JSON.stringify(order));
  check(tag('used-up items hidden in "In stock"'), !(await visible('Greek yogurt')));
  check(tag('header present'), await visible('Pantry'));
  await shot('1-pantry');

  await page.getByPlaceholder('Search items').fill('rice');
  check(tag('search narrows the list'), (await visible('Basmati rice')) && !(await visible('Milk')));
  await page.getByPlaceholder('Search items').fill('');
  await page.getByText('Used up', { exact: true }).first().click();
  check(tag('segment shows used-up items'), await page.getByText('Greek yogurt', { exact: true }).isVisible().catch(() => false));
  await page.getByText('In stock', { exact: true }).first().click();

  await page.getByText('Spinach', { exact: true }).click();
  await page.getByText('Quantity', { exact: true }).waitFor({ timeout: 5000 });
  check(tag('row opens detail route'), new URL(page.url()).pathname === '/items/spinach', page.url());
  check(tag('detail has back control'), await page.getByRole('button', { name: 'Back' }).isVisible());
  await shot('2-detail');

  await page.getByRole('button', { name: 'Delete' }).first().click();
  await page.getByText('Delete Spinach?').waitFor({ timeout: 3000 });
  check(tag('delete asks for confirmation'), true);
  await page.waitForTimeout(400); // let the modal fade finish before capturing
  await shot('3-confirm');
  await page.getByRole('button', { name: 'Delete' }).last().click();
  await page.getByText('Milk', { exact: true }).waitFor({ timeout: 5000 });
  check(tag('confirmed delete removes the item and returns'), !(await visible('Spinach')) && new URL(page.url()).pathname === '/');

  await page.getByRole('button', { name: 'Add' }).click();
  await page.getByText('Add item', { exact: true }).waitFor({ timeout: 3000 });
  await page.getByRole('button', { name: 'Save' }).click();
  check(tag('empty submit shows validation errors'), await visible('Name is required'));
  await shot('4-form-errors');
  const boxes = page.getByRole('textbox');
  await boxes.nth(0).fill('Eggs');
  await boxes.nth(2).fill('2026-11-25');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByText('Eggs', { exact: true }).waitFor({ timeout: 5000 }).catch(() => {});
  check(tag('valid submit creates the item and returns to the list'), (await visible('Eggs')) && new URL(page.url()).pathname === '/');
  await shot('5-after-create');

  await page.getByText('Milk', { exact: true }).click();
  await page.getByRole('button', { name: 'Mark used up' }).click();
  check(tag('primary action updates state with a notice'), await visible('Milk marked as used up'));
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByText('Edit Milk', { exact: true }).waitFor({ timeout: 5000 });
  check(tag('edit form is prefilled'), (await page.getByRole('textbox').nth(0).inputValue()) === 'Milk');
  await shot('6-edit');
  check(tag('no runtime errors'), errors.length === 0, errors.join(' | '));
  await ctx.close();
}
await browser.close();
server.close();
fs.writeFileSync(path.join(outDir, 'journey.json'), JSON.stringify({ target: 'web (react-native-web, headless Chromium 390×844)', notNativeEvidence: true, checks }, null, 2) + '\n');
const failed = checks.filter((c) => !c.ok).length;
console.log(`${checks.length - failed}/${checks.length} checks passed`);
process.exitCode = failed ? 1 : 0;
