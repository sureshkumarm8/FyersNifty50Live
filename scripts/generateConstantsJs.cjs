/**
 * Emit plain-JS mirrors of the constant data modules.
 *
 * WHY THIS EXISTS
 *
 * `api/cron-fetch.js` is a plain-node serverless handler — it cannot import a
 * `.ts` file. It has always asked for `../constants/paytmMappings.js` and
 * `../constants/niftyWeeklyOptions.js`, and neither file existed: only the `.ts`
 * sources did. So the endpoint failed at module load with
 * "Cannot find module .../constants/paytmMappings.js" and never wrote a single
 * row, which is why `snapshots:index` only ever contained snapshots produced by
 * an open browser tab. Close the tab, reload it, or let the host sleep and
 * market history simply stopped — and momentumEntryGuard needs continuous
 * ~1/minute rows, so a 15-minute hole cost roughly 30 minutes of tradeable
 * session while the hole rolled out of its 15-minute window.
 *
 * These two modules are pure data plus a little lookup logic, so stripping the
 * type annotations is a faithful transform: same exports, same values.
 *
 * STALENESS IS THE REAL HAZARD
 *
 * `constants/niftyWeeklyOptions.ts` is regenerated every week when the expiry
 * rolls. A stale `.js` mirror would silently make the background fetcher poll
 * last week's strikes, which is worse than not fetching at all. Guards:
 *
 *   - `npm run generate:options` and `npm run generate:paytm` both chain into
 *     this script, so regenerating a `.ts` always refreshes its mirror.
 *   - `npm run prebuild` runs it, so a deployed build cannot ship a stale copy.
 *   - `server.js` compares mtimes at startup and warns if a mirror is older
 *     than its source.
 */

const { transformSync } = require('esbuild');
const { readFileSync, writeFileSync, statSync } = require('fs');
const { join, basename } = require('path');

const ROOT = join(__dirname, '..');

/** Sources that a plain-node handler needs to be able to import. */
const SOURCES = ['constants/paytmMappings.ts', 'constants/niftyWeeklyOptions.ts'];

const BANNER =
  '// GENERATED FILE - DO NOT EDIT.\n' +
  '// Plain-JS mirror emitted from the .ts source by scripts/generateConstantsJs.cjs\n' +
  '// so plain-node handlers (api/cron-fetch.js) can import it. Edit the .ts and\n' +
  '// run `npm run generate:constants`.\n';

let failed = false;

for (const rel of SOURCES) {
  const src = join(ROOT, rel);
  const out = src.replace(/\.ts$/, '.js');
  try {
    const ts = readFileSync(src, 'utf8');
    // Type-stripping only: no bundling, no minifying, no syntax downlevelling,
    // so the emitted values stay byte-identical to the source's intent.
    const { code } = transformSync(ts, {
      loader: 'ts',
      format: 'esm',
      sourcefile: basename(src)
    });
    writeFileSync(out, BANNER + code);
    const bytes = statSync(out).size;
    console.log(`[constants] ${rel} -> ${basename(out)} (${(bytes / 1024).toFixed(1)} KB)`);
  } catch (err) {
    failed = true;
    console.error(`[constants] FAILED on ${rel}: ${err.message}`);
  }
}

if (failed) process.exit(1);
