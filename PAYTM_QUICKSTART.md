# Quick Start Guide - PayTM Money Integration

## 🚀 Setup Instructions

### 1. Get PayTM Money Access Token
```
1. Go to https://developer.paytmmoney.com
2. Sign up or log in
3. Navigate to "Developer Dashboard"
4. Create a new app (if you don't have one)
5. Generate/Copy your Access Token
```

### 2. Configure the App
```
1. Open the app → Click Settings (⚙️ icon)
2. In "Market Data API" section:
   - Select Data Provider: "PayTM Money"
3. Paste your Access Token in "PayTM Access Token" field
4. Click "Save & Close"
```

### 3. Start the Local Server
```bash
# Terminal 1 - Backend Proxy
npm run server

# Terminal 2 - Frontend
npm run dev
```

### 4. Verify Connection
- Open browser at `http://localhost:5173`
- Check console for: `[PayTM] Loaded X NSE equity securities`
- Market data should auto-refresh based on your interval setting

---

## 🔧 API Endpoints

### Security Master Files
These are automatically fetched by the app:
```
Stocks:  https://developer.paytmmoney.com/data/v1/scrips/equity_security_master.csv
Options: https://developer.paytmmoney.com/data/v1/scrips/option_security_master.csv
```

### Live Quotes API (via Proxy)
```
POST http://localhost:5001/api/paytm/quotes
Headers: Authorization: Bearer <your_token>
Body: {
  "security_ids": ["11536", "2885", ...]
}
```

---

## 📊 Data Mapping

### Nifty 50 Stocks
App automatically maps these symbols to PayTM security IDs:
```javascript
['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 
 'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK', ... (total 50)]
```

### Nifty Options
For current Nifty price of **24,850**:
```
ATM Strike: 24,850 → rounds to 24,850
Strike Range: 24,850 ± (20 × 50) = 23,850 to 25,850
Total Contracts: 41 strikes × 2 types (CE+PE) = 82 contracts
Expiry: Next Thursday (or current if before 3:30 PM)
```

---

## 🐛 Troubleshooting

### Issue: "PayTM API Error (401)"
**Solution**: Access token is invalid or expired. Generate a new token from developer portal.

### Issue: "Symbol not found in master"
**Solution**: Clear browser cache. The security master CSV might be outdated. Refresh the page.

### Issue: "No option contracts found"
**Solution**: 
1. Check if market is open (options available 9:15 AM - 3:30 PM)
2. Verify expiry calculation logic (currently set for Thursday)

### Issue: "CORS Error"
**Solution**: Ensure local proxy server is running (`npm run server`)

---

## 💡 Advanced Usage

### Switching Providers On-the-Fly
You can switch between Fyers and PayTM without losing data:
```
Settings → Data Provider → Select → Save
```
The app will immediately use the new provider on next refresh.

### Custom Security IDs
To fetch custom securities (not Nifty50):
```typescript
import { fetchPayTMQuotes } from './services/paytmService';

const customIds = ['11536', '2885']; // TCS, RELIANCE
const quotes = await fetchPayTMQuotes(customIds, credentials);
```

### Force Refresh Security Masters
Security masters are cached for session. To force reload:
```javascript
// In browser console
localStorage.clear();
location.reload();
```

---

## 📈 Performance Tips

1. **Batch Requests**: PayTM supports fetching all 50 stocks + 82 options in just 2 API calls
2. **Caching**: Security masters are cached in-memory (no repeated CSV downloads)
3. **Efficient Intervals**: Use 30-60 second refresh for live trading, 5-10 minutes for monitoring

---

## 🔐 Security Notes

- ✅ Access tokens are stored locally in browser (localStorage)
- ✅ Requests are proxied through local server (prevents CORS)
- ✅ No tokens are logged in console (privacy-first)
- ⚠️ Use HTTPS in production (tokens transmitted in Authorization header)

---

## 📞 Support

For PayTM API issues:
- Documentation: https://developer.paytmmoney.com/docs
- Support: developer@paytm.com

For app-specific issues:
- Check console for detailed error messages
- Review `PAYTM_INTEGRATION.md` for technical details

---

**Last Updated**: 2026-03-13  
**Version**: 1.0.0
