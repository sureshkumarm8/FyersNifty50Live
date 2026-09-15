/**
 * Layout contract between the capture engine's data/exports/ folder and the browser-side
 * importer.
 *
 * The regression that motivated these: the engine had been started before the archive code
 * existed, so runs/2026-09-15/ held 27 per-run files while the day bundle beside it had 56.
 * The importer skipped the bundle purely because the folder existed, and the dashboard sat
 * two hours behind while insisting "everything in that folder was already loaded".
 */
import assert from 'node:assert';
import { __testing } from '../services/visionArchive';

const { completeRunDays, dropRedundantEmbedded, imageKey } = __testing;

// --- minimal stand-in for the File System Access API handles ----------------

type Tree = Record<string, string[]>;

const dirHandle = (tree: Tree, loose: string[] = []): any => ({
  kind: 'directory',
  name: 'exports',
  async getDirectoryHandle(name: string) {
    if (name !== 'runs' || !Object.keys(tree).length) throw new Error('NotFoundError');
    return {
      kind: 'directory',
      async *entries() {
        for (const [date, files] of Object.entries(tree)) {
          yield [date, {
            kind: 'directory',
            async *entries() {
              for (const file of files) yield [file, { kind: 'file' }];
            },
          }];
        }
      },
    };
  },
  async *entries() {
    for (const name of loose) yield [name, { kind: 'file' }];
  },
});

const manifest = (days: Array<{ date: string; runs: number }>) => ({ days });
const runFiles = (n: number, from = 0) =>
  Array.from({ length: n }, (_, i) => `run-2026-09-15T${String(9 + Math.floor((i + from) / 60)).padStart(2, '0')}-${String((i + from) % 60).padStart(2, '0')}-00.json`);

async function run() {
  // A partial per-run mirror must NOT let the importer skip the day bundle.
  const partial = await completeRunDays(
    dirHandle({ '2026-09-15': runFiles(27) }),
    manifest([{ date: '2026-09-15', runs: 56 }])
  );
  assert.equal(partial.has('2026-09-15'), false, 'a 27-of-56 mirror must fall back to the day bundle');

  // A complete mirror may skip it — that's the whole point of the optimisation.
  const complete = await completeRunDays(
    dirHandle({ '2026-09-15': runFiles(56) }),
    manifest([{ date: '2026-09-15', runs: 56 }])
  );
  assert.equal(complete.has('2026-09-15'), true, 'a complete mirror should skip the rewritten bundle');

  // The run file lands before the bundle is rewritten, so the folder can be one ahead.
  const ahead = await completeRunDays(
    dirHandle({ '2026-09-15': runFiles(57) }),
    manifest([{ date: '2026-09-15', runs: 56 }])
  );
  assert.equal(ahead.has('2026-09-15'), true, 'a capture landing mid-scan must not look incomplete');

  // Folders of loose bundles have no manifest; the old "it exists" rule still applies.
  const noManifest = await completeRunDays(dirHandle({ '2026-09-15': runFiles(3) }), null);
  assert.equal(noManifest.has('2026-09-15'), true, 'without a manifest the mirror is all we have');

  // An empty runs/<date>/ is never a substitute for the bundle.
  const empty = await completeRunDays(
    dirHandle({ '2026-09-15': [] }),
    manifest([{ date: '2026-09-15', runs: 56 }])
  );
  assert.equal(empty.has('2026-09-15'), false, 'an empty mirror must not hide the day');

  // Finder litter must not be counted as run data.
  const litter = await completeRunDays(
    dirHandle({ '2026-09-15': ['.DS_Store', 'run-2026-09-15T09-16-00.json'] }),
    manifest([{ date: '2026-09-15', runs: 2 }])
  );
  assert.equal(litter.has('2026-09-15'), false, '.DS_Store is not a run');

  // No runs/ folder at all -> every day falls back to its bundle.
  assert.equal((await completeRunDays(dirHandle({}), manifest([{ date: '2026-09-15', runs: 56 }]))).size, 0);

  // A stale embedded copy must never win over the plain bundle for the same day.
  const picked = dropRedundantEmbedded([
    { name: 'vision-2026-09-15.json' },
    { name: 'vision-2026-09-15.embedded.json' },
    { name: 'vision-2026-09-14.embedded.json' },
  ] as any);
  assert.deepEqual(
    picked.map((f: any) => f.name),
    ['vision-2026-09-15.json', 'vision-2026-09-14.embedded.json'],
    'the embedded copy is dropped only when its plain counterpart is present'
  );

  // Shots resolve by basename whether they came from shots/<date>/ or a loose pick.
  assert.equal(imageKey('shots/2026-09-15/20260915-141459-kite.png'), '20260915-141459-kite.png');
  assert.equal(imageKey('20260915-141459-kite.png'), '20260915-141459-kite.png');

  console.log('visionArchive: 10 assertions passed');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
