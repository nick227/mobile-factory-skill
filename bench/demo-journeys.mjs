#!/usr/bin/env node
// Drives the five Lab demo journeys with real clicks and typing in headless Chromium
// (react-native-web). Evidence level: web browser. NOT native iOS/Android evidence.
// Usage: npx expo export --platform web --output-dir <web>   (in apps/lab)
//        node bench/demo-journeys.mjs <web dir> <out dir>     (needs playwright-core; CHROMIUM=path)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const [webDir, outDir] = process.argv.slice(2);
const require = createRequire(process.env.PLAYWRIGHT_FROM ? path.join(process.env.PLAYWRIGHT_FROM, 'x.js') : import.meta.url);
const { chromium } = require('playwright-core');
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

const results = [];
async function journey(name, scenario, steps) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  const log = [];
  const step = async (label, fn) => { await fn(); log.push(label); };
  try {
    await page.goto(`${base}/scenario/${scenario}`, { waitUntil: 'networkidle' });
    await steps({ page, step, see: (t) => page.getByText(t, { exact: false }).first().waitFor({ timeout: 5000 }), click: (t, i = 0) => page.getByText(t, { exact: true }).nth(i).click(), role: (r, n) => page.getByRole(r, { name: n, exact: false }).first() });
    if (errors.length) throw new Error(`runtime errors: ${errors.join(' | ')}`);
    results.push({ name, ok: true, steps: log.length });
  } catch (err) {
    await page.screenshot({ path: path.join(outDir, `${scenario}-failure.png`), fullPage: true });
    results.push({ name, ok: false, failedAfter: log.at(-1) ?? '(start)', error: String(err.message ?? err).split('\n')[0].slice(0, 300) });
  }
  await page.screenshot({ path: path.join(outDir, `${scenario}-end.png`), fullPage: true });
  await page.close();
}

await journey('Event Discovery: search → filter → detail → booking → confirmation → cancel', 'eventDiscovery', async ({ page, step, see, click }) => {
  await step('search narrows to sake', async () => { await page.getByLabel('Search experiences').fill('sake'); await see('Fushimi Sake Brewery'); if (await page.getByText('Kaiseki Cooking Masterclass').count()) throw new Error('search did not filter'); });
  await step('no-match empty state', async () => { await page.getByLabel('Search experiences').fill('zzz'); await see('No experiences match'); await click('Clear search and filters'); await see('Kaiseki Cooking Masterclass'); });
  await step('category filter', async () => { await page.getByText('Kaiseki Dining').first().click(); await see('Fushimi Sake Brewery'); if (await page.getByText('Bamboo Forest Dawn Walk').count()) throw new Error('filter did not apply'); });
  await step('open the tapped event', async () => { await page.getByText('Kaiseki Cooking Masterclass').first().click(); await see('Prepare a seven-course'); });
  await step('booking requires a slot', async () => { await click('Book Time Slot'); await see('Select a time to continue'); });
  await step('choose slot and guests', async () => { await page.getByText('01:30 PM').first().click(); await page.getByText('2 guests', { exact: true }).click(); await see('total $360.00'); });
  await step('confirm and pay', async () => { await page.getByText('Confirm Reservation · $360.00').click(); await see('Complete Booking'); await page.getByText('Confirm & Pay $360.00').click(); await see('Booking Confirmed'); await see('Reference KYO-E6-1120-PM'); });
  await step('reservation visible on detail and cancellable', async () => { await click('View Reservation'); await see('You are booked'); await click('Cancel Reservation'); await see('Cancel this reservation?'); await page.getByText('Cancel Reservation').last().click(); await see('Book Time Slot'); await page.getByText('Cancel this reservation?').waitFor({ state: 'hidden', timeout: 3000 }); });
});

await journey('Onboarding: validation → preferences → plan → review edit → activation', 'onboardingCheckout', async ({ page, step, see }) => {
  await step('invalid profile shows errors', async () => { await page.getByLabel('Studio Handle').fill('x'); await page.getByLabel('Studio Handle').blur(); await see('Use @ followed by 3–20'); });
  await step('valid profile continues', async () => { await page.getByLabel('Studio or Creator Name').fill('Ren Takahashi'); await page.getByLabel('Studio Handle').fill('Ren_Arch'); await page.getByLabel('Email').fill('ren@studio.jp'); await page.getByText('Continue', { exact: true }).click(); await see('Primary Craft Discipline'); });
  await step('choose discipline', async () => { await page.getByText('Ceramic Arts').first().click(); await page.getByText('Continue', { exact: true }).click(); await see('Select Membership Plan'); });
  await step('change plan updates inclusions and price', async () => { await page.getByRole('combobox').first().click(); await page.getByText('Fellowship Resident ($120.00/mo)').last().click(); await see('Monthly critique with a master'); await page.getByText('Continue', { exact: true }).click(); await see('Review & Confirm'); await see('Fellowship Resident · $120.00/mo'); });
  await step('edit discipline from review; input preserved', async () => { await page.getByLabel('Edit Discipline').click(); await see('Primary Craft Discipline'); await page.getByText('Woodblock & Intaglio').first().click(); await page.getByText('Continue', { exact: true }).click(); await page.getByText('Continue', { exact: true }).click(); await see('Ren Takahashi · @ren_arch · ren@studio.jp'); await see('Woodblock & Intaglio'); });
  await step('activate', async () => { await page.getByText('Activate · $120.00/mo').click(); await see('Activating Membership'); await page.getByText('Membership Active').waitFor({ timeout: 8000 }); await see('Receipt sent to ren@studio.jp'); });
});

await journey('Progress Dashboard: log hours → milestone details → complete milestone', 'progressDashboard', async ({ page, step, see }) => {
  await step('log hours updates metric and stats', async () => { await see('148.0'); await page.getByText('Log 2 hrs', { exact: true }).click(); await see('Logged 2 hrs to Full-Scale Model Construction'); await see('150.0'); });
  await step('open current milestone', async () => { await page.getByText('Open Current Milestone').click(); await see('Base frame assembly'); await see('Studio session logged'); });
  await step('complete milestone advances the roadmap', async () => { await page.getByText('Mark Milestone Complete').click(); await see('Next: Public Exhibition'); await see('3/4'); await page.getByText('Roadmap', { exact: true }).click(); await page.getByRole('button', { name: /Public Exhibition & Tea Ceremony/ }).first().click(); await see('No sessions logged yet'); });
});

await journey('Marketplace: filter → product qty → bag edits → checkout validation → order', 'marketplaceCommerce', async ({ page, step, see }) => {
  await step('filter tea utensils', async () => { await page.getByText('Tea Utensils').first().click(); await see('Hammered Tin Tea Caddy'); if (await page.getByText('Kinran Gold Leaf Silk Cushion').count()) throw new Error('filter did not apply'); });
  await step('sold-out item cannot be added', async () => { await see('Sold out'); });
  await step('product page quantity and add', async () => { await page.getByText('Hammered Tin Tea Caddy').first().click(); await page.getByLabel('Increase Hammered Tin Tea Caddy').click(); await page.getByText('Add 2 to Bag · $350.00').click(); await see('Added 2 × Hammered Tin Tea Caddy'); await page.getByText('View Bag (2)').click(); });
  await step('bag quantity and totals', async () => { await see('Subtotal (2 items)'); await page.getByLabel('Increase Hammered Tin Tea Caddy').click(); await see('Subtotal (3 items)'); await see('$525.00'); await see('Free'); });
  await step('checkout validation', async () => { await page.getByText('Checkout', { exact: true }).click(); await page.getByText(/^Place Order/).click(); await see('Enter the recipient name'); });
  await step('order confirmation', async () => { await page.getByLabel('Recipient name').fill('Aiko Mori'); await page.getByLabel('Delivery address').fill('12 Shijo-dori, Kyoto'); await page.getByText(/^Place Order/).click(); await see('Confirm Purchase'); await page.getByRole('button', { name: /^Pay \$/ }).click(); await see('Order Confirmed'); await see('KM-01042'); await see('3 × Hammered Tin Tea Caddy'); });
});

await journey('Activity Timeline: feed link → checklist → sign-off → calendar', 'activityTimeline', async ({ page, step, see }) => {
  await step('feed link opens the task', async () => { await page.getByText('Open in Punch List').nth(1).click(); await see('Opened from the feed'); await see('Install shoji screen track runners'); });
  await step('sign-off disabled until required items done', async () => { const btn = page.getByRole('button', { name: /Submit Site Sign-off/ }).first(); if (!(await btn.isDisabled()) && (await btn.getAttribute('aria-disabled')) !== 'true') throw new Error('sign-off should be disabled'); });
  await step('complete task and sign off', async () => { await page.getByRole('checkbox', { name: /Install shoji screen track runners/ }).first().click(); await page.getByText('Submit Site Sign-off').click(); await see('Site sign-off submitted'); });
  await step('feed records the work', async () => { await page.getByText('Activity Feed', { exact: true }).click(); await see('Submitted site sign-off'); await see('Completed: Install shoji screen track runners'); });
  await step('calendar shows the related day', async () => { await page.getByText('Show on Calendar').first().click(); await see('Schedule for 2026-11-18'); await see('Framing inspection with Master Kuma'); });
});

await browser.close();
server.close();
fs.writeFileSync(path.join(outDir, 'journeys.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 1));
process.exit(results.every((r) => r.ok) ? 0 : 1);
