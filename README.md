# Nifty50 Live Dashboard

A high-performance real-time stock tracking and analysis dashboard for **Nifty50** stocks and **Nifty Options**, built with **React**, **TypeScript**, and **Tailwind CSS**, powered by the **Fyers API v3**.

![Dashboard Preview](https://via.placeholder.com/800x400.png?text=Nifty50+Live+Dashboard)

## 🚀 Features

### 📊 Live Equity Dashboard
*   **Real-time Quotes**: Fetches live data for all Nifty50 stocks instantly.
*   **Session Metrics**: Tracks **Day % Change** relative to the session start (when you opened the app).
*   **Momentum Analysis**: Displays **1-minute Net % Strength** based on Bid/Ask pressure changes.
*   **Totals Row**: Cumulative weighted averages for Bid/Ask changes fixed at the top.

### 📈 Smart Cumulative Summary (New!)
*   **Weighted Analysis**: Unlike standard dashboards that just sum quantities, this view calculates impact based on **Nifty 50 Weightage**.
*   **Market Breadth**: Visualizes Bullish vs Bearish weight impact.
*   **Buying/Selling Pressure**: Aggregates `Volume * Price * Weight` to show true institutional money flow.
*   **Index Movers**: Lists stocks by **Index Contribution points**, not just percentage change.

### ⛓️ Nifty Options Chain
*   **Auto-Expiry**: Automatically calculates the nearest **Tuesday Expiry** (Weekly/Monthly), handling holidays and market hours.
*   **Dynamic Strikes**: Generates ATM + 10 strikes up/down based on live Spot Price.
*   **Live Greeks Proxy**: Tracks Open Interest (OI) and Bid/Ask strength for all option contracts.

### 🛠️ Technical Capabilities
*   **Intraday History**: Click on any stock to view minute-by-minute OHLCV candles.
*   **Smart Scrolling**: Fixed headers and stats with independently scrollable data tables.
*   **Secure Proxy**: Includes a local Node.js proxy server (and Vercel Serverless Functions) to handle CORS and secure API communication.
*   **Config Management**: Import/Export API credentials via JSON templates.

## 🛠️ Prerequisites

*   **Node.js** (v18 or higher)
*   **Fyers Trading Account** (to generate API keys)

## 📦 Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/nifty50-live.git
    cd nifty50-live
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

## 🏃‍♂️ Running Locally

To run this application, you need to start **both** the backend proxy server (to bypass CORS) and the frontend development server.

1.  **Terminal 1 (Backend Proxy)**:
    ```bash
    npm run server
    ```
    *   Runs on `http://localhost:5001`.

2.  **Terminal 2 (Frontend)**:
    ```bash
    npm run dev
    ```
    *   Runs on `http://localhost:5173`.

3.  Open your browser at `http://localhost:5173`.

## 🔑 Configuration (Fyers API)

To get data, you need to configure your Fyers credentials in the app settings.

1.  **Get Credentials**:
    *   Login to the [Fyers API Dashboard](https://api-dashboard.fyers.in/).
    *   Create an App to get your **App ID** (Client ID).
    *   Generate an **Access Token** via their login flow or Explorer.

2.  **Configure App**:
    *   Click the **Settings (Gear Icon)** in the dashboard header.
    *   Enter your **App ID** (Format: `XV12345-100`).
    *   Paste your **Access Token**.
    *   Click **Save Configuration**.

> **Tip**: You can use the "Get Template" button in settings to download a JSON file, fill it out, and use "Import Config" to load it quickly.

## 🚀 Deployment (Vercel)

This project is configured for seamless deployment on Vercel.

1.  Push your code to a Git repository.
2.  Import the project into Vercel.
3.  Vercel will automatically detect the `vite` framework and the `api/` directory for Serverless Functions.
4.  Deploy! The `/api` routes will automatically handle the proxying in production.

## 🐛 Troubleshooting

| Error | Solution |
|-------|----------|
| **API Endpoint not found** | Ensure `npm run server` is running in a separate terminal. |
| **Failed to fetch** | Check internet connection or if Fyers API is down. |
| **503 Service Unavailable** | Fyers API rate limit hit or maintenance. The app auto-optimizes requests, but wait a minute and retry. |
| **401 Unauthorized** | Your Access Token has expired (tokens usually expire daily) or App ID is incorrect. Generate a new token. |
| **CORS Error** | Do not call Fyers directly from browser code. Ensure requests go through `http://localhost:5001/api`. |

## 📁 Project Structure

*   `src/App.tsx`: Main dashboard logic and data enrichment.
*   `src/components/StockTable.tsx`: The advanced data grid with weighted totals.
*   `src/components/CumulativeView.tsx`: Weighted market analysis dashboard.
*   `src/components/OptionChain.tsx`: Nifty options logic and view.
*   `src/components/StockDetail.tsx`: Intraday history view.
*   `src/services/fyersService.ts`: API interaction, symbol generation, and response mapping.
*   `server.js`: Local Node.js proxy server.
*   `api/`: Vercel Serverless Functions (Backend).

## 📜 License

MIT License