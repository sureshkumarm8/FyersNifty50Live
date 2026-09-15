import { VisionRun, VisionShot } from '../types';

/**
 * Offline archive of vision runs.
 *
 * The capture engine (Playwright + Ollama) can only ever run on the machine with the
 * broker logins, so a deployed dashboard can never call it. The engine therefore also
 * writes a plain folder — `liveImageAnalsis/data/exports/` — containing one JSON bundle
 * per trading day plus the screenshots.
 *
 * This module lets the browser read that folder *directly off disk*:
 *
 *   - a directory picker (File System Access API, Chrome/Edge) which we can remember and
 *     re-sync later with one click, or
 *   - a plain `<input webkitdirectory>` / file picker fallback (any browser), or
 *   - a single self-contained `vision-<date>.embedded.json` with inlined screenshots.
 *
 * Everything is cached in IndexedDB, so the imported data survives reloads and the
 * screens work with no server at all. Nothing is uploaded anywhere.
 */

const DB_NAME = 'vision-archive';
const DB_VERSION = 1;
const RUNS = 'runs';
const IMAGES = 'images';
const META = 'meta';

export const ARCHIVE_SCHEMA = 'vision-archive/v1';

export interface VisionArchiveDay {
  date: string;
  runs: number;
}

export interface VisionArchiveSummary {
  runs: number;
  images: number;
  days: VisionArchiveDay[];
  lastImportAt: string | null;
  sourceName: string | null;
  /** True when a directory handle was remembered and can be re-synced in one click. */
  canResync: boolean;
}

export interface VisionArchiveImport {
  runs: number;
  images: number;
  days: string[];
  bundles: number;
  skipped: number;
  errors: string[];
}

interface StoredRun extends VisionRun {
  day: string;
  importedAt: string;
}

const emptyImport = (): VisionArchiveImport => ({ runs: 0, images: 0, days: [], bundles: 0, skipped: 0, errors: [] });

export const archiveSupported = () => typeof indexedDB !== 'undefined';

export const directoryPickerSupported = () =>
  typeof window !== 'undefined' && typeof (window as any).showDirectoryPicker === 'function';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!archiveSupported()) return Promise.reject(new Error('This browser has no IndexedDB, so archives cannot be stored.'));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(RUNS)) {
        db.createObjectStore(RUNS, { keyPath: 'id' }).createIndex('day', 'day', { unique: false });
      }
      if (!db.objectStoreNames.contains(IMAGES)) db.createObjectStore(IMAGES);
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Could not open the archive database.'));
  });
  return dbPromise;
}

function tx<T>(store: string | string[], mode: IDBTransactionMode, fn: (t: IDBTransaction) => T | Promise<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        let result: T;
        Promise.resolve(fn(t)).then((r) => { result = r; }, reject);
        t.oncomplete = () => resolve(result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error || new Error('Archive transaction aborted'));
      })
  );
}

const wrap = <T,>(req: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

async function metaGet<T>(key: string): Promise<T | undefined> {
  return tx(META, 'readonly', (t) => wrap<T>(t.objectStore(META).get(key)));
}

async function metaSet(key: string, value: unknown): Promise<void> {
  await tx(META, 'readwrite', (t) => { t.objectStore(META).put(value, key); });
}

// --- bundle parsing ---------------------------------------------------------

const isBundle = (data: any) => Boolean(data && Array.isArray(data.runs));

const EMBEDDED_RE = /^vision-(\d{4}-\d{2}-\d{2})\.embedded\.json$/i;

/**
 * A full exports folder holds both `vision-<date>.json` (+ loose PNGs) and, if it was
 * generated with --embed, a self-contained `vision-<date>.embedded.json` for the same day.
 * Importing both would read the same runs twice and duplicate every screenshot, so the
 * embedded copy is dropped whenever its plain counterpart is part of the same selection.
 */
function dropRedundantEmbedded(files: File[]): File[] {
  const plainDates = new Set(
    files
      .map((f) => /^vision-(\d{4}-\d{2}-\d{2})\.json$/i.exec(f.name.split('/').pop() || '')?.[1])
      .filter(Boolean) as string[]
  );
  return files.filter((f) => {
    const embedded = EMBEDDED_RE.exec(f.name.split('/').pop() || '');
    return !embedded || !plainDates.has(embedded[1]);
  });
}

/** Basename, so a shot resolves whether it came from a bundle path or a loose file. */
const imageKey = (name: string) => name.split('/').pop() || name;

function dataUrlToBlob(dataUrl: string): Blob | null {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl);
  if (!match) return null;
  const [, type = 'image/png', base64, payload] = match;
  if (!base64) return new Blob([decodeURIComponent(payload)], { type });
  const bin = atob(payload);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

/** Normalises a run from a bundle and pulls any inlined screenshot out into a blob. */
function normaliseRun(raw: any, date: string): { run: StoredRun; images: Array<[string, Blob]> } {
  const images: Array<[string, Blob]> = [];
  const shots: VisionShot[] = (raw.shots || []).map((shot: any) => {
    const { image, ...rest } = shot || {};
    const file = rest.file || (rest.shotUrl ? imageKey(rest.shotUrl) : undefined);
    if (image && typeof image === 'string' && file) {
      const blob = dataUrlToBlob(image);
      if (blob) images.push([imageKey(file), blob]);
    }
    return { ...rest, file };
  });

  return {
    run: {
      ...raw,
      shots,
      day: date,
      importedAt: new Date().toISOString(),
    },
    images,
  };
}

async function persist(runs: StoredRun[], images: Array<[string, Blob]>): Promise<void> {
  if (!runs.length && !images.length) return;
  await tx([RUNS, IMAGES], 'readwrite', (t) => {
    const runStore = t.objectStore(RUNS);
    runs.forEach((run) => runStore.put(run));
    const imageStore = t.objectStore(IMAGES);
    images.forEach(([key, blob]) => imageStore.put(blob, key));
  });
}

async function ingestBundleText(text: string, label: string, out: VisionArchiveImport): Promise<Array<[string, Blob]>> {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    out.errors.push(`${label}: not valid JSON`);
    return [];
  }

  // index.json (the manifest) carries no runs; the bundles beside it do.
  if (!isBundle(data)) {
    if (!data?.days) out.errors.push(`${label}: not a vision archive bundle`);
    out.skipped += 1;
    return [];
  }

  const date = data.date || (data.runs[0]?.id ? String(data.runs[0].id).slice(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : 'unknown');
  const runs: StoredRun[] = [];
  const images: Array<[string, Blob]> = [];
  for (const raw of data.runs) {
    if (!raw?.id) continue;
    const norm = normaliseRun(raw, raw.day || date);
    runs.push(norm.run);
    images.push(...norm.images);
  }

  await persist(runs, images);
  out.bundles += 1;
  out.runs += runs.length;
  out.images += images.length;
  if (!out.days.includes(date)) out.days.push(date);
  return images;
}

// --- imports ----------------------------------------------------------------

/**
 * Imports whatever the user picked: a whole exports folder (webkitdirectory), a set of
 * bundle files, loose screenshots, or any mix of those.
 */
export async function importFiles(
  files: File[] | FileList,
  onProgress?: (done: number, total: number) => void
): Promise<VisionArchiveImport> {
  const list = Array.from(files as any as File[]);
  const out = emptyImport();
  if (!list.length) return out;

  const jsonFiles = dropRedundantEmbedded(list.filter((f) => f.name.toLowerCase().endsWith('.json')));
  const pngFiles = list.filter((f) => /\.(png|jpe?g|webp)$/i.test(f.name));
  const total = jsonFiles.length + pngFiles.length;
  if (!total) {
    out.errors.push('No .json bundles or screenshots were found in that selection.');
    return out;
  }

  let done = 0;
  for (const file of jsonFiles) {
    await ingestBundleText(await file.text(), file.name, out);
    onProgress?.((done += 1), total);
  }

  // Screenshots referenced by non-embedded bundles, stored by filename.
  const batch: Array<[string, Blob]> = [];
  for (const file of pngFiles) {
    batch.push([imageKey(file.name), file.slice(0, file.size, file.type || 'image/png')]);
    if (batch.length >= 25) {
      await persist([], batch.splice(0));
    }
    onProgress?.((done += 1), total);
  }
  if (batch.length) await persist([], batch);
  out.images += pngFiles.length;

  const source = (list[0] as any).webkitRelativePath?.split('/')[0] || `${list.length} file(s)`;
  await metaSet('lastImportAt', new Date().toISOString());
  await metaSet('sourceName', source);
  return out;
}

// --- File System Access API (Chrome/Edge): remembered folder + one-click re-sync ---

async function walkDirectory(
  dir: any,
  out: VisionArchiveImport,
  known: Set<string>,
  onProgress?: (message: string) => void,
  prefix = ''
): Promise<void> {
  for await (const [name, handle] of dir.entries()) {
    const rel = prefix ? `${prefix}/${name}` : name;
    if (handle.kind === 'directory') {
      await walkDirectory(handle, out, known, onProgress, rel);
      continue;
    }
    if (name.toLowerCase().endsWith('.json')) {
      // The folder always carries the screenshots next to the plain bundle, so a
      // multi-megabyte embedded copy would only duplicate work.
      if (EMBEDDED_RE.test(name)) continue;
      onProgress?.(`Reading ${rel}`);
      await ingestBundleText(await (await handle.getFile()).text(), rel, out);
    } else if (/\.(png|jpe?g|webp)$/i.test(name)) {
      const key = imageKey(name);
      // Screenshots never change once written, so anything already cached is skipped:
      // that makes a re-sync of a full trading day near-instant.
      if (known.has(key)) continue;
      const file = await handle.getFile();
      await persist([], [[key, file.slice(0, file.size, file.type || 'image/png')]]);
      known.add(key);
      out.images += 1;
    }
  }
}

async function readFromDirectory(handle: any, onProgress?: (message: string) => void): Promise<VisionArchiveImport> {
  const out = emptyImport();
  const known = new Set(await tx(IMAGES, 'readonly', (t) => wrap<IDBValidKey[]>(t.objectStore(IMAGES).getAllKeys())).then((k) => k.map(String)));
  await walkDirectory(handle, out, known, onProgress);
  await metaSet('lastImportAt', new Date().toISOString());
  await metaSet('sourceName', handle.name);
  return out;
}

/** Opens the folder picker, remembers the handle and imports everything inside. */
export async function pickDirectory(onProgress?: (message: string) => void): Promise<VisionArchiveImport> {
  if (!directoryPickerSupported()) throw new Error('This browser cannot open a folder directly. Use "Choose files" instead.');
  const handle = await (window as any).showDirectoryPicker({ id: 'vision-archive', mode: 'read' });
  const result = await readFromDirectory(handle, onProgress);
  try {
    await metaSet('dirHandle', handle);
  } catch {
    /* some browsers refuse to structured-clone handles - re-sync just needs a new pick */
  }
  return result;
}

/** Re-reads the remembered folder, picking up days captured since the last import. */
export async function resync(onProgress?: (message: string) => void): Promise<VisionArchiveImport | null> {
  const handle = await metaGet<any>('dirHandle');
  if (!handle) return null;
  const opts = { mode: 'read' as const };
  let permission = await handle.queryPermission?.(opts);
  if (permission !== 'granted') permission = await handle.requestPermission?.(opts);
  if (permission !== 'granted') throw new Error('Permission to read the archive folder was declined.');
  return readFromDirectory(handle, onProgress);
}

export async function hasRememberedDirectory(): Promise<boolean> {
  return Boolean(await metaGet('dirHandle'));
}

// --- reads ------------------------------------------------------------------

const byNewest = (a: VisionRun, b: VisionRun) => String(b.id).localeCompare(String(a.id));

export async function getRuns(date?: string, limit = 400): Promise<VisionRun[]> {
  const runs = await tx(RUNS, 'readonly', (t) => {
    const store = t.objectStore(RUNS);
    return wrap<StoredRun[]>(date ? store.index('day').getAll(date) : store.getAll());
  });
  return runs.sort(byNewest).slice(0, limit);
}

export async function getSummary(): Promise<VisionArchiveSummary> {
  if (!archiveSupported()) {
    return { runs: 0, images: 0, days: [], lastImportAt: null, sourceName: null, canResync: false };
  }
  const [runs, images, lastImportAt, sourceName, canResync] = await Promise.all([
    tx(RUNS, 'readonly', (t) => wrap<StoredRun[]>(t.objectStore(RUNS).getAll())),
    tx(IMAGES, 'readonly', (t) => wrap<number>(t.objectStore(IMAGES).count())),
    metaGet<string>('lastImportAt'),
    metaGet<string>('sourceName'),
    hasRememberedDirectory(),
  ]);

  const counts = new Map<string, number>();
  runs.forEach((run) => counts.set(run.day, (counts.get(run.day) || 0) + 1));

  return {
    runs: runs.length,
    images,
    days: [...counts.entries()].map(([date, n]) => ({ date, runs: n })).sort((a, b) => b.date.localeCompare(a.date)),
    lastImportAt: lastImportAt || null,
    sourceName: sourceName || null,
    canResync,
  };
}

/** Screenshot blob for a shot, looked up by its filename. */
export async function getImage(file?: string): Promise<Blob | null> {
  if (!file) return null;
  const blob = await tx(IMAGES, 'readonly', (t) => wrap<Blob | undefined>(t.objectStore(IMAGES).get(imageKey(file))));
  return blob || null;
}

export async function clear(): Promise<void> {
  await tx([RUNS, IMAGES, META], 'readwrite', (t) => {
    t.objectStore(RUNS).clear();
    t.objectStore(IMAGES).clear();
    t.objectStore(META).clear();
  });
}

export const visionArchive = {
  supported: archiveSupported,
  directoryPickerSupported,
  importFiles,
  pickDirectory,
  resync,
  hasRememberedDirectory,
  getRuns,
  getSummary,
  getImage,
  clear,
};

export default visionArchive;
