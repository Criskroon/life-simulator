/**
 * Full playthrough — birth to death in a real browser, with a written
 * narrative of every event and choice.
 *
 * Strategy:
 *   - Choices use our own seeded RNG (default seed: 42) so the *decisions*
 *     are reproducible run-to-run.
 *   - Event *selection* is driven by the in-app store, which seeds itself
 *     from Date.now/Math.random. So two runs with the same --seed will make
 *     the same decisions but may see different events. The report tells the
 *     story that actually happened.
 *
 * Output: testing/reports/playthrough-YYYY-MM-DD-HHmm.md
 *
 * CLI flags:
 *   --headless         hide the browser window
 *   --seed=N           seed for choice RNG (default 42)
 *   --maxYears=N       safety cap (default 130)
 *   --target=vercel    test against the live Vercel deploy
 */
import { chromium, type Browser, type Page } from 'playwright';
import { ensureDevServer, DEV_URL } from '../lib/devServer';
import { createRng } from '../../src/game/engine/rng';
import { SEEDS } from '../fixtures/seeds';
import { relPath, reportPath, writeReport } from '../lib/report';
import type { HistoryEntry, PlayerState } from '../../src/game/types/gameState';

const VERCEL_URL = 'https://life-simulator-ruddy-eta.vercel.app/';
const SAVE_KEY = 'reallifesim:save:v1';

interface Args {
  headless: boolean;
  seed: number;
  maxYears: number;
  target: 'local' | 'vercel';
}

function parseArgs(argv: string[]): Args {
  const headless = argv.includes('--headless');
  const seedArg = argv.find((a) => a.startsWith('--seed='));
  const seed = seedArg ? Number(seedArg.split('=')[1]) : SEEDS.playthrough;
  const maxArg = argv.find((a) => a.startsWith('--maxYears='));
  const maxYears = maxArg ? Number(maxArg.split('=')[1]) : 130;
  const targetArg = argv.find((a) => a.startsWith('--target='));
  const target = targetArg?.split('=')[1] === 'vercel' ? 'vercel' : 'local';
  return { headless, seed, maxYears, target };
}

async function readSavedState(page: Page): Promise<PlayerState | null> {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlayerState;
  } catch {
    return null;
  }
}

async function startNewLife(page: Page) {
  await page.getByRole('button', { name: /start a new life/i }).click();
  await page.getByRole('button', { name: /^be born$/i }).click();
  await page.waitForSelector('text=/age \\d+/i', { timeout: 5000 });
}

async function isDead(page: Page): Promise<boolean> {
  return page.locator('text=/died of/i').isVisible().catch(() => false);
}

async function resolvePendingEvents(
  page: Page,
  pickIndex: (numChoices: number) => number,
): Promise<void> {
  const dialog = page.locator('[role="dialog"]');
  for (let safety = 0; safety < 100; safety++) {
    const visible = await dialog.isVisible().catch(() => false);
    if (!visible) return;
    const choices = dialog.locator('button');
    const count = await choices.count();
    if (count === 0) return;
    const idx = Math.min(Math.max(0, pickIndex(count)), count - 1);
    await choices.nth(idx).click();
    await page.waitForTimeout(80);
  }
}

async function ageUp(page: Page) {
  const button = page.getByRole('button', { name: /^age \+1$/i });
  // Button is disabled while events are pending; wait for it to be enabled.
  await button.waitFor({ state: 'visible' });
  if (await button.isDisabled()) {
    await page.waitForTimeout(100);
  }
  await button.click({ trial: false });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const url = args.target === 'vercel' ? VERCEL_URL : DEV_URL;
  const rng = createRng(args.seed);

  let server: Awaited<ReturnType<typeof ensureDevServer>> | null = null;
  if (args.target === 'local') server = await ensureDevServer();

  const browser: Browser = await chromium.launch({ headless: args.headless });
  const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const page = await context.newPage();

  // Clear any prior save before we start, so we begin from a fresh menu.
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.evaluate((key) => window.localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: 'domcontentloaded' });

  await startNewLife(page);
  // Resolve any birth-year events the store may have queued already.
  await resolvePendingEvents(page, (n) => rng.int(0, n - 1));

  let yearsAged = 0;
  let lastSeenAge = 0;
  const eventOccurrences = new Map<string, number>();

  while (yearsAged < args.maxYears) {
    if (await isDead(page)) break;

    await resolvePendingEvents(page, (n) => rng.int(0, n - 1));

    if (await isDead(page)) break;

    await ageUp(page);
    await page.waitForTimeout(80);
    await resolvePendingEvents(page, (n) => rng.int(0, n - 1));

    const state = await readSavedState(page);
    if (!state) {
      await page.waitForTimeout(150);
      continue;
    }

    if (state.age !== lastSeenAge) {
      lastSeenAge = state.age;
      yearsAged += 1;
      // Track event occurrences so we can highlight oncePerLife vs. repeats
      // in the final report.
      for (const entry of state.history) {
        if (entry.eventId === 'birth' || entry.eventId === 'death') continue;
        eventOccurrences.set(entry.eventId, (eventOccurrences.get(entry.eventId) ?? 0) + 1);
      }
      // Reset and rebuild from scratch each iteration; map is small enough that
      // a fresh count is simpler than incremental bookkeeping.
      eventOccurrences.clear();
      for (const entry of state.history) {
        if (entry.eventId === 'birth' || entry.eventId === 'death') continue;
        eventOccurrences.set(entry.eventId, (eventOccurrences.get(entry.eventId) ?? 0) + 1);
      }
    }

    if (!state.alive) break;
  }

  // Final read after death-screen transition.
  await page.waitForTimeout(300);
  const finalState = await readSavedState(page);

  await browser.close();
  if (server) await server.stop();

  if (!finalState) {
    console.error('No saved state found — playthrough did not complete.');
    process.exit(1);
  }

  const md = renderReport(finalState, args.seed, eventOccurrences);
  const reportFile = reportPath('playthrough');
  const written = writeReport(reportFile, md);
  console.log(`\nReport: ${relPath(written)}`);
  console.log(
    `Lived to ${finalState.age}, died of ${finalState.causeOfDeath ?? 'unknown'} ` +
      `(${finalState.history.length} history entries)`,
  );
}

function renderReport(
  state: PlayerState,
  seed: number,
  occurrences: Map<string, number>,
): string {
  const oncePer: string[] = [];
  const repeats: Array<[string, number]> = [];
  for (const [id, count] of occurrences.entries()) {
    if (count === 1) oncePer.push(id);
    else repeats.push([id, count]);
  }
  repeats.sort((a, b) => b[1] - a[1]);

  const lines: string[] = [];
  lines.push(`# Full Playthrough — ${state.firstName} ${state.lastName}`);
  lines.push('');
  lines.push(`- **Seed:** ${seed}`);
  lines.push(`- **Born:** ${state.birthYear} in ${state.country}`);
  lines.push(`- **Died:** age ${state.age} (${state.currentYear}), cause: ${state.causeOfDeath ?? 'unknown'}`);
  lines.push('');

  lines.push('## Final stats');
  lines.push('');
  lines.push(`| Stat | Value |`);
  lines.push(`|---|---|`);
  lines.push(`| Health | ${state.stats.health} |`);
  lines.push(`| Happiness | ${state.stats.happiness} |`);
  lines.push(`| Smarts | ${state.stats.smarts} |`);
  lines.push(`| Looks | ${state.stats.looks} |`);
  lines.push(`| Money | ${state.money} |`);
  lines.push(`| Crimes | ${state.criminalRecord.length} |`);
  lines.push(`| Relationships | ${state.relationships.length} |`);
  lines.push(`| Assets | ${state.assets.length} |`);
  lines.push('');

  lines.push('## Life story');
  lines.push('');
  for (const entry of state.history) {
    lines.push(formatHistoryLine(entry));
  }
  lines.push('');

  lines.push('## Event frequency');
  lines.push('');
  lines.push(`- **Once-per-life events seen:** ${oncePer.length}`);
  lines.push(`- **Events that repeated:** ${repeats.length}`);
  if (repeats.length > 0) {
    lines.push('');
    lines.push(`| Event ID | Times triggered |`);
    lines.push(`|---|---|`);
    for (const [id, count] of repeats.slice(0, 20)) {
      lines.push(`| ${id} | ${count} |`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

function formatHistoryLine(entry: HistoryEntry): string {
  const choice = entry.choiceLabel ? ` _(chose: ${entry.choiceLabel})_` : '';
  return `- **Age ${entry.age} (${entry.year})** — ${entry.description}${choice}`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
