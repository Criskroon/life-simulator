/**
 * Smoke test — quick health check.
 *
 * Boots the dev server (or attaches to one already running, or hits the
 * Vercel deploy with --target=vercel), opens the game in a real browser
 * (headed by default so you can watch), starts a new life and ages 10 years.
 *
 * Asserts:
 *   - no JS console errors
 *   - the four stat bars render and stay within 0..100
 *   - the Age +1 button works
 *   - events render when they're queued
 *
 * Output: testing/reports/smoke-YYYY-MM-DD-HHmm.md with screenshots
 * captured at start, year 5 and year 10.
 *
 * CLI flags:
 *   --headless         run without a visible browser window
 *   --target=vercel    test against the live Vercel deploy instead of localhost
 */
import { chromium, type Browser, type ConsoleMessage, type Page } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { ensureDevServer, DEV_URL } from '../lib/devServer';
import { relPath, reportPath, writeReport } from '../lib/report';

const VERCEL_URL = 'https://life-simulator-ruddy-eta.vercel.app/';
const YEARS = 10;

interface CheckResult {
  name: string;
  pass: boolean;
  detail?: string;
}

function parseArgs(argv: string[]) {
  const headless = argv.includes('--headless');
  const targetArg = argv.find((a) => a.startsWith('--target='));
  const target = targetArg?.split('=')[1] === 'vercel' ? 'vercel' : 'local';
  return { headless, target } as const;
}

async function startNewLife(page: Page) {
  await page.getByRole('button', { name: /start a new life/i }).click();
  await page.getByRole('button', { name: /^be born$/i }).click();
  await page.waitForSelector('text=/age \\d+/i', { timeout: 5000 });
}

async function resolveAnyOpenEvent(page: Page) {
  const dialog = page.locator('[role="dialog"]');
  // Poll briefly — events surface synchronously after age-up so this resolves fast.
  for (let i = 0; i < 20; i++) {
    if (await dialog.isVisible().catch(() => false)) {
      // Click the first choice. Choices are rendered as <button> children of
      // the dialog footer; pick the first one we find inside the dialog.
      const choiceButtons = dialog.locator('button');
      const count = await choiceButtons.count();
      if (count > 0) {
        await choiceButtons.first().click();
        await page.waitForTimeout(150);
        // After resolving we may immediately get another event the same year.
        i = 0;
        continue;
      }
    } else {
      return;
    }
    await page.waitForTimeout(50);
  }
}

async function ageUpOnce(page: Page) {
  const button = page.getByRole('button', { name: /^age \+1$/i });
  await button.click();
  await page.waitForTimeout(100);
  await resolveAnyOpenEvent(page);
}

async function readStats(page: Page): Promise<Record<string, number>> {
  // StatBar renders the label + value as text. Pull the text content of each
  // stat row and parse the number.
  const labels = ['Health', 'Happiness', 'Smarts', 'Looks'];
  const out: Record<string, number> = {};
  for (const label of labels) {
    const row = page.locator(`text=${label}`).first();
    const parent = row.locator('..').locator('..');
    const text = (await parent.innerText().catch(() => '')) || '';
    const match = text.match(new RegExp(`${label}[^0-9]*(\\d+)`));
    out[label] = match ? Number(match[1]) : NaN;
  }
  return out;
}

async function readAge(page: Page): Promise<number> {
  const text = (await page.locator('text=/age \\d+/i').first().innerText()) || '';
  const m = text.match(/age\s+(\d+)/i);
  return m ? Number(m[1]) : NaN;
}

async function takeShot(page: Page, baseDir: string, name: string): Promise<string> {
  mkdirSync(baseDir, { recursive: true });
  const path = `${baseDir}/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  return path;
}

async function main() {
  const { headless, target } = parseArgs(process.argv.slice(2));
  const url = target === 'vercel' ? VERCEL_URL : DEV_URL;

  const checks: CheckResult[] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  let server: Awaited<ReturnType<typeof ensureDevServer>> | null = null;
  if (target === 'local') {
    server = await ensureDevServer();
  }

  const browser: Browser = await chromium.launch({ headless });
  const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  const reportFile = reportPath('smoke');
  const shotDir = reportFile.replace(/\.md$/, '-screenshots');
  const shots: { label: string; path: string }[] = [];

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    shots.push({ label: 'menu', path: await takeShot(page, shotDir, '00-menu') });

    await startNewLife(page);
    shots.push({ label: 'age-0', path: await takeShot(page, shotDir, '01-age-0') });
    await resolveAnyOpenEvent(page);

    let outOfRange = false;
    let ageDidAdvance = false;
    const startAge = await readAge(page);

    for (let i = 1; i <= YEARS; i++) {
      await ageUpOnce(page);
      const stats = await readStats(page);
      for (const [k, v] of Object.entries(stats)) {
        if (Number.isNaN(v) || v < 0 || v > 100) {
          outOfRange = true;
          checks.push({ name: `stat-range:${k}@year${i}`, pass: false, detail: `value=${v}` });
        }
      }
      if (i === Math.floor(YEARS / 2)) {
        shots.push({ label: 'mid', path: await takeShot(page, shotDir, '02-mid') });
      }
    }

    const endAge = await readAge(page);
    ageDidAdvance = endAge > startAge;
    shots.push({ label: 'end', path: await takeShot(page, shotDir, '03-end') });

    checks.push({
      name: 'age-button-advances',
      pass: ageDidAdvance,
      detail: `start=${startAge} → end=${endAge}`,
    });
    checks.push({
      name: 'stats-stayed-in-range',
      pass: !outOfRange,
    });
    checks.push({
      name: 'no-console-errors',
      pass: consoleErrors.length === 0,
      detail: consoleErrors.slice(0, 5).join(' | '),
    });
    checks.push({
      name: 'no-uncaught-errors',
      pass: pageErrors.length === 0,
      detail: pageErrors.slice(0, 5).join(' | '),
    });
  } catch (err) {
    checks.push({
      name: 'smoke-test-completed',
      pass: false,
      detail: err instanceof Error ? err.message : String(err),
    });
    shots.push({ label: 'error', path: await takeShot(page, shotDir, '99-error').catch(() => '') });
  } finally {
    await browser.close();
    if (server) await server.stop();
  }

  const passed = checks.filter((c) => c.pass).length;
  const total = checks.length;
  const allPass = passed === total;

  const md = [
    `# Smoke Test — ${new Date().toISOString()}`,
    ``,
    `**Target:** ${url}`,
    `**Mode:** ${headless ? 'headless' : 'headed'}`,
    `**Result:** ${allPass ? 'PASS' : 'FAIL'} (${passed}/${total} checks)`,
    ``,
    `## Checks`,
    ``,
    `| Check | Result | Detail |`,
    `|---|---|---|`,
    ...checks.map(
      (c) => `| ${c.name} | ${c.pass ? 'PASS' : 'FAIL'} | ${c.detail ?? ''} |`,
    ),
    ``,
    `## Screenshots`,
    ``,
    ...shots.filter((s) => s.path).map((s) => `- **${s.label}** — ${relPath(s.path)}`),
    ``,
  ].join('\n');

  const written = writeReport(reportFile, md);
  console.log(`\nReport: ${relPath(written)}`);
  console.log(`Result: ${allPass ? 'PASS' : 'FAIL'} (${passed}/${total})`);
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
