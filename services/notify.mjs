/**
 * NOTIFICATION SERVICE (Milestone M5.2)
 * Sends native macOS notifications via osascript and optional Telegram alerts.
 */

import { execFile } from 'node:child_process';
import https from 'node:https';

export async function sendNotification(title, message, options = {}) {
  const timestamp = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
  const fullTitle = `[${timestamp} IST] ${title}`;

  console.log(`🔔 NOTIFICATION: ${fullTitle} — ${message}`);

  // 1. Native macOS Notification via osascript
  if (process.platform === 'darwin') {
    // execFile, not a shell: an apostrophe in the message (pmset output has
    // them) used to end the shell's quoted script and drop the notification.
    const esc = text => String(text).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const script = `display notification "${esc(message)}" with title "${esc(fullTitle)}"`;
    execFile('osascript', ['-e', script], (err) => {
      if (err) {
        // Fallback or ignore in non-interactive/sandbox shells
      }
    });
  }

  // 2. Optional Telegram Bot Notification
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (botToken && chatId) {
    try {
      // Plain text: Markdown mode rejects the whole message on a stray `_` or `*`.
      const text = encodeURIComponent(`${fullTitle}\n${message}`);
      const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${text}`;
      https.get(url, (res) => {
        res.resume();
      }).on('error', (err) => {
        console.warn(`[Notify] Telegram delivery failed: ${err.message}`);
      });
    } catch (e) {
      console.warn(`[Notify] Telegram error: ${e.message}`);
    }
  }
}

export default sendNotification;
