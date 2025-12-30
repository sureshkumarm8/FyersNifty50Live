
# Nifty50 Live Dashboard

A high-performance real-time stock tracking and analysis dashboard for **Nifty50** stocks and **Nifty Options**, built with **React**, **TypeScript**, and **Tailwind CSS**, powered by the **Fyers API v3** and **Google Gemini AI**.

![Dashboard Preview](https://via.placeholder.com/800x400.png?text=Nifty50+AI+Dashboard)

## 🚀 Features

### 🧠 AI Quant Deck (New!)
*   **Auto-Scan Engine**: Runs automatically every 5 minutes during market hours (09:15 - 15:30) to analyze market structure.
*   **Probability Scoring**: Generates a confidence score (0-100%) for Long/Short trends based on weighted sentiment and option flow.
*   **Trade Suggestions**: AI proposes specific Option Strategies (e.g., Bull Call Spread) with ideal strikes and spot-based stops.
*   **Anomaly Detection**: Identifies hidden divergences where price is moving against the flow.

### 🎯 Sniper Scope (New!)
*   **Protocol Enforcement**: Define your own trading rules and schedule (e.g., "09:45 Entry Window").
*   **Execution Logic**: The AI checks live market data against your specific protocol before giving an "EXECUTE" signal.
*   **Compliance Check**: Ensures you don't violate your own risk rules (e.g., "Never trade against Net Option Flow").

### 🤖 AI Analyst Chat & Live Voice
*   **Context-Aware Chat**: Ask questions like "Summarize the trend" or "Explain PCR". The AI has access to the full session history log.
*   **Voice Mode**: Real-time two-way voice conversation with your market data using Gemini Live API.
*   **Markdown Reports**: Chat responses are formatted with bold metrics, lists, and clear headers.

### 📊 Live Equity Dashboard
*   **Real-time Quotes**: Fetches live data for all Nifty50 stocks instantly.
*   **Session Metrics**: Tracks **Day % Change** relative to the session start.
*   **Momentum Analysis**: Displays **1-minute Net % Strength** based on Bid/Ask pressure changes.
*   **Totals Row**: Cumulative weighted averages for Bid/Ask changes fixed at the top.

### 📈 Smart Cumulative Summary
*   **Weighted Analysis**: Calculates impact based on **Nifty 50 Weightage**.
*   **Market Breadth**: Visualizes Bullish vs Bearish weight impact.
*   **Buying/Selling Pressure**: Aggregates `Volume * Price * Weight` to show true institutional money flow.

### ⛓️ Nifty Options Chain
*   **Auto-Expiry**: Automatically calculates the nearest **Tuesday Expiry** (Weekly/Monthly), handling holidays.
*   **Dynamic Strikes**: Generates ATM + 25 strikes up/down based on live Spot Price.
*   **Live Greeks Proxy**: Tracks Open Interest (OI) and Bid/Ask strength for all option contracts.

### 🛠️ Technical Capabilities
*   **Data Persistence**: Uses IndexedDB to save session history, ensuring charts and stats survive page reloads.
*   **Intraday History**: Click on any stock to view minute-by-minute OHLCV candles (merged Live + API data).
*   **Secure Proxy**: Includes a local Node.js proxy server to handle CORS and secure API communication.

## 🛠️ Prerequisites

*   **Node.js** (v18 or higher)
*   **Fyers Trading Account** (to generate API keys)
*   **Google Gemini API Key** (for AI features)

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

To run this application, you need to start **both** the backend proxy server and the frontend.

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

## 🔑 Configuration

1.  **Fyers API**:
    *   Get App ID & Access Token from [Fyers API Dashboard](https://api-dashboard.fyers.in/).
2.  **Gemini API**:
    *   Get API Key from [Google AI Studio](https://aistudio.google.com/).
3.  **App Settings**:
    *   Click the **Settings (Gear Icon)** in the dashboard.
    *   Enter credentials and save.

## 📁 Project Structure

*   `src/App.tsx`: Main application controller and data orchestration.
*   `src/components/AIQuantDeck.tsx`: The AI probability engine UI.
*   `src/components/SniperScope.tsx`: Protocol enforcement interface.
*   `src/components/AIView.tsx`: Chat and Live Voice interface.
*   `src/components/CumulativeView.tsx`: Weighted market analysis dashboard.
*   `src/components/StockTable.tsx`: Advanced data grid with weighted totals.
*   `src/services/fyersService.ts`: API interaction.
*   `src/services/db.ts`: IndexedDB persistence layer.
*   `server.js`: Local Node.js proxy server.

## 📜 License

MIT License
