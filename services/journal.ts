/**
 * DISK JOURNAL CLIENT (Milestone M6)
 * Fire-and-forget append-only disk journal with retry queue and configVersion tagging.
 */

import { CONFIG_VERSION } from '../constants/strategyConfig';

export type JournalStream =
  | 'decisions'
  | 'gates'
  | 'orders'
  | 'fills'
  | 'exits'
  | 'premarket'
  | 'vision'
  | 'alerts';

export interface JournalRecord {
  stream: JournalStream;
  configVersion: string;
  timestamp?: number;
  data: Record<string, any>;
}

class JournalService {
  private queue: JournalRecord[] = [];
  private flushing = false;

  constructor() {
    this.restoreQueue();
  }

  private restoreQueue() {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem('journal_retry_queue');
      if (saved) {
        this.queue = JSON.parse(saved);
      }
    } catch {
      this.queue = [];
    }
  }

  private saveQueue() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('journal_retry_queue', JSON.stringify(this.queue.slice(-50)));
    } catch {}
  }

  public record(stream: JournalStream, data: Record<string, any>): void {
    const record: JournalRecord = {
      stream,
      configVersion: CONFIG_VERSION,
      timestamp: Date.now(),
      data
    };

    this.queue.push(record);
    this.saveQueue();
    this.flush();
  }

  public async flush(): Promise<void> {
    if (this.flushing || this.queue.length === 0) return;
    this.flushing = true;

    try {
      while (this.queue.length > 0) {
        const item = this.queue[0];
        const res = await fetch(`/api/journal/${item.stream}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            configVersion: item.configVersion,
            clientTimestamp: item.timestamp,
            ...item.data
          })
        });

        if (res.ok) {
          this.queue.shift();
          this.saveQueue();
        } else {
          // Server returned an error, halt flushing until next turn
          break;
        }
      }
    } catch {
      // Network failure, keep items in queue
    } finally {
      this.flushing = false;
    }
  }
}

export const journalService = new JournalService();

export function logJournal(stream: JournalStream, data: Record<string, any>): void {
  journalService.record(stream, data);
}
