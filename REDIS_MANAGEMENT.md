# 🗑️ Redis Data Management

## Overview

Manage your Redis/Upstash historical data using:
1. **UI (Recommended)** - Settings → Data Management tab
2. **API/curl** - Direct API calls

---

## 🎨 Using the UI (New!)

### Step 1: Navigate to Data Management
1. Open your app
2. Click **Settings** (gear icon)
3. Select **Data Management** tab

### Step 2: Enter Admin Secret
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Copy your `ADMIN_SECRET` or `CRON_SECRET`
3. Paste it in the "Admin Authentication" field
4. Secret is saved locally for future use

### Step 3: Clear Data
Choose from three options:

#### 🔴 Clear All History
- Deletes ALL historical snapshots
- Use for complete database reset
- ⚠️ Permanent and irreversible

#### 🟠 Clear Today's Data
- Deletes last 8 hours of data
- Use for clearing test data
- Preserves previous days' history

#### 🔵 Clear Old Data
- Keeps latest 100 snapshots
- Deletes everything older
- Recommended for regular maintenance

### Features
- ✅ Visual feedback with success/error messages
- ✅ Confirmation dialogs before deletion
- ✅ Loading states during operations
- ✅ Detailed operation descriptions

---

## 🔐 Authentication (Optional but Recommended)

If `ADMIN_SECRET` or `CRON_SECRET` is set in Vercel environment variables, you must provide it:

```bash
# With authentication
curl -X POST "https://your-app.vercel.app/api/clear-history?action=all" \
     -H "Authorization: Bearer your_secret_here"
```

---

## 📋 Available Actions

### 1. Clear ALL Data

Deletes everything from Redis (all snapshots, index, latest).

```bash
curl -X POST "https://your-app.vercel.app/api/clear-history?action=all"
```

**Response:**
```json
{
  "success": true,
  "message": "Cleared all 450 snapshots from Redis",
  "deletedCount": 450,
  "action": "all"
}
```

---

### 2. Clear Today's Data Only

Deletes snapshots from the last 8 hours (today's trading session).

```bash
curl -X POST "https://your-app.vercel.app/api/clear-history?action=today"
```

**Response:**
```json
{
  "success": true,
  "message": "Cleared 350 snapshots from today",
  "deletedCount": 350,
  "action": "today"
}
```

---

### 3. Clear Old Data (Keep Last 100)

Keeps the most recent 100 snapshots, deletes everything older.

```bash
curl -X POST "https://your-app.vercel.app/api/clear-history?action=old"
```

**Response:**
```json
{
  "success": true,
  "message": "Deleted 350 old snapshots (kept latest 100)",
  "deletedCount": 350,
  "action": "old"
}
```

---

## 🖥️ Using from Browser Console

Open https://your-app.vercel.app/ → Browser Console (F12) → Run:

```javascript
// Clear all data
fetch('/api/clear-history?action=all', { method: 'POST' })
  .then(r => r.json())
  .then(console.log);

// Clear today's data
fetch('/api/clear-history?action=today', { method: 'POST' })
  .then(r => r.json())
  .then(console.log);

// Clear old data (keep last 100)
fetch('/api/clear-history?action=old', { method: 'POST' })
  .then(r => r.json())
  .then(console.log);
```

**With authentication:**
```javascript
fetch('/api/clear-history?action=all', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer your_secret_here' }
})
.then(r => r.json())
.then(console.log);
```

---

## 🔒 Security

### Enable Authentication

Add to Vercel environment variables:

```
ADMIN_SECRET=your_random_secret_here
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

Once set, all clear-history requests must include:
```
Authorization: Bearer your_random_secret_here
```

---

## ⚠️ Important Notes

1. **Clearing data is permanent** - cannot be undone
2. **Cron job will re-populate** data in the next minute
3. **Active users will see gaps** in history until new data arrives
4. **Use `action=old`** for regular maintenance (keeps recent data)

---

## 🧹 Recommended Maintenance

**Weekly cleanup:**
```bash
# Keep only last 100 snapshots (~ 1-2 hours of data)
curl -X POST "https://your-app.vercel.app/api/clear-history?action=old"
```

**Fresh start for new day:**
```bash
# Clear yesterday's data at market close
curl -X POST "https://your-app.vercel.app/api/clear-history?action=all"
```

---

## 📊 Check Current Data

Before clearing, check what's stored:

```bash
curl "https://your-app.vercel.app/api/get-history?limit=1"
```

Shows the most recent snapshot and total count.

---

## 🐛 Troubleshooting

**401 Unauthorized:**
- Check if `ADMIN_SECRET` or `CRON_SECRET` is set in Vercel
- Provide correct Bearer token in Authorization header
- Or remove the secret from Vercel to disable auth

**500 Error:**
- Check Vercel function logs
- Verify Redis credentials (KV_*) are set
- Test `/api/get-history` endpoint first

---

## ✅ Verification

After clearing, verify:

```bash
# Should return empty or reduced count
curl "https://your-app.vercel.app/api/get-history?limit=100"
```

Frontend will show message: "No historical data available" until new data arrives.
