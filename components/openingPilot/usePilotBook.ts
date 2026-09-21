import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyPilotBook } from '../../services/openingPilot';
import { PilotBook } from '../../services/openingPilotTypes';
import { loadPilotBook, PILOT_WRITER_LOCK, savePilotBook } from '../../services/openingPilotStore';

export function usePilotBook() {
  const [book, setBook] = useState<PilotBook>(emptyPilotBook);
  const [loaded, setLoaded] = useState(false);
  const [writer, setWriter] = useState(false);
  const [error, setError] = useState('');
  const [lockMessage, setLockMessage] = useState('');
  const current = useRef(book);
  const writable = useRef(false);
  const mounted = useRef(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const lease = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    let release: (() => void) | undefined;
    const hydrate = async () => {
      const saved = await loadPilotBook();
      if (cancelled) return;
      current.current = saved;
      setBook(saved);
      setLoaded(true);
    };
    const start = async () => {
      if (!navigator.locks) {
        await hydrate();
        setLockMessage('Read-only: this browser needs Web Locks support to safely manage the pilot journal.');
        return;
      }
      await navigator.locks.request(PILOT_WRITER_LOCK, { ifAvailable: true }, async lock => {
        if (cancelled) return;
        await hydrate();
        if (cancelled) return;
        if (!lock) {
          setLockMessage('Read-only: another app tab owns Opening Pilot. Close that tab and reload here to take control.');
          return;
        }
        writable.current = true;
        setWriter(true);
        await new Promise<void>(resolve => { release = resolve; });
        await queue.current;
      });
    };
    // StrictMode re-runs effects before an asynchronous lock release completes.
    // The replacement lease must wait for this component's previous lease.
    lease.current = lease.current.then(async () => {
      if (!cancelled) await start();
    }).catch(e => {
      if (!cancelled) setError(e instanceof Error ? e.message : String(e));
    });
    return () => {
      cancelled = true;
      mounted.current = false;
      writable.current = false;
      release?.();
    };
  }, []);

  const mutate = useCallback((update: (previous: PilotBook) => PilotBook): Promise<void> => {
    const operation = queue.current.then(async () => {
      if (!writable.current) throw new Error('Opening Pilot is not writable in this tab.');
      const next = update(current.current);
      if (next === current.current) return;
      // Publish only after the IndexedDB transaction commits; a failed save must
      // not create a success-shaped paper fill that disappears on reload.
      await savePilotBook(next);
      current.current = next;
      if (mounted.current) {
        setBook(next);
        setError('');
      }
    });
    queue.current = operation.catch(e => {
      if (mounted.current) setError(e instanceof Error ? e.message : String(e));
    });
    return operation;
  }, []);

  return { book, loaded, writer, error, lockMessage, mutate };
}
