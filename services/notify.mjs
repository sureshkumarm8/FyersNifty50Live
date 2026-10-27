/**
 * NOTIFICATION SERVICE (Milestone M5.2)
 * Sends native macOS notifications via osascript and optional Telegram alerts.
 */

import { exec } from 'node:child_process';
import https from 'node:https';

export async function sendNotification(title, message, options = {}) {
  const timestamp = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
  const fullTitle = `[${timestamp} IST] ${title}`;

  console.log(`🔔 NOTIFICATION: ${fullTitle} — ${message}`);

  // 1. Native macOS Notification via osascript
  if (process.platform === 'darwin') {
    const script = `display notification "${message.replace(/"/g, '\\"')}" with title "${fullTitle.replace(/"/g, '\\"')}"`;
    exec(`osascript -e '${script}'`, (err) => {
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
      const text = encodeURIComponent(`*${fullTitle}*\n${message}`);
      const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${text}&parse_mode=Markdown`;
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
