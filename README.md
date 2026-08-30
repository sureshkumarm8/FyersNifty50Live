
# Nifty50 Live Dashboard

A high-performance real-time stock tracking and analysis dashboard for **Nifty50** stocks and **Nifty Options**, built with **React**, **TypeScript**, and **Tailwind CSS**, powered by the **Fyers API v3** and **Google Gemini AI**.

![Dashboard Preview](https://via.placeholder.com/800x400.png?text=Nifty50+AI+Dashboard)

## 🚀 Features

### 🧠 AI Quant Deck (Advanced)
*   **Auto-Scan Engine**: Runs automatically every 5 minutes during market hours (09:15 - 15:30) to analyze market structure.
*   **Probability Scoring**: Generates a confidence score (0-100%) for Long/Short trends based on weighted sentiment and option flow.
*   **Quant Feedback Loop**: Self-grading mechanism that marks past signals as **WIN** or **LOSS** after 15 minutes, building a transparent track record.
*   **Trade Suggestions**: AI proposes specific Option Strategies (e.g., Bull Call Spread) with ideal strikes and spot-based stops.
*   **Anomaly Detection**: Identifies hidden divergences where price is moving against the flow.

### 🎯 Sniper Scope (Execution Engine)
*   **Protocol Enforcement**: Define your own trading rules and schedule (e.g., "09:45 Entry Window").
*   **Pivot Point Context**: Automatically calculates Daily Pivot, R1, S1, and CPR levels from previous day's OHLC. The AI uses this to filter trades (e.g., avoiding longs at Resistance).
*   **Audio Alerts (TTS)**: Text-to-Speech announcements for trade signals ("Sniper Triggered. Buy Call.") so you don't have to stare at the screen.
*   **Compliance Check**: Ensures you don't violate your own risk rules (e.g., "Never trade against Net Option Flow").

### 🤖 AI Analyst Chat & Live Voice
*   **Context-Aware Chat**: Ask questions like "Summarize the trend" or "Explain PCR". The AI has access to the full session history log.
*   **Voice Mode**: Real-time two-way voice conversation with your market data using Gemini Live API.
*   **Markdown Reports**: Chat responses are formatted with bold metrics, lists, and clear headers.

### 🦙 Local Llama (Ollama) — Offline & Private
*   **Zero Cost, Zero Limits**: Runs models on your own machine, so there are no API keys, quotas or per-token charges.
*   **Full Privacy**: Your market data and trading protocol never leave your computer.
*   **Any Model**: Works with any model pulled via `ollama pull` (Llama 3.1/3.2/3.3, Qwen, Mistral, Gemma, ...).
*   **Auto-Discovery**: Settings detects your installed models and lets you pick one with a single click.

### 🎓 Paper Trading — Practise on Live Prices
*   **Option Buying, For Real Ticks**: Buy Nifty50 CE/PE at the live traded premium with no broker involved and no money at risk.
*   **ATM-Centred Chain**: The ticket lists strikes around ATM with ITM/OTM tags, and follows the spot as it moves.
*   **Bracket Discipline**: Optional stop loss and target as a % of premium, plus a trailing stop in points. All three are enforced automatically on every price refresh.
*   **Honest Charges**: Brokerage, STT, exchange, SEBI, stamp duty and GST are modelled properly — the same friction that decides an option buyer's month.
*   **Journal & Stats**: Every closed trade records MFE/MAE, hold time and exit reason, rolled up into win rate, expectancy, profit factor and streaks.
*   **Survives Reloads**: The book is persisted locally, and open positions auto square off at 15:20.

### 👁️ Vision Analysis — Live Chart Screenshots
*   **Sees What You See**: A real Chrome window stays logged in to Zerodha Kite and Sensibull, screenshots the NIFTY 50 price chart and the OI-vs-Strike chart every cycle.
*   **Read by a Vision Model**: Both images are sent to a local Ollama vision model, which returns a structured verdict — bias, confidence, supports/resistances, OI walls, expected range and risks.
*   **Automatic Cadence**: Runs on a wall-clock-aligned schedule (1 / 2 / 5 / 10 / 15 minutes), with Capture Now, Pause/Resume and run history in the UI.
*   **Local Only**: Requires the companion capture engine on your machine — see [Vision Analysis Setup](#-vision-analysis-setup) below.

### 📊 Live Equity Dashboard
*   **Real-time Quotes**: Fetches live data for all Nifty50 stocks instantly.
*   **Session Metrics**: Tracks **Day % Change** relative to the session start.
*   **Momentum Analysis**: Displays **1-minute Net % Strength** based on Bid/Ask pressure changes.
*   **Totals Row**: Cumulative weighted averages for Bid/Ask changes fixed at the top.

### 📈 Smart Cumulative Summary
*   **Sector Heatmap**: Visual bar showing real-time weighted performance of sectors (Banks, IT, Auto, Energy).
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

### 🦙 Using a Local Llama Model (Ollama)

No API key needed — the model runs on your own machine.

1.  **Install Ollama** from [ollama.com](https://ollama.com).
2.  **Pull a model**:
    ```bash
    ollama pull llama3.1:8b        # recommended (~4.7GB)
    # ollama pull llama3.2:3b      # fastest / low RAM
    # ollama pull llama3.3:70b     # highest quality

    # For Pre-Market chart uploads you also need a vision (multimodal) model
    ollama pull llama3.2-vision:11b   # recommended (~7.9GB)
    # ollama pull llava:7b            # lighter alternative (~4.7GB)
    ```
3.  **Start the server** (allow the browser to call it):
    ```bash
    # When using the local dashboard (http://localhost:5173)
    ollama serve

    # When using a deployed/HTTPS dashboard, whitelist that exact origin
    OLLAMA_ORIGINS="https://your-app.vercel.app" ollama serve
    # ...or allow everything during testing
    OLLAMA_ORIGINS="*" ollama serve
    ```
4.  **In the app**: Settings → *Intelligence Engine* → **AI Provider = Local Llama / Ollama**, click **Test**, pick a model (and a **Vision Model** for Pre-Market chart analysis) and Save.

Notes:
*   Default server URL is `http://localhost:11434`. Point it at another machine on your LAN if you prefer.
*   Ollama replies **403** to any origin it does not recognise, so `OLLAMA_ORIGINS` must match the URL in your address bar. The Settings screen shows the exact value to use.
*   If the browser blocks the direct call, requests automatically fall back through the local proxy at `/api/ollama` (available when `npm run server` is running).
*   Safari blocks HTTPS pages from calling `http://localhost`; use the local dashboard (`npm run dev`) or Chrome in that case.
*   **Pre-Market chart uploads** run on the separate *Vision Model* setting — a text-only model would silently ignore the image. With any other AI provider selected, chart analysis uses Gemini when a Google API key is present.
*   Live **Voice Mode** remains Gemini-only; chat, Quant Deck, Sniper Scope, sentiment analysis and pre-market chart reading all work with local Llama.

## 🎯 Pre-Market → "Nifty Sniper: The Office Protocol"

The Pre-Market screen is not a generic chart reader — it exists to answer one question before
09:15: **is today a trade day, and if so at which zone with which strike?** Its output is wired
directly to the rules in `my_system_template_*.json` and `components/MySystemAutoTrade.tsx`.

**Inputs** — four screenshots, auto-routed to their slot by filename:

| Slot | Chart | Answers |
|------|-------|---------|
| 🗓️ Daily 1Y | Nifty 50 day candles, ~1 year | Positional trend and the levels framing the year |
| ⏱️ 1-Min | Nifty 50 1-minute, yesterday/today | Where the last session closed, momentum handover |
| 🧱 OI Walls | Sensibull open interest by strike | Where writers capped the move |
| 🕸️ Multi OI | Sensibull multi-strike OI | Which side is adding or unwinding right now |

**Output** — the Sniper Card:

*   **GO / CAUTION / STAND ASIDE** with a letter grade. `NO SETUP = NO TRADE` is enforced, not suggested.
*   **Two pre-armed zone plays** — the bounce (buy CE at support) and the fade (buy PE at resistance) —
    each with its trigger band, the exact 250-point ITM strike, the +30 target and the −30 stop.
    A play is marked `BLOCKED` when the bias would make your live engine refuse it.
*   **Blocking checks**: 30 points must physically fit between the walls (≥60 pts), screenshots must be
    current, and the charts must not contradict each other (≥75% agreement).
*   **Confluence** — levels independently named by two or more charts.
*   **Invalidations** and a 09:15 → 10:15 timeline mirroring the protocol's phases.
*   **Delta reality check** — a 250-ITM option runs ~0.85 delta, so the engine's +30 *premium* target
    needs roughly 35 points of *spot* movement.

Stale screenshots (older than 18 h) are flagged on the slot itself and force a STAND ASIDE, because a
previous session's OI chart will point you at the wrong zone. The daily chart is exempt.

The screen works with no live feed at all — enter the previous close manually, or let the models read
the last price off the charts.

## 🤖 AutoTrade — two strategies, kept apart

`components/UnifiedAutoTrade.tsx` is only a shell. It owns the tab and the PAPER/LIVE switch; each
strategy lives in its own panel under `components/autotrade/` with its **own `OrderManager`, log,
positions and statistics**. Nothing is shared, so a number under one strategy can never have come
from the other — and closing a Momentum trade can no longer close the day's Sniper position.

### Sniper — the Office Protocol, enforced

`services/sniperEngine.ts` is the live half of the system (`services/sniperPlaybook.ts` plans it the
night before). It is a pure module — the current time is always an argument — so every rule is unit
tested rather than tangled into rendering:

| Phase | IST | What the panel allows |
| --- | --- | --- |
| The Download | 09:15–09:25 | Watch only. Builds the opening range from ticks *timestamped* inside the window. |
| Entry Window | 09:25–09:45 | The only window that may open a trade. |
| Manage | 09:45–10:15 | Existing position only. |
| Hard Stop | 10:15 | Unconditional flat — it fires even if the setup was lost to a page refresh. |

A trade is offered only when *every* gate is green: inside the entry window, opening range marked,
price sitting within 30 points of support (→ 250-ITM **CE**) or resistance (→ 250-ITM **PE**), signal
confidence ≥ 75 %, the live trend agreeing with the zone, and today's single trade still unspent.
Otherwise the panel states plainly which rule is blocking it. Target and stop are a fixed ±30 spot
points. The one-trade-per-day lock is keyed to the IST date, so yesterday's flag can never block
today.

**Pre-market handoff.** The panel loads the plan saved by the Pre-Market screen and compares its
planned support/resistance against the live 09:15–09:25 range. Agreement within 40 points is called
out as *confluence* — the highest-conviction version of the setup. A wider gap says the chart levels
are stale and the live range wins.

### Momentum

A different animal, and it looks like one: blue instead of green, all-session, multi-factor scoring
(15-minute trend, breadth, option flow, momentum, volatility) with a confidence threshold, premium-%
target/stop and an optional auto-execute. It exists for the days the protocol stands aside.

## 👁️ Vision Analysis Setup

The **Vision** screen does not analyse numbers — it analyses *pictures of your charts*. A separate
capture engine drives a real, non-headless Chrome that holds your Zerodha Kite and Sensibull
sessions, screenshots both charts on a schedule, and asks a local Ollama vision model to read them.

Because it needs Playwright, a visible browser and a persistent login profile, **it can only run on
your own machine** — it is not available in a deployed (Vercel) build. The screen detects this and
shows setup instructions instead of an error.

1.  **Pull a vision-capable model** (e.g. `ollama pull gemma3:12b` — any model with image support works):
    ```bash
    ollama list
    ```
2.  **Start the capture engine** (the companion `liveImageAnalsis` project):
    ```bash
    cd ../liveImageAnalsis
    npm install
    npx playwright install chromium   # first run only
    npm start                         # listens on http://localhost:4321
    ```
    The first launch opens a Chrome window — log in to Kite and Sensibull once. The profile is
    persisted, so subsequent runs reuse the session.
3.  **Start the local dashboard server** so the proxy route exists:
    ```bash
    npm run server   # in this project
    npm run dev
    ```
4.  Open the dashboard and click the **Vision** tab.

Notes:
*   The dashboard reaches the engine through `server.js` at `/api/vision/*` (JSON, screenshots and
    the live SSE event stream are all proxied). Set `VISION_SIDECAR_URL` if the engine is not on
    `http://localhost:4321`.
*   Keep the capture browser **non-headless** — Zerodha invalidates headless sessions.
*   A full cycle (2 screenshots + vision inference) takes roughly 15–20 s, so cadences down to
    1 minute are safe.
*   If a target shows *Login required*, use the monitor button to bring the capture browser on
    screen, log in, then hide it again.

## 🎓 Paper Trading

The **Paper** tab is a training ground: it uses the same live option chain as the
rest of the dashboard, but every fill is simulated and nothing is ever sent to a
broker. It is built specifically around **buying** Nifty50 options.

How it works:
*   Pick **CE** or **PE**, choose a strike (the list is centred on ATM and tagged
    ITM/OTM), set your lots, and buy. Fills are marked at the live traded price —
    there is no synthetic slippage or random rejection.
*   **Stop loss** and **target** are entered as a percentage of the entry premium and
    are shown in rupees before you commit, along with the resulting risk:reward.
*   **Trail by N points** ratchets the stop up behind the high-water premium. The
    effective stop is always the higher of your hard stop and the trailed stop.
*   Brackets are evaluated on every price refresh. If a tick crosses both the stop
    and the target, the **stop wins** — the simulator will not flatter your results.
*   Positions auto square off at **15:20 IST** unless you turn that off.

What it charges you (per leg, configurable brokerage):

| Component | Rate |
| --- | --- |
| Brokerage | ₹20 flat per order |
| STT | 0.10% of premium, **sell side only** |
| Exchange transaction | 0.03503% of premium |
| SEBI | ₹10 per crore |
| Stamp duty | 0.003% of premium, **buy side only** |
| GST | 18% on brokerage + transaction + SEBI |

Closed trades are journalled with maximum favourable/adverse excursion, hold time
and exit reason, and rolled up into win rate, expectancy, profit factor, average
win/loss and win/loss streaks. The whole book is stored in IndexedDB, so it
survives reloads; **Reset Account** in the settings drawer clears it.

> Simulated results ignore real-world queue position, liquidity and slippage.
> Treat them as practice for process and discipline, not as a proven edge.

## 📁 Project Structure

*   `src/App.tsx`: Main application controller and data orchestration.
*   `src/components/AIQuantDeck.tsx`: The AI probability engine UI.
*   `src/components/SniperScope.tsx`: Protocol enforcement interface.
*   `src/components/AIView.tsx`: Chat and Live Voice interface.
*   `src/components/VisionAnalysis.tsx`: Live chart-screenshot vision analysis screen.
*   `src/components/PaperTrading.tsx`: Simulated Nifty50 option-buying screen.
*   `src/components/CumulativeView.tsx`: Weighted market analysis dashboard.
*   `src/components/StockTable.tsx`: Advanced data grid with weighted totals.
*   `src/services/fyersService.ts`: API interaction.
*   `src/services/visionService.ts`: Client for the local chart-capture engine.
*   `src/services/paperTradingService.ts`: Paper trading engine (fills, charges, brackets, stats).
*   `src/services/db.ts`: IndexedDB persistence layer.
*   `server.js`: Local Node.js proxy server.

## 📜 License

MIT License
