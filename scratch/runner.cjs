var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ml/momentumEntryGuard.test.ts
var import_strict = __toESM(require("node:assert/strict"), 1);

// services/enhancedSignalGenerator.ts
var EnhancedSignalGenerator = class {
  /**
   * Generate enhanced signal using live historical data
   */
  static generateSignal(historyLog, pivotSupport, pivotResistance, currentNiftyLtp) {
    if (historyLog.length < 5) {
      return {
        direction: "NEUTRAL",
        confidence: 0,
        metrics: this.getEmptyMetrics(),
        reasons: ["Insufficient data"],
        timeframe: "5-minute",
        suggestedEntry: currentNiftyLtp,
        suggestedTarget: currentNiftyLtp,
        suggestedStopLoss: currentNiftyLtp,
        riskRewardRatio: 0
      };
    }
    const trendAnalysis = this.analyzeTrend(historyLog);
    const sentimentAnalysis = this.analyzeSentiment(historyLog);
    const momentumAnalysis = this.analyzeMomentum(historyLog);
    const optionsAnalysis = this.analyzeOptions(historyLog);
    const volatilityAnalysis = this.analyzeVolatility(historyLog);
    const srLevels = this.calculateSRLevels(historyLog, pivotSupport, pivotResistance);
    const absorptionAnalysis = this.analyzeAbsorption(
      historyLog,
      currentNiftyLtp,
      sentimentAnalysis.callBuyPressure,
      sentimentAnalysis.putBuyPressure
    );
    const metrics = {
      ...trendAnalysis,
      ...sentimentAnalysis,
      ...momentumAnalysis,
      ...optionsAnalysis,
      ...volatilityAnalysis,
      ...absorptionAnalysis,
      support: srLevels.support,
      resistance: srLevels.resistance,
      overallConfidence: 0,
      // Will calculate below
      signalStrength: "WEAK"
    };
    const signalDecision = this.makeSignalDecision(metrics, currentNiftyLtp, srLevels);
    const levels = this.calculateTradeLevels(
      signalDecision,
      currentNiftyLtp,
      srLevels,
      metrics
    );
    metrics.overallConfidence = signalDecision.confidence;
    metrics.signalStrength = this.getSignalStrength(signalDecision.confidence);
    return {
      direction: signalDecision.direction,
      confidence: signalDecision.confidence,
      metrics,
      reasons: signalDecision.reasons,
      timeframe: "5-minute",
      suggestedEntry: levels.entry,
      suggestedTarget: levels.target,
      suggestedStopLoss: levels.stopLoss,
      riskRewardRatio: Math.abs((levels.target - levels.entry) / (levels.entry - levels.stopLoss))
    };
  }
  /**
   * The newest snapshot at least `ageMs` older than the latest one.
   *
   * Shared so that trend and option flow are anchored to the SAME window.
   * They were not, which is how a 15-minute price trend ended up being
   * compared against a since-session-open flow figure.
   */
  static anchorRow(historyLog, ageMs) {
    const latestTs = historyLog[0]?.timestamp;
    if (!Number.isFinite(latestTs) || !(latestTs > 0)) return void 0;
    return historyLog.find((h) => Number.isFinite(h.timestamp) && h.timestamp <= latestTs - ageMs);
  }
  /**
   * Analyze 15-minute trend from historical data
   */
  static analyzeTrend(historyLog) {
    if (historyLog.length < 3) {
      return {
        trend15m: "NEUTRAL",
        trendStrength: 0,
        priceVelocity: 0
      };
    }
    const latest = historyLog[0];
    const latestTs = latest?.timestamp;
    let olderSnap = this.anchorRow(historyLog, 14 * 6e4);
    if (!olderSnap) {
      const lookback = Math.min(historyLog.length - 1, 30);
      olderSnap = historyLog[lookback];
    }
    const currentPrice = latest.niftyLtp;
    const olderPrice = olderSnap.niftyLtp;
    const totalChange = currentPrice - olderPrice;
    const elapsedMinutes = Number.isFinite(latestTs) && Number.isFinite(olderSnap.timestamp) && latestTs > olderSnap.timestamp ? (latestTs - olderSnap.timestamp) / 6e4 : Math.max(1, historyLog.indexOf(olderSnap) * 0.5);
    const priceVelocity = elapsedMinutes > 0 ? totalChange / elapsedMinutes : 0;
    let trend15m = "NEUTRAL";
    let trendStrength = 0;
    if (totalChange > 5) {
      trend15m = "BULLISH";
      trendStrength = Math.min(100, Math.abs(totalChange) * 5);
    } else if (totalChange < -5) {
      trend15m = "BEARISH";
      trendStrength = Math.min(100, Math.abs(totalChange) * 5);
    } else {
      trendStrength = 20;
    }
    return {
      trend15m,
      trendStrength,
      priceVelocity
    };
  }
  /**
   * Analyze sentiment from advanced indicators
   */
  static analyzeSentiment(historyLog) {
    const latest = historyLog[0];
    const prev = historyLog[1];
    const broadSentiment = latest.overallSent || 0;
    const callPutRatio = latest.pcr ? 1 / latest.pcr : 0;
    const olderForFlow = this.anchorRow(historyLog, 14 * 6e4) ?? historyLog[historyLog.length - 1];
    const flowNow = latest.optionsSent || 0;
    const flowThen = olderForFlow?.optionsSent || 0;
    const optionFlow = flowNow - flowThen;
    let optionFlowDirection = "NEUTRAL";
    let optionFlowStrength = Math.min(100, Math.abs(optionFlow));
    if (optionFlow > 8) {
      optionFlowDirection = "BULLISH";
    } else if (optionFlow < -8) {
      optionFlowDirection = "BEARISH";
    }
    const totalCallFlow = (latest.callsBuyQty || 0) + (latest.callsSellQty || 0) || 1;
    const totalPutFlow = (latest.putsBuyQty || 0) + (latest.putsSellQty || 0) || 1;
    const callBuyPressure = ((latest.callsBuyQty || 0) - (latest.callsSellQty || 0)) / totalCallFlow * 100;
    const putBuyPressure = ((latest.putsBuyQty || 0) - (latest.putsSellQty || 0)) / totalPutFlow * 100;
    return {
      broadSentiment,
      callPutRatio,
      optionFlow: optionFlowDirection,
      optionFlowStrength,
      callBuyPressure: Math.min(100, Math.max(-100, callBuyPressure)),
      putBuyPressure: Math.min(100, Math.max(-100, putBuyPressure))
    };
  }
  /**
   * Analyze momentum from price changes and velocity
   */
  static analyzeMomentum(historyLog) {
    if (historyLog.length < 2) {
      return {
        momentumScore: 0,
        accelerationRatio: 0
      };
    }
    const recent = historyLog.slice(0, 15).reverse();
    let momentumScore = 0;
    let accelerationRatio = 0;
    if (recent.length >= 2) {
      const velocities = [];
      for (let i = 1; i < recent.length; i++) {
        velocities.push(recent[i].niftyLtp - recent[i - 1].niftyLtp);
      }
      momentumScore = velocities.reduce((a, b) => a + b, 0) / velocities.length * 10;
      momentumScore = Math.min(100, Math.max(-100, momentumScore));
      if (velocities.length >= 2) {
        const accelChange = velocities[velocities.length - 1] - velocities[0];
        accelerationRatio = accelChange > 0 ? 50 : -50;
      }
    }
    return {
      momentumScore: Math.min(100, Math.max(-100, momentumScore)),
      accelerationRatio
    };
  }
  /**
   * Analyze options flow intelligence
   */
  static analyzeOptions(historyLog) {
    const latest = historyLog[0];
    const prev = historyLog[1];
    const callOIChange = (latest.callsOI || 0) - (prev?.callsOI || 0);
    const putOIChange = (latest.putsOI || 0) - (prev?.putsOI || 0);
    const netOIChange = callOIChange + putOIChange;
    const oiExpanding = netOIChange > 0;
    const oiDifferential = (latest.putsOI || 0) - (latest.callsOI || 0);
    const oiDeltaDifferential = putOIChange - callOIChange;
    return {
      oiExpanding,
      oiDifferential,
      oiDeltaDifferential
    };
  }
  /**
   * Analyze volatility trends
   */
  static analyzeVolatility(historyLog) {
    if (historyLog.length < 3) {
      return {
        volatility: 0,
        volatilityTrend: "STABLE"
      };
    }
    const recent = historyLog.slice(0, 3).reverse();
    const prices = recent.map((h) => h.niftyLtp);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const range = high - low;
    const avgPrice = prices.reduce((a, b) => a + b) / prices.length;
    const volatility = range / avgPrice * 100;
    const prev3 = historyLog.slice(3, 6).reverse();
    const prevPrices = prev3.map((h) => h.niftyLtp);
    const prevRange = Math.max(...prevPrices) - Math.min(...prevPrices);
    let volatilityTrend = "STABLE";
    if (range > prevRange * 1.1) {
      volatilityTrend = "EXPANDING";
    } else if (range < prevRange * 0.9) {
      volatilityTrend = "CONTRACTING";
    }
    return {
      volatility: Math.min(100, volatility * 10),
      volatilityTrend
    };
  }
  /**
   * Calculate support and resistance from historical levels
   */
  static calculateSRLevels(historyLog, pivotSupport, pivotResistance) {
    if (historyLog.length < 10) {
      return {
        support: pivotSupport,
        resistance: pivotResistance
      };
    }
    const highs = historyLog.slice(0, 10).map((h) => h.niftyLtp);
    const lows = historyLog.slice(0, 10).map((h) => h.niftyLtp);
    const historyHigh = Math.max(...highs);
    const historyLow = Math.min(...lows);
    const support = Math.max(historyLow, pivotSupport * 0.98);
    const resistance = Math.min(historyHigh, pivotResistance * 1.02);
    return { support, resistance };
  }
  /**
   * Analyze institutional order flow absorption and liquidity sweeps
   */
  static analyzeAbsorption(history2, currentSpot, callBuyPressure, putBuyPressure) {
    if (history2.length < 5) {
      return { absorptionScore: 0, liquiditySweep: "NONE" };
    }
    const recentSnaps = history2.slice(0, 15);
    const prices = recentSnaps.map((s) => s.niftyLtp || 0).filter((p) => p > 0);
    if (prices.length < 3) {
      return { absorptionScore: 0, liquiditySweep: "NONE" };
    }
    const priorPrices = prices.slice(1);
    const swingHigh = Math.max(...priorPrices);
    const swingLow = Math.min(...priorPrices);
    const latestPrice = prices[0];
    if (latestPrice >= swingLow && latestPrice - swingLow <= 4 && callBuyPressure > 15) {
      return {
        absorptionScore: Math.min(100, Math.round(50 + callBuyPressure * 0.5)),
        liquiditySweep: "BEAR_TRAP",
        sweepLevel: swingLow
      };
    }
    if (latestPrice <= swingHigh && swingHigh - latestPrice <= 4 && putBuyPressure > 15) {
      return {
        absorptionScore: Math.max(-100, Math.round(-50 - putBuyPressure * 0.5)),
        liquiditySweep: "BULL_TRAP",
        sweepLevel: swingHigh
      };
    }
    const baseAbsorption = Math.max(-100, Math.min(100, Math.round(callBuyPressure - putBuyPressure)));
    return {
      absorptionScore: baseAbsorption,
      liquiditySweep: "NONE"
    };
  }
  /**
   * Make final signal decision
   * Balanced weights across 4 pillars: Trend 25%, Sentiment 25%, Options Flow 25%, Momentum 25%
   */
  static makeSignalDecision(metrics, currentPrice, srLevels) {
    let bullishScore = 0;
    let bearishScore = 0;
    const reasons = [];
    if (metrics.trend15m === "BULLISH") {
      bullishScore += metrics.trendStrength * 0.25;
      reasons.push(`Bullish trend (${metrics.trendStrength.toFixed(0)})`);
    } else if (metrics.trend15m === "BEARISH") {
      bearishScore += metrics.trendStrength * 0.25;
      reasons.push(`Bearish trend (${metrics.trendStrength.toFixed(0)})`);
    }
    if (metrics.broadSentiment > 5) {
      bullishScore += metrics.broadSentiment / 100 * 25;
      reasons.push(`Bullish sentiment (${metrics.broadSentiment.toFixed(0)}%)`);
    } else if (metrics.broadSentiment < -5) {
      bearishScore += Math.abs(metrics.broadSentiment) / 100 * 25;
      reasons.push(`Bearish sentiment (${metrics.broadSentiment.toFixed(0)}%)`);
    }
    if (metrics.optionFlow === "BULLISH") {
      bullishScore += metrics.optionFlowStrength * 0.25;
      reasons.push(`Bullish options flow (${metrics.optionFlowStrength.toFixed(0)})`);
    } else if (metrics.optionFlow === "BEARISH") {
      bearishScore += metrics.optionFlowStrength * 0.25;
      reasons.push(`Bearish options flow (${metrics.optionFlowStrength.toFixed(0)})`);
    }
    if (metrics.momentumScore > 5) {
      bullishScore += metrics.momentumScore / 100 * 25;
      reasons.push(`Positive momentum (${metrics.momentumScore.toFixed(0)})`);
    } else if (metrics.momentumScore < -5) {
      bearishScore += Math.abs(metrics.momentumScore) / 100 * 25;
      reasons.push(`Negative momentum (${metrics.momentumScore.toFixed(0)})`);
    }
    if (metrics.liquiditySweep === "BEAR_TRAP") {
      bullishScore += 12;
      reasons.push("Liquidity sweep / Bear trap: Sellers absorbed at support");
    } else if (metrics.liquiditySweep === "BULL_TRAP") {
      bearishScore += 12;
      reasons.push("Liquidity sweep / Bull trap: Buyers absorbed at resistance");
    }
    const distToSupport = Math.abs(currentPrice - srLevels.support);
    const distToResistance = Math.abs(currentPrice - srLevels.resistance);
    if (distToSupport < 20 && bullishScore > bearishScore) {
      bullishScore += 10;
      reasons.push(`Near support, potential reversal`);
    }
    if (distToResistance < 20 && bearishScore > bullishScore) {
      bearishScore += 10;
      reasons.push(`Near resistance, potential pullback`);
    }
    if (metrics.oiDeltaDifferential != null) {
      if (metrics.oiDeltaDifferential > 5e6) {
        bullishScore += 15;
        reasons.push("Put OI expansion outpaces Calls (+15)");
      } else if (metrics.oiDeltaDifferential < -5e6) {
        bearishScore += 15;
        reasons.push("Call OI expansion outpaces Puts (+15)");
      }
    }
    if (metrics.callPutRatio > 0) {
      const pcr = 1 / metrics.callPutRatio;
      if (pcr > 1.1) {
        bullishScore += 12;
        reasons.push(`Bullish PCR (${pcr.toFixed(2)}) put writing floor (+12)`);
      } else if (pcr < 0.85) {
        bearishScore += 12;
        reasons.push(`Bearish PCR (${pcr.toFixed(2)}) call writing ceiling (+12)`);
      }
    }
    if (Math.abs(metrics.broadSentiment) <= 15) {
      if (bullishScore > bearishScore) {
        bullishScore += 8;
        reasons.push("Neutral breadth coiled boost (+8)");
      } else if (bearishScore > bullishScore) {
        bearishScore += 8;
        reasons.push("Neutral breadth coiled boost (+8)");
      }
    }
    const diff = bullishScore - bearishScore;
    let direction = "NEUTRAL";
    let confidence = 0;
    if (diff > 20) {
      direction = "LONG";
      confidence = Math.min(100, 50 + diff * 0.8);
    } else if (diff < -20) {
      direction = "SHORT";
      confidence = Math.min(100, 50 + Math.abs(diff) * 0.8);
    } else {
      confidence = Math.max(0, 40 - Math.abs(diff) / 2);
    }
    return {
      direction,
      confidence,
      reasons
    };
  }
  /**
   * Calculate precise entry, target, and stop loss levels
   */
  static calculateTradeLevels(signal2, currentPrice, srLevels, metrics) {
    if (signal2.direction === "NEUTRAL") {
      return {
        entry: currentPrice,
        target: currentPrice,
        stopLoss: currentPrice
      };
    }
    const volatility = Math.max(15, metrics.volatility / 10);
    const riskPoints = volatility * 1.5;
    const rewardPoints = volatility * 2;
    if (signal2.direction === "LONG") {
      const entry = Math.max(currentPrice - 10, srLevels.support + 5);
      const target = entry + rewardPoints;
      const stopLoss = entry - riskPoints;
      return {
        entry: Math.round(entry * 100) / 100,
        target: Math.round(target * 100) / 100,
        stopLoss: Math.round(Math.max(stopLoss, srLevels.support - 20) * 100) / 100
      };
    } else {
      const entry = Math.min(currentPrice + 10, srLevels.resistance - 5);
      const target = entry - rewardPoints;
      const stopLoss = entry + riskPoints;
      return {
        entry: Math.round(entry * 100) / 100,
        target: Math.round(target * 100) / 100,
        stopLoss: Math.round(Math.min(stopLoss, srLevels.resistance + 20) * 100) / 100
      };
    }
  }
  static getSignalStrength(confidence) {
    if (confidence >= 75) return "STRONG";
    if (confidence >= 60) return "MODERATE";
    return "WEAK";
  }
  static getEmptyMetrics() {
    return {
      trend15m: "NEUTRAL",
      trendStrength: 0,
      priceVelocity: 0,
      broadSentiment: 0,
      callPutRatio: 0,
      optionFlow: "NEUTRAL",
      optionFlowStrength: 0,
      momentumScore: 0,
      accelerationRatio: 0,
      callBuyPressure: 0,
      putBuyPressure: 0,
      oiExpanding: false,
      oiDifferential: 0,
      oiDeltaDifferential: 0,
      support: 0,
      resistance: 0,
      volatility: 0,
      volatilityTrend: "STABLE",
      absorptionScore: 0,
      liquiditySweep: "NONE",
      overallConfidence: 0,
      signalStrength: "WEAK"
    };
  }
};

// services/db.ts
var DB_NAME = "NiftyLiveDB";
var DB_VERSION = 3;
var STORES = {
  // Layer 1: TODAY (Temporary, cleared daily)
  TODAY_SNAPSHOTS: "today_snapshots",
  TODAY_SESSION: "today_session",
  // Layer 2: ARCHIVES (Permanent, multi-day)
  DAILY_ARCHIVES: "daily_archives",
  // Layer 3: PATTERNS (Learned knowledge)
  PATTERNS: "patterns",
  // Layer 4: every agent call ever made, with its graded outcome
  AGENT_CALLS: "agent_calls",
  // Metadata
  META: "meta"
};
var dbInstance = null;
var openDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;
      console.log(`\u{1F504} Upgrading DB from v${oldVersion} to v${DB_VERSION}`);
      if (oldVersion < 2) {
        if (db.objectStoreNames.contains("snapshots")) {
          db.deleteObjectStore("snapshots");
        }
        if (db.objectStoreNames.contains("session_data")) {
          db.deleteObjectStore("session_data");
        }
        if (!db.objectStoreNames.contains(STORES.META)) {
          db.createObjectStore(STORES.META);
        }
      }
      if (!db.objectStoreNames.contains(STORES.TODAY_SNAPSHOTS)) {
        db.createObjectStore(STORES.TODAY_SNAPSHOTS, { keyPath: "timestamp" });
      }
      if (!db.objectStoreNames.contains(STORES.TODAY_SESSION)) {
        db.createObjectStore(STORES.TODAY_SESSION);
      }
      if (!db.objectStoreNames.contains(STORES.DAILY_ARCHIVES)) {
        const archiveStore = db.createObjectStore(STORES.DAILY_ARCHIVES, { keyPath: "date" });
        archiveStore.createIndex("dateIndex", "date", { unique: true });
      }
      if (!db.objectStoreNames.contains(STORES.PATTERNS)) {
        const patternStore = db.createObjectStore(STORES.PATTERNS, { keyPath: "id" });
        patternStore.createIndex("confidence", "confidence");
        patternStore.createIndex("name", "name");
      }
      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META);
      }
      if (!db.objectStoreNames.contains(STORES.AGENT_CALLS)) {
        const callStore = db.createObjectStore(STORES.AGENT_CALLS, { keyPath: "id" });
        callStore.createIndex("agent", "agent");
        callStore.createIndex("timestamp", "timestamp");
        callStore.createIndex("graded", "graded");
      }
      console.log("\u2705 DB Upgrade Complete");
    };
    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};
var dbService = {
  // === Initialization ===
  init: async () => {
    await openDB();
  },
  // === TODAY Operations (Layer 1: Live Session) ===
  saveTodaySnapshot: async (snapshot) => {
    const db = await openDB();
    const tx = db.transaction(STORES.TODAY_SNAPSHOTS, "readwrite");
    if (!snapshot.timestamp) snapshot.timestamp = Date.now();
    tx.objectStore(STORES.TODAY_SNAPSHOTS).put(snapshot);
  },
  getTodaySnapshots: async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TODAY_SNAPSHOTS, "readonly");
      const req = tx.objectStore(STORES.TODAY_SNAPSHOTS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },
  saveTodaySession: async (symbol, candles) => {
    const db = await openDB();
    const tx = db.transaction(STORES.TODAY_SESSION, "readwrite");
    tx.objectStore(STORES.TODAY_SESSION).put(candles, symbol);
  },
  getTodaySession: async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TODAY_SESSION, "readonly");
      const store = tx.objectStore(STORES.TODAY_SESSION);
      const result = {};
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          result[cursor.key] = cursor.value;
          cursor.continue();
        } else {
          resolve(result);
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
  },
  clearTodayStores: async () => {
    const db = await openDB();
    const tx = db.transaction([STORES.TODAY_SNAPSHOTS, STORES.TODAY_SESSION], "readwrite");
    tx.objectStore(STORES.TODAY_SNAPSHOTS).clear();
    tx.objectStore(STORES.TODAY_SESSION).clear();
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
  },
  // === ARCHIVE Operations (Layer 2: Historical Data) ===
  archiveDailyData: async (date, archive) => {
    const db = await openDB();
    const tx = db.transaction(STORES.DAILY_ARCHIVES, "readwrite");
    tx.objectStore(STORES.DAILY_ARCHIVES).put(archive);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  getArchive: async (date) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DAILY_ARCHIVES, "readonly");
      const req = tx.objectStore(STORES.DAILY_ARCHIVES).get(date);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },
  getArchives: async (lastNDays) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DAILY_ARCHIVES, "readonly");
      const store = tx.objectStore(STORES.DAILY_ARCHIVES);
      const req = store.getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        const sorted = all.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        resolve(sorted.slice(0, lastNDays));
      };
      req.onerror = () => reject(req.error);
    });
  },
  getAllArchives: async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DAILY_ARCHIVES, "readonly");
      const req = tx.objectStore(STORES.DAILY_ARCHIVES).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },
  deleteArchive: async (date) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DAILY_ARCHIVES, "readwrite");
      const req = tx.objectStore(STORES.DAILY_ARCHIVES).delete(date);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },
  pruneOldArchives: async (keepDays) => {
    const db = await openDB();
    const cutoffDate = /* @__PURE__ */ new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);
    const tx = db.transaction(STORES.DAILY_ARCHIVES, "readwrite");
    const store = tx.objectStore(STORES.DAILY_ARCHIVES);
    const req = store.openCursor();
    let deletedCount = 0;
    return new Promise((resolve) => {
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          const archive = cursor.value;
          if (new Date(archive.date) < cutoffDate) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
    });
  },
  // === PATTERN Operations (Layer 3: Learned Knowledge) ===
  savePattern: async (pattern) => {
    const db = await openDB();
    const tx = db.transaction(STORES.PATTERNS, "readwrite");
    tx.objectStore(STORES.PATTERNS).put(pattern);
  },
  getPattern: async (id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PATTERNS, "readonly");
      const req = tx.objectStore(STORES.PATTERNS).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },
  getPatterns: async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PATTERNS, "readonly");
      const req = tx.objectStore(STORES.PATTERNS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },
  deletePattern: async (id) => {
    const db = await openDB();
    const tx = db.transaction(STORES.PATTERNS, "readwrite");
    tx.objectStore(STORES.PATTERNS).delete(id);
  },
  // === AGENT CALL Operations (Layer 4: Track Record) ===
  /** Insert or update a graded agent call. */
  putAgentCall: async (call) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.AGENT_CALLS, "readwrite");
      tx.objectStore(STORES.AGENT_CALLS).put(call);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  putAgentCalls: async (calls) => {
    if (calls.length === 0) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.AGENT_CALLS, "readwrite");
      const store = tx.objectStore(STORES.AGENT_CALLS);
      calls.forEach((c) => store.put(c));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  getAllAgentCalls: async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.AGENT_CALLS, "readonly");
      const req = tx.objectStore(STORES.AGENT_CALLS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },
  clearAgentCalls: async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.AGENT_CALLS, "readwrite");
      tx.objectStore(STORES.AGENT_CALLS).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  // === META Operations ===
  setMeta: async (key, value) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.META, "readwrite");
      tx.objectStore(STORES.META).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  getMeta: async (key) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.META, "readonly");
      const req = tx.objectStore(STORES.META).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },
  // === Legacy Compatibility (for migration) ===
  getSnapshots: async () => {
    return dbService.getTodaySnapshots();
  },
  saveSnapshot: async (snapshot) => {
    return dbService.saveTodaySnapshot(snapshot);
  },
  saveStockSession: async (symbol, candles) => {
    return dbService.saveTodaySession(symbol, candles);
  },
  getAllSessionData: async () => {
    return dbService.getTodaySession();
  },
  getLastDate: async () => {
    return dbService.getMeta("current_session_date");
  },
  setLastDate: async (date) => {
    return dbService.setMeta("current_session_date", date);
  },
  clearAll: async () => {
    return dbService.clearTodayStores();
  }
};

// services/paperTradingService.ts
var NIFTY_LOT_SIZE = 75;
var STORE_KEY = "paper_trading_book_v1";
var DEFAULT_CAPITAL = 1e5;
var isPlausibleStrike = (n) => n >= 1e3 && n <= 1e5 && n % 50 === 0;
function parseOptionQuote(quote) {
  const name = quote.original_name || quote.short_name || quote.description || "";
  const build = (strike, type) => ({
    strike,
    optionType: type.toUpperCase(),
    displayName: `NIFTY ${strike} ${type.toUpperCase()}`
  });
  const fromName = name.match(/(\d{3,6})\s*(CE|PE)\b/i);
  if (fromName) return build(Number(fromName[1]), fromName[2]);
  const symbol = quote.symbol || "";
  const dashed = symbol.match(/-(\d{3,6})-(CE|PE)$/i);
  if (dashed) return build(Number(dashed[1]), dashed[2]);
  const monthly = symbol.match(/NIFTY\d{2}(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{3,6})(CE|PE)$/i);
  if (monthly) return build(Number(monthly[1]), monthly[2]);
  const weekly = symbol.match(/NIFTY\d{2}([1-9OND])\d{2}(\d{3,6})(CE|PE)$/i);
  if (weekly && isPlausibleStrike(Number(weekly[2]))) return build(Number(weekly[2]), weekly[3]);
  const packed = symbol.match(/(\d{3,6})(CE|PE)$/i);
  if (packed) {
    let digits = packed[1];
    while (digits.length > 3 && !isPlausibleStrike(Number(digits))) {
      digits = digits.slice(1);
    }
    if (isPlausibleStrike(Number(digits))) return build(Number(digits), packed[2]);
  }
  return null;
}
var RATE_STT_SELL = 1e-3;
var RATE_TRANSACTION = 3503e-7;
var RATE_SEBI = 1e-6;
var RATE_STAMP_BUY = 3e-5;
var RATE_GST = 0.18;
function computeCharges(premium, quantity, side, brokeragePerOrder) {
  const turnover = premium * quantity;
  const round = (n) => Math.round(n * 100) / 100;
  const brokerage = turnover > 0 ? round(brokeragePerOrder) : 0;
  const stt = round(side === "SELL" ? turnover * RATE_STT_SELL : 0);
  const transaction = round(turnover * RATE_TRANSACTION);
  const sebi = round(turnover * RATE_SEBI);
  const stamp = round(side === "BUY" ? turnover * RATE_STAMP_BUY : 0);
  const gst = round((brokerage + transaction + sebi) * RATE_GST);
  return {
    brokerage,
    stt,
    transaction,
    sebi,
    stamp,
    gst,
    total: round(brokerage + stt + transaction + sebi + stamp + gst)
  };
}
function positionPnl(p) {
  return (p.ltp - p.entryPrice) * p.quantity;
}
function positionCost(p) {
  return p.entryPrice * p.quantity + p.entryCharges.total;
}
function effectiveStop(p) {
  if (p.trailPoints == null) return p.stopLoss;
  const trailed = p.highWaterPremium - p.trailPoints;
  if (p.stopLoss == null) return trailed;
  return Math.max(p.stopLoss, trailed);
}
function emptyBook() {
  return {
    version: 1,
    settings: {
      startingCapital: DEFAULT_CAPITAL,
      lotSize: NIFTY_LOT_SIZE,
      brokeragePerOrder: 20,
      autoSquareOff: true
    },
    positions: [],
    trades: [],
    realizedPnl: 0,
    totalCharges: 0,
    createdAt: Date.now()
  };
}
var hasTag = (record, tag) => Array.isArray(record.tags) && record.tags.some((t) => String(t).toUpperCase() === tag);
function ownerStrategy(record) {
  if (record.strategy) return record.strategy;
  if (hasTag(record, "SNIPER")) return "SNIPER";
  if (hasTag(record, "MOMENTUM")) return "MOMENTUM";
  return void 0;
}
function isAutoTrade(record) {
  return record.source === "AUTOTRADE" || hasTag(record, "AUTOTRADE");
}
function backfillOwnership(records) {
  let changed = false;
  for (const record of records) {
    if (!record.source && isAutoTrade(record)) {
      record.source = "AUTOTRADE";
      changed = true;
    }
    if (!record.strategy && record.source === "AUTOTRADE") {
      const owner = ownerStrategy(record);
      if (owner) {
        record.strategy = owner;
        changed = true;
      }
    }
  }
  return changed;
}
function istTimeValue() {
  const ist = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return ist.getHours() * 100 + ist.getMinutes();
}
var PaperTradingEngine = class {
  constructor() {
    this.book = emptyBook();
    this.listeners = /* @__PURE__ */ new Set();
    this.loaded = false;
    this.saveTimer = null;
  }
  // --- lifecycle -----------------------------------------------------------
  async load() {
    if (this.loaded) return this.book;
    try {
      await dbService.init();
      const stored = await dbService.getMeta(STORE_KEY);
      if (stored && stored.version === 1) {
        const base = emptyBook();
        this.book = {
          ...base,
          ...stored,
          settings: { ...base.settings, ...stored.settings || {} }
        };
      }
    } catch (e) {
      console.warn("[Paper] Could not load saved book, starting fresh:", e);
    }
    this.loaded = true;
    let needsPersist = backfillOwnership([...this.book.positions, ...this.book.trades]);
    if (this.pruneDuplicateTrades()) {
      needsPersist = true;
    }
    if (needsPersist) this.persist();
    this.emit();
    return this.book;
  }
  getBook() {
    return this.book;
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  emit() {
    const snapshot = {
      ...this.book,
      positions: [...this.book.positions],
      trades: [...this.book.trades]
    };
    this.listeners.forEach((l) => l(snapshot));
  }
  persist() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      dbService.setMeta(STORE_KEY, this.book).catch(
        (e) => console.warn("[Paper] Save failed:", e)
      );
    }, 400);
  }
  commit() {
    this.emit();
    this.persist();
  }
  /**
   * Remove phantom duplicate trades caused by order reconciliation races.
   *
   * If a trade was recovered from the order book and inserted alongside its
   * original live-recorded fill (or identical fill within 60 seconds), remove
   * the recovered duplicate and reconcile realized P&L and charges.
   */
  pruneDuplicateTrades() {
    const trades = this.book.trades;
    const toRemove = /* @__PURE__ */ new Set();
    for (let i = 0; i < trades.length; i++) {
      const t1 = trades[i];
      if (toRemove.has(t1.id)) continue;
      for (let j = i + 1; j < trades.length; j++) {
        const t2 = trades[j];
        if (toRemove.has(t2.id)) continue;
        if (t1.symbol === t2.symbol) {
          const entryDiff = Math.abs(t1.entryTime - t2.entryTime);
          const exitDiff = Math.abs(t1.exitTime - t2.exitTime);
          const samePrices = Math.abs(t1.entryPrice - t2.entryPrice) < 0.05 && Math.abs(t1.exitPrice - t2.exitPrice) < 0.05;
          if ((entryDiff < 6e4 || exitDiff < 6e4) && samePrices) {
            const t1Recovered = Boolean(
              t1.tags?.includes("RECOVERED") || t1.notes?.includes("Recovered") || t1.entryReason?.includes("Recovered")
            );
            const t2Recovered = Boolean(
              t2.tags?.includes("RECOVERED") || t2.notes?.includes("Recovered") || t2.entryReason?.includes("Recovered")
            );
            if (t1Recovered && !t2Recovered) {
              toRemove.add(t1.id);
            } else if (t2Recovered && !t1Recovered) {
              toRemove.add(t2.id);
            } else if (t1.id !== t2.id) {
              if (t1.exitReason === "MANUAL" && t2.exitReason !== "MANUAL") {
                toRemove.add(t1.id);
              } else if (t2.exitReason === "MANUAL" && t1.exitReason !== "MANUAL") {
                toRemove.add(t2.id);
              } else if (t1.maxFavourable === 0 && t1.maxAdverse === 0 && (t2.maxFavourable !== 0 || t2.maxAdverse !== 0)) {
                toRemove.add(t1.id);
              } else if (t2.maxFavourable === 0 && t2.maxAdverse === 0 && (t1.maxFavourable !== 0 || t1.maxAdverse !== 0)) {
                toRemove.add(t2.id);
              } else {
                toRemove.add(t2.id);
              }
            }
          }
        }
      }
    }
    if (toRemove.size > 0) {
      this.book.trades = this.book.trades.filter((t) => !toRemove.has(t.id));
      this.book.realizedPnl = this.book.trades.reduce((s, t) => s + t.netPnl, 0);
      const openCharges = this.book.positions.reduce(
        (s, p) => s + computeCharges(p.entryPrice, p.quantity, "BUY", this.book.settings.brokeragePerOrder).total,
        0
      );
      this.book.totalCharges = this.book.trades.reduce((s, t) => s + t.charges, 0) + openCharges;
      return true;
    }
    return false;
  }
  // --- settings ------------------------------------------------------------
  updateSettings(patch) {
    this.book.settings = { ...this.book.settings, ...patch };
    this.commit();
  }
  /** Wipes positions and history and restores the starting capital. */
  resetAccount(startingCapital) {
    const settings = {
      ...this.book.settings,
      startingCapital: startingCapital ?? this.book.settings.startingCapital
    };
    this.book = { ...emptyBook(), settings, createdAt: Date.now() };
    this.commit();
  }
  /** Drops the closed-trade log but keeps open positions and realized P&L. */
  clearHistory() {
    this.book.trades = [];
    this.commit();
  }
  // --- account -------------------------------------------------------------
  /** Capital not currently locked up in open premium. */
  availableCash() {
    const deployed = this.book.positions.reduce((sum, p) => sum + positionCost(p), 0);
    return this.book.settings.startingCapital + this.book.realizedPnl - deployed;
  }
  openPnl() {
    return this.book.positions.reduce((sum, p) => sum + positionPnl(p), 0);
  }
  // --- trading -------------------------------------------------------------
  buy(request) {
    const { quote, lots, spot } = request;
    const parsed = parseOptionQuote(quote);
    if (!parsed) {
      return { ok: false, message: "Could not read the strike from this contract." };
    }
    if (!Number.isFinite(lots) || lots < 1) {
      return { ok: false, message: "Quantity must be at least 1 lot." };
    }
    const price = quote.lp;
    if (!Number.isFinite(price) || price <= 0) {
      return { ok: false, message: "No live price for this contract yet." };
    }
    const lotSize = this.book.settings.lotSize;
    const quantity = lots * lotSize;
    const charges = computeCharges(price, quantity, "BUY", this.book.settings.brokeragePerOrder);
    const cost = price * quantity + charges.total;
    if (cost > this.availableCash()) {
      return {
        ok: false,
        message: `Not enough capital. This costs \u20B9${Math.round(cost).toLocaleString("en-IN")} but only \u20B9${Math.round(this.availableCash()).toLocaleString("en-IN")} is free.`
      };
    }
    const stopLoss = request.stopLoss != null && request.stopLoss > 0 ? request.stopLoss : null;
    const target = request.target != null && request.target > 0 ? request.target : null;
    if (stopLoss != null && stopLoss >= price) {
      return { ok: false, message: "Stop loss must be below the entry premium." };
    }
    if (target != null && target <= price) {
      return { ok: false, message: "Target must be above the entry premium." };
    }
    const now = Date.now();
    const position = {
      id: `P${now}-${Math.random().toString(36).slice(2, 7)}`,
      symbol: quote.symbol,
      displayName: parsed.displayName,
      strike: parsed.strike,
      optionType: parsed.optionType,
      expiry: quote.expiry_date,
      lots,
      lotSize,
      quantity,
      entryPrice: price,
      entryTime: now,
      spotAtEntry: spot,
      ltp: price,
      lastTick: now,
      stopLoss,
      target,
      trailPoints: request.trailPoints != null && request.trailPoints > 0 ? request.trailPoints : null,
      highWaterPremium: price,
      lowWaterPremium: price,
      entryCharges: charges,
      notes: request.notes,
      // A hand-placed trade has no engine reasoning, so record the plan that was
      // set at entry. It is what the exit will later have to be judged against.
      entryReason: request.notes?.trim() || `Manual entry at \u20B9${price.toFixed(2)}${spot ? ` with Nifty at ${spot.toFixed(2)}` : ""}${target != null ? ` \xB7 target \u20B9${target.toFixed(2)}` : ""}${stopLoss != null ? ` \xB7 stop \u20B9${stopLoss.toFixed(2)}` : ""}`
    };
    this.book.positions = [position, ...this.book.positions];
    this.book.totalCharges += charges.total;
    this.commit();
    return {
      ok: true,
      position,
      message: `Bought ${lots} lot${lots > 1 ? "s" : ""} of ${parsed.displayName} at \u20B9${price.toFixed(2)}`
    };
  }
  exit(positionId, reason = "MANUAL", priceOverride, spot, exitNote, exitTime) {
    const position = this.book.positions.find((p) => p.id === positionId);
    if (!position) return { ok: false, message: "Position not found." };
    const exitPrice = priceOverride != null ? priceOverride : position.ltp;
    if (!Number.isFinite(exitPrice) || exitPrice < 0) {
      return { ok: false, message: "No valid exit price available." };
    }
    const exitCharges = computeCharges(exitPrice, position.quantity, "SELL", this.book.settings.brokeragePerOrder);
    const grossPnl = (exitPrice - position.entryPrice) * position.quantity;
    const charges = position.entryCharges.total + exitCharges.total;
    const netPnl = grossPnl - charges;
    const now = exitTime ?? Date.now();
    const deployed = position.entryPrice * position.quantity;
    const trade = {
      id: position.id,
      symbol: position.symbol,
      displayName: position.displayName,
      strike: position.strike,
      optionType: position.optionType,
      expiry: position.expiry,
      lots: position.lots,
      lotSize: position.lotSize,
      quantity: position.quantity,
      entryPrice: position.entryPrice,
      exitPrice,
      entryTime: position.entryTime,
      exitTime: now,
      holdMs: now - position.entryTime,
      spotAtEntry: position.spotAtEntry,
      spotAtExit: spot ?? null,
      grossPnl,
      charges,
      netPnl,
      netPnlPercent: deployed > 0 ? netPnl / deployed * 100 : 0,
      exitReason: reason,
      maxFavourable: position.highWaterPremium - position.entryPrice,
      maxAdverse: position.lowWaterPremium - position.entryPrice,
      notes: position.notes,
      source: isAutoTrade(position) ? "AUTOTRADE" : position.source ?? "MANUAL",
      strategy: ownerStrategy(position),
      entryReason: position.entryReason,
      exitNote,
      tags: position.tags
    };
    this.book.positions = this.book.positions.filter((p) => p.id !== positionId);
    this.book.trades = [trade, ...this.book.trades];
    this.book.realizedPnl += netPnl;
    this.book.totalCharges += exitCharges.total;
    this.commit();
    return {
      ok: true,
      message: `Exited ${position.displayName} at \u20B9${exitPrice.toFixed(2)} \xB7 ${netPnl >= 0 ? "+" : ""}\u20B9${Math.round(netPnl).toLocaleString("en-IN")}`
    };
  }
  /**
   * Record a position opened by a strategy panel that manages its own exits.
   *
   * The Sniper places its trade through its own OrderManager and runs its own
   * +30/-30 and 10:15 rules. Before this existed those trades were invisible
   * in the paper book, so the ledger, the equity curve and every statistic on
   * the Paper Trading screen silently excluded the trades the system took
   * automatically - which is the opposite of what a journal is for.
   *
   * Two deliberate differences from `buy()`:
   *
   *   - `managed: false`. This engine will mark the position to market but
   *     will never close it on a stop or target. The strategy owns the exit;
   *     if both systems could exit it, a fast tick would book the trade twice.
   *   - No capital check. The order has already been placed. Refusing to
   *     record it would not un-place it, it would only lose the record.
   */
  async openExternal(params) {
    await this.load();
    const { symbol, strike, optionType, lots, entryPrice, spot } = params;
    if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
      return { ok: false, message: "External entry needs a positive premium." };
    }
    if (!Number.isFinite(lots) || lots < 1) {
      return { ok: false, message: "External entry needs at least one lot." };
    }
    if (this.book.positions.some((p) => p.symbol === symbol && isAutoTrade(p))) {
      return { ok: false, message: "That auto-trade is already on the book." };
    }
    const entryTimeToCheck = params.entryTime ?? Date.now();
    if (params.tags?.includes("RECOVERED") && this.book.trades.some(
      (t) => t.symbol === symbol && Math.abs(t.entryTime - entryTimeToCheck) < 6e4
    )) {
      return { ok: false, message: "That fill is already recorded in the paper ledger." };
    }
    const lotSize = params.lotSize && params.lotSize > 0 ? params.lotSize : this.book.settings.lotSize;
    const quantity = lots * lotSize;
    const charges = computeCharges(entryPrice, quantity, "BUY", this.book.settings.brokeragePerOrder);
    const now = params.entryTime ?? Date.now();
    const position = {
      id: `A${now}-${Math.random().toString(36).slice(2, 7)}`,
      symbol,
      displayName: params.displayName ?? `${strike} ${optionType}`,
      strike,
      optionType,
      expiry: params.expiry,
      lots,
      lotSize,
      quantity,
      entryPrice,
      entryTime: now,
      spotAtEntry: spot,
      ltp: entryPrice,
      lastTick: now,
      // Null so markToMarket has nothing to trigger on even if `managed` were
      // ever ignored - belt and braces on the double-exit risk.
      stopLoss: null,
      target: null,
      trailPoints: null,
      highWaterPremium: entryPrice,
      lowWaterPremium: entryPrice,
      entryCharges: charges,
      notes: params.notes,
      source: "AUTOTRADE",
      strategy: params.strategy,
      entryReason: params.entryReason,
      tags: params.tags,
      managed: false
    };
    this.book.positions = [position, ...this.book.positions];
    this.book.totalCharges += charges.total;
    this.commit();
    return { ok: true, position, message: `Logged auto-trade ${position.displayName} at \u20B9${entryPrice.toFixed(2)}` };
  }
  /**
   * Mark an externally-managed position's premium without any exit check.
   *
   * Intentionally synchronous and load-guarded rather than load-awaiting: it
   * runs on every tick, and if the book is not loaded there is no external
   * position to mark anyway (openExternal loads before it creates one).
   */
  markExternal(symbol, premium) {
    if (!this.loaded) return;
    const position = this.book.positions.find((p) => p.symbol === symbol && isAutoTrade(p));
    if (!position || !Number.isFinite(premium) || premium <= 0) return;
    if (premium === position.ltp) return;
    position.ltp = premium;
    position.lastTick = Date.now();
    if (premium > position.highWaterPremium) position.highWaterPremium = premium;
    if (premium < position.lowWaterPremium) position.lowWaterPremium = premium;
    this.book.positions = [...this.book.positions];
    this.commit();
  }
  /** Close a strategy-owned position into the log. Safe to call twice. */
  async closeExternal(symbol, exitPrice, reason, spot, exitNote, exitTime) {
    await this.load();
    const position = this.book.positions.find((p) => p.symbol === symbol && isAutoTrade(p));
    if (!position) return { ok: false, message: "No open auto-trade for that contract." };
    return this.exit(
      position.id,
      reason,
      Number.isFinite(exitPrice) && exitPrice > 0 ? exitPrice : void 0,
      spot,
      exitNote,
      exitTime
    );
  }
  exitAll(reason = "MANUAL", spot, exitNote) {
    const ids = this.book.positions.map((p) => p.id);
    ids.forEach((id) => this.exit(id, reason, void 0, spot, exitNote));
    return ids.length;
  }
  updateRisk(positionId, patch) {
    const position = this.book.positions.find((p) => p.id === positionId);
    if (!position) return { ok: false, message: "Position not found." };
    if (patch.stopLoss !== void 0) position.stopLoss = patch.stopLoss && patch.stopLoss > 0 ? patch.stopLoss : null;
    if (patch.target !== void 0) position.target = patch.target && patch.target > 0 ? patch.target : null;
    if (patch.trailPoints !== void 0) position.trailPoints = patch.trailPoints && patch.trailPoints > 0 ? patch.trailPoints : null;
    this.book.positions = [...this.book.positions];
    this.commit();
    return { ok: true, message: "Risk levels updated." };
  }
  /**
   * Marks every open position against the latest chain and fires any stop,
   * target or trailing exit that the new prices have triggered.
   *
   * Returns the exits that were executed so the UI can surface them.
   */
  markToMarket(quotes, spot) {
    if (this.book.positions.length === 0) return [];
    const bySymbol = new Map(quotes.map((q) => [q.symbol, q]));
    const triggered = [];
    const now = Date.now();
    let changed = false;
    for (const position of this.book.positions) {
      const quote = bySymbol.get(position.symbol);
      if (!quote || !Number.isFinite(quote.lp) || quote.lp <= 0) continue;
      const ltp = quote.lp;
      if (ltp !== position.ltp) changed = true;
      position.ltp = ltp;
      position.lastTick = now;
      if (ltp > position.highWaterPremium) position.highWaterPremium = ltp;
      if (ltp < position.lowWaterPremium) position.lowWaterPremium = ltp;
      if (position.managed === false) continue;
      const stop = effectiveStop(position);
      if (stop != null && ltp <= stop) {
        triggered.push({
          position,
          reason: position.trailPoints != null && stop > (position.stopLoss ?? -Infinity) ? "TRAILING" : "STOPLOSS",
          price: ltp
        });
        continue;
      }
      if (position.target != null && ltp >= position.target) {
        triggered.push({ position, reason: "TARGET", price: ltp });
      }
    }
    if (this.book.settings.autoSquareOff && istTimeValue() >= 1520) {
      for (const position of this.book.positions) {
        if (position.managed === false) continue;
        if (!triggered.some((t) => t.position.id === position.id)) {
          triggered.push({ position, reason: "EOD", price: position.ltp });
        }
      }
    }
    triggered.forEach((t) => {
      const stop = effectiveStop(t.position);
      const note = t.reason === "TARGET" ? `Premium reached the \u20B9${t.position.target?.toFixed(2)} target (exit \u20B9${t.price.toFixed(2)}).` : t.reason === "TRAILING" ? `Trailing stop \u20B9${stop?.toFixed(2)} hit after the premium peaked at \u20B9${t.position.highWaterPremium.toFixed(2)}.` : t.reason === "STOPLOSS" ? `Premium broke the \u20B9${stop?.toFixed(2)} stop (exit \u20B9${t.price.toFixed(2)}).` : "Auto square-off at 15:20 IST \u2014 no position is carried overnight.";
      this.exit(t.position.id, t.reason, t.price, spot, note);
    });
    if (changed && triggered.length === 0) {
      this.book.positions = [...this.book.positions];
      this.commit();
    }
    return triggered;
  }
  // --- analytics -----------------------------------------------------------
  getStats() {
    const trades = this.book.trades;
    const wins = trades.filter((t) => t.netPnl > 0);
    const losses = trades.filter((t) => t.netPnl <= 0);
    const grossProfit = wins.reduce((s, t) => s + t.netPnl, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.netPnl, 0));
    const netPnl = trades.reduce((s, t) => s + t.netPnl, 0);
    let bestStreak = 0;
    let worstStreak = 0;
    let runWin = 0;
    let runLoss = 0;
    for (let i = trades.length - 1; i >= 0; i--) {
      if (trades[i].netPnl > 0) {
        runWin++;
        runLoss = 0;
        bestStreak = Math.max(bestStreak, runWin);
      } else {
        runLoss++;
        runWin = 0;
        worstStreak = Math.max(worstStreak, runLoss);
      }
    }
    const avgWin = wins.length ? grossProfit / wins.length : 0;
    const avgLoss = losses.length ? grossLoss / losses.length : 0;
    const winRate = trades.length ? wins.length / trades.length * 100 : 0;
    return {
      totalTrades: trades.length,
      wins: wins.length,
      losses: losses.length,
      winRate,
      grossPnl: trades.reduce((s, t) => s + t.grossPnl, 0),
      totalCharges: trades.reduce((s, t) => s + t.charges, 0),
      netPnl,
      avgWin,
      avgLoss,
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
      expectancy: trades.length ? netPnl / trades.length : 0,
      largestWin: trades.reduce((m, t) => Math.max(m, t.netPnl), 0),
      largestLoss: trades.reduce((m, t) => Math.min(m, t.netPnl), 0),
      avgHoldMinutes: trades.length ? trades.reduce((s, t) => s + t.holdMs, 0) / trades.length / 6e4 : 0,
      bestStreak,
      worstStreak
    };
  }
};
var paperTradingEngine = new PaperTradingEngine();

// services/sniperPlaybook.ts
var SNIPER = {
  name: "Nifty Sniper: The Office Protocol",
  /** Watch the open, do not trade. */
  downloadStart: "09:15",
  /** Entry window opens. */
  entryStart: "09:25",
  /** "If choppy or confusing by 09:45, close the laptop." */
  reviewBy: "09:45",
  /** When trailing stop begins for profitable positions. */
  trailStart: "10:15",
  /** Hard stop. No exceptions. */
  hardStop: "10:30",
  /**
   * When the engine switches itself off.
   *
   * Five minutes after the hard stop, so a 10:30 exit has time to fill and be
   * logged. Past this the protocol has nothing left to do today — staying armed
   * only burns CPU on a one-second loop and risks acting on a stale read.
   */
  standDown: "10:35",
  /** Data-backed asymmetric target: 25 points yields 44.8% hit rate vs 32% for 30pts. */
  targetPoints: 25,
  /** Data-backed asymmetric stop: 15 points cuts adverse drag, surging Profit Factor to 1.35. */
  stopPoints: 15,
  /** MySystemAutoTrade uses a fixed 250-point ITM strike. */
  itmPoints: 250,
  strikeStep: 50,
  /** Optimized confidence threshold: 65% captures mean-reversion setups filtered out by 75%. */
  minEngineConfidence: 65,
  /** Balanced trigger band: 25 points matches half of minZoneWidth (50) for perfect wall coverage. */
  zoneBuffer: 25,
  /**
   * Minimum wall-to-wall room. Entry happens up to `zoneBuffer` inside the
   * zone and needs `targetPoints` of travel, so anything under 50 makes the
   * 25-point target mathematically unreachable before the opposite wall.
   */
  minZoneWidth: 50,
  /** Below this the day is technically tradable but uncomfortably tight. */
  comfortableZoneWidth: 75,
  /**
   * How far outside the opening range each wall sits, as a fraction of that
   * range's own width.
   *
   * This replaced a flat 50-point pad that was rounded out to the nearest 50.
   * On a quiet open that was catastrophic: a 16-point range became a 200-point
   * zone, only 30% of which is within `zoneBuffer` of a wall, so price sat
   * mid-range for the whole entry window and the day was declined mechanically
   * rather than on merit. Scaling the pad to what the tape actually did keeps a
   * coiled open tradable and still gives a violent open real room.
   */
  zonePadRatio: 0.35,
  /**
   * Ceiling on the scaled pad. A gap-and-run open can print a huge 10-minute
   * range; without this the zone would widen past anything intraday-relevant.
   */
  maxZonePad: 50,
  /**
   * Chart levels further apart than this are positional, not intraday - the
   * real zones will come from the 09:15-09:25 five-minute range instead.
   */
  maxUsefulZoneWidth: 400,
  /** Approximate delta of a 250-point ITM weekly Nifty option. */
  itmDelta: 0.85
};
var PHASE_LABELS = {
  PRE_MARKET: "Pre-market \xB7 plan now, do not trade",
  DOWNLOAD: "Download 09:15-09:25 \xB7 watch only, mark the 5-min range",
  ENTRY_WINDOW: "Entry window 09:25-09:45 \xB7 prime time for the setup",
  LATE_WINDOW: `Late window 09:45-${SNIPER.hardStop} \xB7 only already-armed setups`,
  CLOSED: `Closed \xB7 ${SNIPER.hardStop} hard stop passed, day is over`
};

// services/sniperEngine.ts
function istMinutesOf(now) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(now);
  return Number(parts.find((p) => p.type === "hour")?.value ?? 0) * 60 + Number(parts.find((p) => p.type === "minute")?.value ?? 0);
}
var hhmmToMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
var MARKET_OPEN = hhmmToMinutes(SNIPER.downloadStart);
var ENTRY_OPEN = hhmmToMinutes(SNIPER.entryStart);
var ENTRY_CLOSE = hhmmToMinutes(SNIPER.reviewBy);
var TRAIL_START = hhmmToMinutes(SNIPER.trailStart);
var HARD_STOP = hhmmToMinutes(SNIPER.hardStop);
var STAND_DOWN = hhmmToMinutes(SNIPER.standDown);
var PHASE_LABEL = {
  PRE_OPEN: "Pre-open \u2014 the market has not started",
  DOWNLOAD: "The Download \u2014 watch only, marking the 5-minute range",
  ENTRY_WINDOW: "Entry Window \u2014 the setup may be taken now",
  MANAGE_ONLY: `Manage only \u2014 no new entries after ${SNIPER.reviewBy}`,
  HARD_STOP: `Hard Stop \u2014 ${SNIPER.hardStop} passed, everything is flat`,
  AFTER_HOURS: "After hours \u2014 the protocol is done for today"
};
var istDayKey = (ts) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
}).format(new Date(ts));

// services/marketSession.ts
var MARKET_CLOSE = 15 * 60 + 30;
function istWeekday(now) {
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return ist.getDay();
}
function isMarketLive(now = /* @__PURE__ */ new Date()) {
  const day = istWeekday(now);
  if (day === 0 || day === 6) return false;
  const mins = istMinutesOf(now);
  return mins >= MARKET_OPEN && mins < MARKET_CLOSE;
}

// services/momentumEntryGuard.ts
var MINUTE = 6e4;
var NOMINAL_GAP_MS = 9e4;
var MAX_HOLE_FRACTION = 1 / 4;
var MIN_WINDOW_ROWS = 10;
var MOMENTUM_POLICY = {
  minConfidence: 62,
  /**
   * Directional efficiency floor: move15 / path.
   *
   * Was a hardcoded 0.55, which was the single biggest bottleneck on
   * 2026-09-22 — 13 of the 23 real denials among scans that had already
   * cleared the score threshold.
   *
   * Measured at the guard's own one-per-minute cadence across that whole
   * session (67 rolling 15-minute windows): median efficiency 19.4%, max
   * 70.5%. Windows clearing each floor:
   *
   *     >= 55%   10%
   *     >= 45%   21%
   *     >= 40%   28%
   *     >= 35%   34%
   *
   * So 0.40 roughly triples the admissible windows versus 0.55 while still
   * refusing the churning ~70% — it is a deliberate loosening, not a
   * recalibration to some "true" value. Note the floor is also sampling-rate
   * dependent: path grows with snapshot frequency while net move does not, so
   * this number is only meaningful at roughly one snapshot per minute.
   *
   * Lifted to a named policy value so it is visible and tunable next to
   * minConfidence instead of buried in the path check.
   *
   * NOTE, recorded deliberately: on 2026-09-22, scans clearing 68 averaged
   * -2.52 points over the following 15 minutes and scans clearing 75 averaged
   * -10.82 at a 22% win rate (n=20 and n=9, heavily overlapping windows, one
   * session). Relaxing this admits trades that sample predicts will lose. It
   * is enabled to generate real entry/exit records, which no amount of gate
   * tuning can substitute for. Raise it back to 0.55 to restore the old
   * behaviour.
   */
  minPathEfficiency: 0.3,
  cooldownMinutes: 5,
  lossCooldownMinutes: 15,
  maxDailyTrades: 4,
  maxConsecutiveLosses: 2,
  maxDailyLoss: 2e3,
  minNetRiskReward: 1.3,
  confirmationMinutes: 2,
  maxSnapshotAgeMs: 9e4,
  maxVisionAgeMs: 5 * MINUTE
};
function pairRoundTrips(orders, day) {
  const filled = orders.filter((o) => o.status === "FILLED" && istDayKey(o.timestamp) === day).sort((a, b) => a.timestamp - b.timestamp);
  const open = /* @__PURE__ */ new Map();
  const pairs = [];
  for (const o of filled) {
    if (o.side === "BUY") {
      open.set(o.symbol, { price: o.avgPrice, qty: o.filledQty, at: o.timestamp });
    } else {
      const entry = open.get(o.symbol);
      if (!entry) continue;
      open.delete(o.symbol);
      pairs.push({
        symbol: o.symbol,
        entry: entry.price,
        exit: o.avgPrice,
        qty: entry.qty || o.filledQty,
        at: entry.at,
        closedAt: o.timestamp
      });
    }
  }
  return pairs;
}
var MOMENTUM_GATES = [
  { id: "engine-running", label: "Engine running" },
  { id: "paper-mode", label: "Paper mode (LIVE entries disabled)" },
  { id: "settings-valid", label: "Valid score / daily-limit settings" },
  { id: "entry-window", label: "Entry window 09:30-15:00 IST" },
  { id: "flat-book", label: "No open position or pending order" },
  { id: "daily-limit", label: "Daily entry limit not reached" },
  { id: "loss-limits", label: "Daily loss and consecutive-loss limits" },
  { id: "cooldown", label: "Post-trade cooldown elapsed" },
  { id: "fresh-snapshot", label: "Fresh market snapshot (max 90s)" },
  { id: "directional-signal", label: "Signal is directional, not NEUTRAL" },
  { id: "signal-current", label: "Signal scanned on the latest snapshot" },
  { id: "new-evidence", label: "New market evidence since last trade" },
  { id: "score", label: "Signal score at or above threshold" },
  { id: "history-anchors", label: "Continuous 1m, 5m and 15m history" },
  { id: "window-quality", label: "Confirmation window intact (>=10 rows)" },
  { id: "price-alignment", label: "Price aligned on 1m, 5m and 15m" },
  { id: "path-measurable", label: "Price path measurable (hole <=25%)" },
  { id: "efficiency", label: "Directional efficiency above floor" },
  { id: "breadth-momentum", label: "Breadth and momentum both confirm" },
  { id: "anti-chase", label: "Price not extended (no chasing)" },
  { id: "vision", label: "Vision agrees with the direction" },
  { id: "execution-valid", label: "Valid execution price, qty and risk" },
  { id: "risk-reward", label: "Net reward/risk after charges" },
  { id: "risk-budget", label: "Stop risk within remaining daily budget" },
  { id: "confirmation", label: "Confirmed across 3 snapshots over 2m" }
];
var GATE_ORDER = new Map(MOMENTUM_GATES.map((g, i) => [g.id, i]));
function buildChecks(blockedAt, detail, visionRequired) {
  const blockIndex = blockedAt === null ? Number.POSITIVE_INFINITY : GATE_ORDER.get(blockedAt) ?? -1;
  return MOMENTUM_GATES.map((gate, index) => {
    let status = index < blockIndex ? "pass" : index === blockIndex ? "block" : "pending";
    if (gate.id === "vision" && !visionRequired && status === "pass") status = "skip";
    return status === "block" ? { ...gate, status, detail } : { ...gate, status };
  });
}
function evaluateMomentumEntry(input2, previous) {
  const deny = (reason2, gate) => ({
    ready: false,
    reason: reason2,
    candidate: null,
    checks: buildChecks(gate, reason2, input2.requireVision),
    blockedBy: gate
  });
  const { now, signal: s, history: history2, spot } = input2;
  const policy = MOMENTUM_POLICY;
  if (!input2.running) return deny("Engine stopped; entry confirmation reset.", "engine-running");
  if (input2.tradingMode === "LIVE") {
    return deny("LIVE Momentum entries disabled: verified option quotes and broker fill reconciliation are required.", "paper-mode");
  }
  if (!Number.isFinite(input2.minConfidence)) return deny("Invalid minimum signal score.", "settings-valid");
  const maxDailyTrades = input2.maxDailyTrades === void 0 ? policy.maxDailyTrades : input2.maxDailyTrades;
  if (!Number.isSafeInteger(maxDailyTrades) || maxDailyTrades < 1) {
    return deny("Invalid daily entry limit; enter a positive whole number.", "settings-valid");
  }
  const minutes = istMinutesOf(new Date(now));
  if (!isMarketLive(new Date(now)) || minutes < 9 * 60 + 30 || minutes >= 15 * 60) {
    return deny("Entry window: 09:30-15:00 IST; wait outside the opening noise.", "entry-window");
  }
  if (input2.openPositions > 0 || input2.orders.some((o) => ["PENDING", "PLACED", "PARTIAL"].includes(o.status))) {
    return deny("Position or unconfirmed order already open.", "flat-book");
  }
  const today = istDayKey(now);
  const orders = input2.orders.filter((o) => istDayKey(o.timestamp) === today);
  const buys = orders.filter((o) => o.side === "BUY" && o.status === "FILLED");
  if (buys.length >= maxDailyTrades) return deny(`Daily limit: ${maxDailyTrades} entries reached.`, "daily-limit");
  const trips = pairRoundTrips(orders, today);
  let netPnl = 0;
  let losses = 0;
  let lastNet = 0;
  for (const trip2 of trips) {
    if (![trip2.entry, trip2.exit, trip2.qty].every((v) => Number.isFinite(v) && v > 0)) {
      return deny("Order book contains an unpriced fill; reconcile it before entering again.", "loss-limits");
    }
    lastNet = (trip2.exit - trip2.entry) * trip2.qty - computeCharges(trip2.entry, trip2.qty, "BUY", input2.brokerage).total - computeCharges(trip2.exit, trip2.qty, "SELL", input2.brokerage).total;
    netPnl += lastNet;
    losses = lastNet <= 0 ? losses + 1 : 0;
  }
  if (netPnl <= -policy.maxDailyLoss) return deny(`Daily net loss limit reached (Rs ${policy.maxDailyLoss}).`, "loss-limits");
  if (losses >= policy.maxConsecutiveLosses) {
    return deny(`Stand down today: ${policy.maxConsecutiveLosses} consecutive net losses.`, "loss-limits");
  }
  const lastExit = trips[trips.length - 1]?.closedAt ?? 0;
  const cooldown = (lastNet <= 0 ? policy.lossCooldownMinutes : policy.cooldownMinutes) * MINUTE;
  const cooldownUntil = lastExit ? lastExit + cooldown : 0;
  if (now < cooldownUntil) {
    return deny(`Post-${lastNet <= 0 ? "loss" : "exit"} cooldown: ${Math.ceil((cooldownUntil - now) / MINUTE)}m remaining.`, "cooldown");
  }
  const lastAttempt = Math.max(0, ...orders.filter((o) => o.side === "BUY").map((o) => o.timestamp));
  if (now - lastAttempt < MINUTE) return deny("Entry attempt consumed; wait for a fresh setup before retrying.", "cooldown");
  const latest = history2[0];
  const snapshotAt = latest?.timestamp;
  if (!Number.isFinite(spot) || !(spot > 0) || !Number.isFinite(snapshotAt) || now - snapshotAt > policy.maxSnapshotAgeMs || snapshotAt > now) {
    return deny("Waiting for a fresh timestamped market snapshot (maximum age 90s).", "fresh-snapshot");
  }
  if (!s || s.direction === "NEUTRAL") return deny("No directional setup.", "directional-signal");
  if (input2.signalAt !== snapshotAt) return deny("New market data arrived; waiting for a fresh signal scan.", "signal-current");
  if (snapshotAt <= lastAttempt || snapshotAt <= cooldownUntil) {
    return deny("Waiting for new market evidence after the previous trade/cooldown.", "new-evidence");
  }
  const threshold = Math.max(policy.minConfidence, input2.minConfidence);
  if (!Number.isFinite(s.confidence) || s.confidence < threshold) {
    return deny(`Signal score below ${threshold}; this score is not a win probability.`, "score");
  }
  const anchor = (age) => history2.find((h) => Number.isFinite(h.timestamp) && h.timestamp <= snapshotAt - age * MINUTE);
  const one = anchor(1);
  const five = anchor(5);
  const fifteen = anchor(15);
  if (!one || !five || !fifteen || snapshotAt - one.timestamp > 2.5 * MINUTE || snapshotAt - five.timestamp > 6.5 * MINUTE || snapshotAt - fifteen.timestamp > 16.5 * MINUTE) {
    return deny("Warming up: need continuous, timestamped 1m, 5m and 15m market history.", "history-anchors");
  }
  const window = history2.slice(0, history2.indexOf(fifteen) + 1);
  let observedPath = 0, observedMs = 0, observedSteps = 0;
  let holeMs = 0, holePath = 0;
  for (let i = 0; i < window.length; i++) {
    const row = window[i];
    if (!Number.isFinite(row.niftyLtp) || row.niftyLtp <= 0 || !Number.isFinite(row.timestamp) || istDayKey(row.timestamp) !== today) {
      return deny("Invalid or previous-session data in the confirmation window.", "window-quality");
    }
    if (i > 0) {
      const gap = window[i - 1].timestamp - row.timestamp;
      if (gap <= 0) return deny("Market history has duplicate or out-of-order timestamps.", "window-quality");
      const step = Math.abs(window[i - 1].niftyLtp - row.niftyLtp);
      if (gap <= NOMINAL_GAP_MS) {
        observedPath += step;
        observedMs += gap;
        observedSteps++;
      } else {
        holeMs += gap;
        holePath += step;
      }
    }
  }
  if (window.length < MIN_WINDOW_ROWS) {
    return deny(`Sparse market history: ${window.length} snapshots in the 15m window, need ${MIN_WINDOW_ROWS}.`, "window-quality");
  }
  const sign = s.direction === "LONG" ? 1 : -1;
  const move1 = sign * (latest.niftyLtp - one.niftyLtp);
  const move5 = sign * (latest.niftyLtp - five.niftyLtp);
  const move15 = sign * (latest.niftyLtp - fifteen.niftyLtp);
  const move1Floor = move5 >= 15 && move15 >= 25 ? -4 : move5 >= 12 && move15 >= 20 ? -2 : 0;
  if (move1 <= move1Floor || move5 < 5 || move15 < 8) {
    return deny(
      `Wait for aligned 1m, 5m and 15m price direction (now ${move1 >= 0 ? "+" : ""}${move1.toFixed(1)} / ${move5 >= 0 ? "+" : ""}${move5.toFixed(1)} / ${move15 >= 0 ? "+" : ""}${move15.toFixed(1)} pts, need >${move1Floor} / >=5 / >=8).`,
      "price-alignment"
    );
  }
  const spanMs = latest.timestamp - fifteen.timestamp;
  if (observedMs <= 0 || holeMs > spanMs * MAX_HOLE_FRACTION) {
    return deny(`Price path unmeasurable: ${Math.round(holeMs / 1e3)}s of the ${Math.round(spanMs / MINUTE)}m window is missing.`, "path-measurable");
  }
  const path = observedPath + Math.max(holePath, observedPath / observedMs * holeMs);
  const efficiency = path > 0 ? move15 / path : 0;
  const m = s.metrics;
  const isSuperTrend = s.confidence >= 75 && m.trend15m === (sign === 1 ? "BULLISH" : "BEARISH") && m.trendStrength >= 85 && sign * m.broadSentiment >= 35;
  const requiredEfficiency = isSuperTrend ? 0.2 : policy.minPathEfficiency;
  if (path === 0 || efficiency < requiredEfficiency) {
    return deny(`Choppy price path; directional efficiency ${(efficiency * 100).toFixed(0)}% below ${(requiredEfficiency * 100).toFixed(0)}%${isSuperTrend ? " (macro trend-adjusted)" : ""}.`, "efficiency");
  }
  if (![m.broadSentiment, m.optionFlowStrength, m.momentumScore].every(Number.isFinite) || sign * m.broadSentiment < 5 || sign * m.momentumScore < 15) {
    return deny(
      `Breadth and momentum must both confirm the direction (breadth ${(sign * m.broadSentiment).toFixed(0)} needs >=5, momentum ${(sign * m.momentumScore).toFixed(0)} needs >=15).`,
      "breadth-momentum"
    );
  }
  const averageStep = observedSteps > 0 ? observedPath / observedSteps : 0;
  if (move1 > Math.max(12, averageStep * 2.5) || Math.abs(spot - latest.niftyLtp) > Math.max(8, averageStep * 1.5)) {
    return deny("Price is extended or has moved away from the setup; do not chase.", "anti-chase");
  }
  if (input2.requireVision) {
    if (input2.visionError) return deny(`Vision required: ${input2.visionError}`, "vision");
    const run = input2.vision;
    const verdict = run?.analysis.parsed;
    const capturedAt = run ? Date.parse(run.startedAt) : NaN;
    if (!run?.analysis.ok || run.analysis.skipped || !verdict || verdict.readable !== true || !Number.isFinite(capturedAt) || now - capturedAt > policy.maxVisionAgeMs || capturedAt > now || !Number.isFinite(verdict.confidence) || verdict.confidence < 70 || run.shots.length === 0 || run.shots.some((shot) => !shot.ok || shot.awaitingLogin)) {
      return deny("Vision required: waiting for a readable, successful chart capture less than 5m old.", "vision");
    }
    if (verdict.bias !== (sign === 1 ? "bullish" : "bearish")) {
      return deny(`Vision does not agree (${verdict.bias}); stand aside.`, "vision");
    }
  }
  const { premium, quantity, targetPct, stopPct, brokerage } = input2;
  if (![premium, quantity, targetPct, stopPct, brokerage].every(Number.isFinite) || premium <= 0 || quantity <= 0 || !Number.isInteger(quantity) || targetPct <= 0 || stopPct <= 0 || stopPct >= 100 || brokerage < 0) {
    return deny("Invalid execution price, quantity or risk settings.", "execution-valid");
  }
  const target = premium * (1 + targetPct / 100);
  const stop = premium * (1 - stopPct / 100);
  const entryCharges = computeCharges(premium, quantity, "BUY", brokerage).total;
  const reward = (target - premium) * quantity - entryCharges - computeCharges(target, quantity, "SELL", brokerage).total - (premium + target) * quantity * 5e-3;
  const risk = (premium - stop) * quantity + entryCharges + computeCharges(stop, quantity, "SELL", brokerage).total + (premium + stop) * quantity * 5e-3;
  const netRiskReward = reward / risk;
  if (netRiskReward < policy.minNetRiskReward) {
    return { ...deny(`Net reward/risk ${netRiskReward.toFixed(2)} below ${policy.minNetRiskReward} after charges and slippage.`, "risk-reward"), netRiskReward };
  }
  if (risk > policy.maxDailyLoss + netPnl) return deny("Planned stop risk exceeds the remaining daily loss budget.", "risk-budget");
  const same = previous?.direction === s.direction && previous.firstAt > Math.max(lastAttempt, cooldownUntil) && snapshotAt >= previous.lastAt && snapshotAt - previous.lastAt <= policy.maxSnapshotAgeMs;
  const candidate = same ? { ...previous, lastAt: snapshotAt, observations: previous.observations + (snapshotAt > previous.lastAt ? 1 : 0) } : { direction: s.direction, firstAt: snapshotAt, lastAt: snapshotAt, observations: 1 };
  const isSuperConviction = Boolean(
    input2.fastTrackConfirmation && s.confidence >= 90 && m.trendStrength >= 95 && m.trend15m === (sign === 1 ? "BULLISH" : "BEARISH") && sign * m.broadSentiment >= 50
  );
  const requiredObservations = isSuperConviction ? 2 : 3;
  const requiredDurationMs = isSuperConviction ? 45 * 1e3 : policy.confirmationMinutes * MINUTE;
  const ready = candidate.observations >= requiredObservations && candidate.lastAt - candidate.firstAt >= requiredDurationMs;
  const reason = ready ? `Confirmed across ${candidate.observations} fresh snapshots (${isSuperConviction ? "fast-track high conviction" : "standard"}); net R:R ${netRiskReward.toFixed(2)}.` : `Confirming direction: ${candidate.observations}/${requiredObservations} fresh snapshots over at least ${Math.round(requiredDurationMs / 1e3)}s${isSuperConviction ? " (fast-track)" : ""}.`;
  return {
    ready,
    candidate,
    netRiskReward,
    reason,
    // Every rule passed; only the multi-snapshot confirmation can still be
    // outstanding, and that is progress rather than a rejection.
    checks: buildChecks(ready ? null : "confirmation", reason, input2.requireVision),
    blockedBy: ready ? null : "confirmation"
  };
}

// services/optionPricing.ts
var ATM_EXTRINSIC = 80;
var DECAY_POINTS = 250;
function estimateOptionPremium(spot, strike, optionType) {
  if (!isFinite(spot) || !isFinite(strike) || spot <= 0) return ATM_EXTRINSIC;
  const intrinsic = optionType === "CE" ? Math.max(0, spot - strike) : Math.max(0, strike - spot);
  const moneyness = Math.abs(spot - strike) / DECAY_POINTS;
  const extrinsic = ATM_EXTRINSIC * Math.exp(-(moneyness * moneyness));
  return Math.max(1, Math.round((intrinsic + extrinsic) * 20) / 20);
}

// ml/momentumEntryGuard.test.ts
var AT = Date.parse("2026-09-16T11:00:00+05:30");
var MINUTE2 = 6e4;
var CE = "NSE:NIFTY2692223500CE";
var PE = "NSE:NIFTY2692223500PE";
var passed = 0;
function test(label, run) {
  run();
  passed++;
  console.log(`  ok    ${label}`);
}
function signal(direction = "LONG") {
  const sign = direction === "LONG" ? 1 : -1;
  const bias = sign === 1 ? "BULLISH" : "BEARISH";
  return {
    direction,
    confidence: 90,
    reasons: ["Aligned trend"],
    timeframe: "15-minute",
    suggestedEntry: 23500,
    suggestedTarget: 23560,
    suggestedStopLoss: 23480,
    riskRewardRatio: 3,
    metrics: {
      trend15m: bias,
      trendStrength: 80,
      priceVelocity: sign * 2,
      broadSentiment: sign * 40,
      callPutRatio: 1.2,
      optionFlow: bias,
      optionFlowStrength: 50,
      momentumScore: sign * 50,
      accelerationRatio: 1,
      callBuyPressure: sign * 40,
      putBuyPressure: -sign * 40,
      oiExpanding: true,
      support: 23450,
      resistance: 23550,
      volatility: 0.2,
      volatilityTrend: "STABLE",
      overallConfidence: 90,
      signalStrength: "STRONG"
    }
  };
}
function history(at = AT, direction = "LONG") {
  const sign = direction === "LONG" ? 1 : -1;
  return Array.from({ length: 16 }, (_, i) => {
    const timestamp = at - i * MINUTE2;
    return {
      time: new Date(timestamp).toISOString(),
      timestamp,
      niftyLtp: 23500 + sign * (2 * (at - AT) / MINUTE2 - i * 2),
      ptsChg: sign * 30,
      overallSent: sign * 40,
      adv: 35,
      dec: 15,
      stockSent: sign * 40,
      callSent: sign * 30,
      putSent: -sign * 30,
      pcr: 1.2,
      optionsSent: sign * 60,
      callsBuyQty: 200,
      callsSellQty: 100,
      putsBuyQty: 100,
      putsSellQty: 200,
      callsOI: 1e3,
      putsOI: 1200
    };
  });
}
function input(at = AT, direction = "LONG") {
  const rows = history(at, direction);
  return {
    now: at,
    running: true,
    signal: signal(direction),
    signalAt: at,
    history: rows,
    spot: rows[0].niftyLtp,
    orders: [],
    openPositions: 0,
    premium: 100,
    quantity: 75,
    targetPct: 30,
    stopPct: 10,
    minConfidence: 80,
    brokerage: 20,
    requireVision: false,
    vision: null
  };
}
function confirmed(at = AT, direction = "LONG") {
  return { direction, firstAt: at - 2 * MINUTE2, lastAt: at - MINUTE2, observations: 2 };
}
function blocked(i, reason, previous = confirmed(i.now)) {
  const result = evaluateMomentumEntry(i, previous);
  import_strict.default.equal(result.ready, false, result.reason);
  import_strict.default.equal(result.candidate, null, "a denial must discard accumulated confirmation");
  import_strict.default.match(result.reason, reason);
  return result;
}
function order(overrides = {}) {
  return {
    id: "test-order",
    symbol: CE,
    side: "BUY",
    type: "MARKET",
    quantity: 75,
    productType: "INTRADAY",
    status: "FILLED",
    filledQty: 75,
    avgPrice: 100,
    timestamp: AT - 30 * MINUTE2,
    ...overrides
  };
}
function trip(exitAt, exitPrice = 120, symbol = CE, qty = 75) {
  return [
    order({
      id: `${symbol}-${exitAt}-buy`,
      symbol,
      timestamp: exitAt - MINUTE2,
      quantity: qty,
      filledQty: qty
    }),
    order({
      id: `${symbol}-${exitAt}-sell`,
      symbol,
      side: "SELL",
      timestamp: exitAt,
      avgPrice: exitPrice,
      quantity: qty,
      filledQty: qty
    })
  ];
}
function vision(at = AT, bias = "bullish") {
  return {
    id: "test-capture",
    manual: false,
    startedAt: new Date(at - MINUTE2).toISOString(),
    finishedAt: new Date(at).toISOString(),
    durationMs: MINUTE2,
    shots: [
      { id: "chart", label: "Chart", url: "https://example.invalid/chart", ok: true },
      { id: "oi", label: "OI", url: "https://example.invalid/oi", ok: true }
    ],
    analysis: {
      ok: true,
      parsed: {
        readable: true,
        bias,
        confidence: 85,
        spot_estimate: "23500",
        timeframe_seen: "15m",
        price_action: "Directional trend",
        supports: ["23450"],
        resistances: ["23550"],
        oi_read: "Aligned",
        highest_call_oi_strike: "23600",
        highest_put_oi_strike: "23400",
        expected_range: "23450-23550",
        combined_view: "Aligned",
        watch_for: [],
        risks: []
      }
    }
  };
}
for (const direction of ["LONG", "SHORT"]) {
  test(`${direction}: three distinct snapshots over two actual minutes confirm`, () => {
    let candidate = null;
    for (let minute = 0; minute <= 2; minute++) {
      const now = AT + minute * MINUTE2;
      const result = evaluateMomentumEntry(input(now, direction), candidate);
      import_strict.default.equal(result.ready, minute === 2, result.reason);
      import_strict.default.deepEqual(result.candidate, {
        direction,
        firstAt: AT,
        lastAt: now,
        observations: minute + 1
      });
      candidate = result.candidate;
    }
  });
  test(`${direction}: actual generator and ATM estimator reach a default paper entry`, () => {
    const sign = direction === "LONG" ? 1 : -1;
    const optionType = direction === "LONG" ? "CE" : "PE";
    let candidate = null;
    for (let minute = 0; minute <= 2; minute++) {
      const now = AT + minute * MINUTE2;
      const rows = history(now, direction).map((row, index) => ({
        ...row,
        niftyLtp: 23500 + sign * (minute * 8 - 16 - index * 8),
        overallSent: sign * 95,
        stockSent: sign * 95,
        adv: sign === 1 ? 49 : 1,
        dec: sign === 1 ? 1 : 49,
        callSent: sign * 95,
        putSent: -sign * 95,
        optionsSent: sign * 95,
        pcr: sign === 1 ? 1.2 : 0.8,
        callsBuyQty: sign === 1 ? 195 : 5,
        callsSellQty: sign === 1 ? 5 : 195,
        putsBuyQty: sign === 1 ? 5 : 195,
        putsSellQty: sign === 1 ? 195 : 5,
        callsOI: 2e3 + minute * 10 - index * 10,
        putsOI: 2e3 + minute * 10 - index * 10
      }));
      const spot = rows[0].niftyLtp;
      const generated = EnhancedSignalGenerator.generateSignal(rows, 23300, 23700, spot);
      const strike = Math.round(spot / 50) * 50;
      const premium = estimateOptionPremium(spot, strike, optionType);
      import_strict.default.equal(generated.direction, direction);
      import_strict.default.ok(generated.confidence >= 80, `generated confidence ${generated.confidence}`);
      import_strict.default.ok(premium >= 79 && premium <= 80, `near-ATM premium ${premium}`);
      const result = evaluateMomentumEntry({
        ...input(now, direction),
        tradingMode: "PAPER",
        history: rows,
        spot,
        signal: generated,
        signalAt: rows[0].timestamp,
        premium,
        quantity: 75,
        targetPct: 25,
        stopPct: 15,
        brokerage: 20
      }, candidate);
      import_strict.default.equal(result.ready, minute === 2, result.reason);
      import_strict.default.deepEqual(result.candidate, {
        direction,
        firstAt: AT,
        lastAt: now,
        observations: minute + 1
      });
      import_strict.default.ok(
        result.netRiskReward >= 1.3 && result.netRiskReward < 1.4,
        `default net R:R ${result.netRiskReward}`
      );
      candidate = result.candidate;
    }
  });
}
test("LIVE entries are disabled and cannot accumulate confirmation; PAPER and omitted mode pass", () => {
  for (const direction of ["LONG", "SHORT"]) {
    let candidate = confirmed(AT, direction);
    for (let minute = 0; minute <= 2; minute++) {
      const result = evaluateMomentumEntry({
        ...input(AT + minute * MINUTE2, direction),
        tradingMode: "LIVE"
      }, candidate);
      import_strict.default.equal(result.ready, false);
      import_strict.default.equal(result.candidate, null);
      import_strict.default.match(result.reason, /LIVE Momentum entries disabled/);
      candidate = result.candidate;
    }
    const paper = { ...input(AT + 3 * MINUTE2, direction), tradingMode: "PAPER" };
    const restarted = evaluateMomentumEntry(paper, candidate);
    import_strict.default.equal(restarted.ready, false);
    import_strict.default.equal(restarted.candidate?.observations, 1);
    import_strict.default.equal(evaluateMomentumEntry(paper, confirmed(paper.now, direction)).ready, true);
    import_strict.default.equal(evaluateMomentumEntry(input(AT, direction), confirmed(AT, direction)).ready, true);
  }
});
test("re-evaluating the same snapshot does not count, even as wall time advances", () => {
  const first = evaluateMomentumEntry(input(), null);
  for (const elapsed of [0, 1e3, 3e4, 9e4]) {
    const repeat = evaluateMomentumEntry({ ...input(), now: AT + elapsed }, first.candidate);
    import_strict.default.deepEqual(repeat.candidate, first.candidate);
    import_strict.default.equal(repeat.ready, false);
  }
  blocked({ ...input(), now: AT + 90001 }, /fresh timestamped/);
});
test("three observations still need two minutes; two observations are insufficient", () => {
  let candidate = null;
  for (const elapsed of [0, 3e4, 6e4, 119999, 12e4]) {
    const result2 = evaluateMomentumEntry(input(AT + elapsed), candidate);
    import_strict.default.equal(result2.ready, elapsed === 12e4, result2.reason);
    candidate = result2.candidate;
  }
  const sparse = {
    direction: "LONG",
    firstAt: AT - 2 * MINUTE2,
    lastAt: AT - MINUTE2,
    observations: 1
  };
  const result = evaluateMomentumEntry(input(), sparse);
  import_strict.default.equal(result.candidate?.observations, 2);
  import_strict.default.equal(result.ready, false);
});
test("new snapshot needs a matching fresh scan, and clears the old candidate", () => {
  const old = evaluateMomentumEntry(input(), null).candidate;
  const next = input(AT + MINUTE2);
  const denied = blocked({ ...next, signalAt: AT }, /fresh signal scan/, old);
  const restarted = evaluateMomentumEntry(next, denied.candidate);
  import_strict.default.equal(restarted.candidate?.observations, 1);
  import_strict.default.equal(restarted.candidate?.firstAt, next.now);
});
test("stop, neutral and missing signal reset confirmation", () => {
  const neutral = signal();
  neutral.direction = "NEUTRAL";
  for (const patch of [{ running: false }, { signal: neutral }, { signal: null }]) {
    const denied = blocked({ ...input(), ...patch }, /stopped|No directional/);
    import_strict.default.equal(evaluateMomentumEntry(input(AT + MINUTE2), denied.candidate).candidate?.observations, 1);
  }
});
test("reversal, out-of-order evidence and long confirmation gaps start over", () => {
  for (const [current, previous] of [
    [input(AT, "SHORT"), confirmed()],
    [input(), { ...confirmed(), lastAt: AT + 1 }],
    [input(), { ...confirmed(), lastAt: AT - 90001 }]
  ]) {
    const result = evaluateMomentumEntry(current, previous);
    import_strict.default.equal(result.ready, false);
    import_strict.default.deepEqual(result.candidate, {
      direction: current.signal.direction,
      firstAt: AT,
      lastAt: AT,
      observations: 1
    });
  }
});
test("weekday entry window excludes opening noise, cutoff and weekends", () => {
  for (const date of [
    "2026-09-16T09:29:59+05:30",
    "2026-09-16T15:00:00+05:30",
    "2026-09-19T11:00:00+05:30",
    "2026-09-20T11:00:00+05:30"
  ]) blocked(input(Date.parse(date)), /Entry window/);
  for (const date of ["2026-09-16T09:30:00+05:30", "2026-09-16T14:59:59+05:30"]) {
    const now = Date.parse(date);
    import_strict.default.equal(evaluateMomentumEntry(input(now), confirmed(now)).ready, true);
  }
});
for (const symbol of [CE, PE]) {
  for (const [exitPrice, cooldownMinutes, reason] of [
    [120, 5, /Post-exit cooldown/],
    [100, 15, /Post-loss cooldown/]
  ]) {
    test(`${symbol}: JSON-reloaded ${cooldownMinutes}m cooldown blocks either direction`, () => {
      const exitAt = AT - cooldownMinutes * MINUTE2 + 1e3;
      const orders = JSON.parse(JSON.stringify(trip(exitAt, exitPrice, symbol)));
      const boundary = exitAt + cooldownMinutes * MINUTE2;
      for (const direction of ["LONG", "SHORT"]) {
        const denied = blocked({ ...input(AT, direction), orders }, reason, confirmed(AT, direction));
        blocked({ ...input(boundary, direction), orders }, /new market evidence/);
        const fresh = evaluateMomentumEntry(
          { ...input(boundary + 1, direction), orders },
          denied.candidate
        );
        import_strict.default.equal(fresh.ready, false);
        import_strict.default.equal(fresh.candidate?.observations, 1);
        const retained = evaluateMomentumEntry(
          { ...input(boundary + 1, direction), orders },
          confirmed(boundary, direction)
        );
        import_strict.default.equal(retained.candidate?.observations, 1);
        let candidate = fresh.candidate;
        for (let minute = 1; minute <= 2; minute++) {
          const result = evaluateMomentumEntry({
            ...input(boundary + 1 + minute * MINUTE2, direction),
            orders
          }, candidate);
          import_strict.default.equal(result.ready, minute === 2, result.reason);
          candidate = result.candidate;
        }
      }
    });
  }
}
test("open positions and pending, acknowledged or partially filled orders erase confirmation", () => {
  const patches = [
    { openPositions: 1 },
    ...["PENDING", "PLACED", "PARTIAL"].flatMap((status) => ["BUY", "SELL"].map((side) => ({
      orders: [order({ status, side, brokerOrderId: "acknowledged", timestamp: AT - MINUTE2 })]
    })))
  ];
  for (const patch of patches) {
    let candidate = confirmed();
    for (let minute = 0; minute < 3; minute++) {
      const result = evaluateMomentumEntry({ ...input(AT + minute * MINUTE2), ...patch }, candidate);
      import_strict.default.match(result.reason, /already open/);
      import_strict.default.equal(result.ready, false);
      import_strict.default.equal(result.candidate, null);
      candidate = result.candidate;
    }
    const released = evaluateMomentumEntry(input(AT + 3 * MINUTE2), candidate);
    import_strict.default.equal(released.candidate?.observations, 1);
    import_strict.default.equal(released.ready, false);
  }
});
test("two consecutive NET losses stop the day, including gross-flat trades", () => {
  import_strict.default.ok(computeCharges(100, 75, "BUY", 20).total + computeCharges(100, 75, "SELL", 20).total > 0);
  const orders = [
    ...trip(AT - 50 * MINUTE2, 100, CE),
    ...trip(AT - 20 * MINUTE2, 100, PE)
  ];
  blocked({ ...input(), orders }, /2 consecutive net losses/);
  const reset = [
    ...trip(AT - 80 * MINUTE2, 100),
    ...trip(AT - 50 * MINUTE2, 120, PE),
    ...trip(AT - 20 * MINUTE2, 100)
  ];
  import_strict.default.equal(evaluateMomentumEntry({ ...input(), orders: reset }, confirmed()).ready, true);
});
test("four filled buys hit the daily limit; rejected attempts and yesterday do not", () => {
  const orders = [80, 60, 40, 20].flatMap((minutes) => trip(AT - minutes * MINUTE2));
  blocked({ ...input(), orders }, /Daily limit: 4/);
  const three = orders.slice(0, 6);
  const ignored = [
    order({ status: "REJECTED" }),
    order({ status: "CANCELLED" }),
    ...trip(AT - 24 * 60 * MINUTE2)
  ];
  import_strict.default.equal(evaluateMomentumEntry({ ...input(), orders: [...three, ...ignored] }, confirmed()).ready, true);
});
test("custom daily entry limits apply to the existing count without resetting it", () => {
  const orders = [80, 60, 40, 20].flatMap((minutes) => trip(AT - minutes * MINUTE2));
  blocked({ ...input(), orders, maxDailyTrades: 2 }, /Daily limit: 2/);
  blocked({ ...input(), orders, maxDailyTrades: 4 }, /Daily limit: 4/);
  for (const maxDailyTrades of [5, 8, 100, Number.MAX_SAFE_INTEGER]) {
    import_strict.default.equal(evaluateMomentumEntry({ ...input(), orders, maxDailyTrades }, confirmed()).ready, true);
  }
  blocked({ ...input(), orders: orders.slice(0, 2), maxDailyTrades: 1 }, /Daily limit: 1/);
  import_strict.default.equal(evaluateMomentumEntry({ ...input(), maxDailyTrades: 1 }, confirmed()).ready, true);
});
test("invalid custom daily limits cannot disable the entry cap", () => {
  for (const maxDailyTrades of [0, -1, 1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    blocked({ ...input(), maxDailyTrades }, /Invalid daily entry limit/);
  }
});
test("raising the daily limit does not bypass cooldown or loss protections", () => {
  blocked({ ...input(), maxDailyTrades: 100, orders: trip(AT - MINUTE2) }, /Post-exit cooldown/);
  blocked({
    ...input(),
    maxDailyTrades: 100,
    orders: [...trip(AT - 50 * MINUTE2, 100), ...trip(AT - 20 * MINUTE2, 100, PE)]
  }, /2 consecutive net losses/);
  blocked({ ...input(), maxDailyTrades: 100, orders: trip(AT - 20 * MINUTE2, 70) }, /Daily net loss limit/);
});
test("daily NET loss and planned stop risk respect the remaining daily budget", () => {
  blocked({ ...input(), orders: trip(AT - 20 * MINUTE2, 70) }, /Daily net loss limit/);
  const loss = trip(AT - 20 * MINUTE2, 80);
  const result = evaluateMomentumEntry({ ...input(), orders: loss, quantity: 25 }, confirmed());
  import_strict.default.equal(result.ready, true, result.reason);
  blocked({ ...input(), orders: loss }, /remaining daily loss budget/);
  blocked({ ...input(), quantity: 200 }, /remaining daily loss budget/);
  blocked({ ...input(), orders: trip(AT - 20 * MINUTE2, 0) }, /unpriced fill/);
});
test("rejected/cancelled entry attempts consume snapshots and impose a retry delay", () => {
  for (const status of ["REJECTED", "CANCELLED"]) {
    const orders = [order({ status, timestamp: AT, avgPrice: 0, filledQty: 0 })];
    blocked({ ...input(AT + 59999), orders }, /Entry attempt consumed/);
    blocked({ ...input(), now: AT + MINUTE2, orders }, /new market evidence/);
    const next = evaluateMomentumEntry({ ...input(AT + MINUTE2), orders }, confirmed());
    import_strict.default.equal(next.ready, false);
    import_strict.default.equal(next.candidate?.observations, 1);
    import_strict.default.equal(next.candidate?.firstAt, AT + MINUTE2);
  }
});
test("missing, stale, future and prior-day snapshots are rejected", () => {
  for (const timestamp of [void 0, NaN, AT - 90001, AT + 1, AT - 24 * 60 * MINUTE2]) {
    const i = input();
    i.history[0].timestamp = timestamp;
    blocked(i, /fresh timestamped/);
  }
  blocked({ ...input(), history: [] }, /fresh timestamped/);
  for (const spot of [null, NaN, Infinity, 0, -1]) {
    blocked({ ...input(), spot }, /fresh timestamped/);
  }
  import_strict.default.equal(evaluateMomentumEntry({ ...input(), now: AT + 9e4 }, confirmed()).ready, true);
});
test("history needs fifteen elapsed minutes, not fifteen samples", () => {
  const dense = input();
  dense.history.forEach((row, i) => {
    row.timestamp = AT - i * 1e4;
  });
  blocked(dense, /Warming up/);
  blocked({ ...input(), history: history().slice(0, 15) }, /Warming up/);
  import_strict.default.equal(evaluateMomentumEntry(input(), confirmed()).ready, true);
});
test("a single dropped snapshot is tolerated; a stalled feed is not", () => {
  const oneDropped = input();
  oneDropped.history.splice(8, 1);
  import_strict.default.equal(
    evaluateMomentumEntry(oneDropped, confirmed()).ready,
    true,
    "a single dropped beat (2m hole) must still confirm"
  );
  const stalled = input();
  stalled.history.splice(8, 3);
  blocked(stalled, /Price path unmeasurable/);
});
test("the efficiency floor is policy-driven and reports what it measured", () => {
  import_strict.default.equal(
    MOMENTUM_POLICY.minPathEfficiency,
    0.3,
    "deliberate loosening from 0.40 on October 2026 logs evidence; see the policy comment"
  );
  const choppy = input();
  choppy.history.forEach((row, i) => {
    row.niftyLtp = 23500 - i * 2 + (i >= 6 && i % 2 ? 12 : 0);
  });
  const r = blocked(choppy, /directional efficiency \d+% below 30%/);
  import_strict.default.ok(/efficiency \d+%/.test(r.reason), `expected a measured %, got: ${r.reason}`);
});
test("a hole cannot block the move-alignment test", () => {
  const flat = input();
  flat.history.splice(8, 1);
  flat.history.forEach((r) => {
    r.niftyLtp = 23500;
  });
  blocked(flat, /Wait for aligned/);
});
test("a hole makes the efficiency test stricter, never looser", () => {
  const intact = input();
  const holed = input();
  holed.history.splice(8, 1);
  const eff = (i) => {
    const r = evaluateMomentumEntry(i, confirmed());
    return r;
  };
  import_strict.default.equal(eff(intact).ready, true, "intact window confirms");
  import_strict.default.equal(eff(holed).ready, true, "holed window still confirms on a clean trend");
});
test("a sparse window cannot confirm even when every gap is legal", () => {
  const sparse = input();
  sparse.history = history().slice(0, 9);
  sparse.history.forEach((row, i) => {
    row.timestamp = AT - i * 2 * MINUTE2;
  });
  blocked(sparse, /Sparse market history/);
});
test("history gaps, duplicate/out-of-order rows and corrupt prices cannot confirm", () => {
  const duplicate = input();
  duplicate.history.splice(8, 0, { ...duplicate.history[8] });
  blocked(duplicate, /duplicate or out-of-order/);
  const unordered = input();
  [unordered.history[8], unordered.history[9]] = [unordered.history[9], unordered.history[8]];
  blocked(unordered, /duplicate or out-of-order/);
  const priorDay = input();
  priorDay.history[8].timestamp = AT - 24 * 60 * MINUTE2;
  blocked(priorDay, /Warming up|previous-session/);
  for (const niftyLtp of [0, -1, NaN, Infinity]) {
    const corrupt = input();
    corrupt.history[8].niftyLtp = niftyLtp;
    blocked(corrupt, /Invalid or previous-session/);
  }
});
test("each of 1m, 5m and 15m must align in both directions", () => {
  for (const direction of ["LONG", "SHORT"]) {
    const sign = direction === "LONG" ? 1 : -1;
    for (const [index, move] of [[1, 0], [1, -1], [5, 4.99], [15, 7.99]]) {
      const i = input(AT, direction);
      i.history[index].niftyLtp = i.history[0].niftyLtp - sign * move;
      blocked(i, /aligned 1m, 5m and 15m/);
    }
  }
});
test("choppy paths and contradictory breadth, momentum or option flow are blocked", () => {
  const choppy = input();
  choppy.history[2].niftyLtp += 40;
  blocked(choppy, /Choppy price path/);
  const patches = [
    { broadSentiment: 4.99 },
    { broadSentiment: -40 },
    { broadSentiment: NaN },
    { momentumScore: 14.99 },
    { momentumScore: -50 },
    { momentumScore: Infinity },
    { optionFlowStrength: NaN }
  ];
  for (const patch of patches) {
    const s = signal();
    Object.assign(s.metrics, patch);
    blocked({ ...input(), signal: s }, /Breadth and momentum/);
  }
});
test("option flow never vetoes an entry, in any direction or strength", () => {
  for (const direction of ["LONG", "SHORT"]) {
    const opposing = direction === "LONG" ? "BEARISH" : "BULLISH";
    for (const patch of [
      { optionFlow: opposing, optionFlowStrength: 90 },
      { optionFlow: "NEUTRAL", optionFlowStrength: 0 },
      { optionFlow: "NEUTRAL", optionFlowStrength: 3 }
    ]) {
      const s = signal(direction);
      Object.assign(s.metrics, patch);
      import_strict.default.equal(
        evaluateMomentumEntry({ ...input(AT, direction), signal: s }, confirmed(AT, direction)).ready,
        true,
        `${direction}: optionFlow ${patch.optionFlow}/${patch.optionFlowStrength} must not veto a clean setup`
      );
    }
  }
});
test("confidence has a policy floor and honors a stricter configured threshold", () => {
  for (const confidence of [MOMENTUM_POLICY.minConfidence - 0.01, NaN, Infinity]) {
    blocked({ ...input(), minConfidence: 10, signal: { ...signal(), confidence } }, /Signal score/);
  }
  blocked({ ...input(), minConfidence: 95 }, /below 95/);
  import_strict.default.equal(evaluateMomentumEntry({
    ...input(),
    signal: { ...signal(), confidence: 80 }
  }, confirmed()).ready, true);
});
test("non-finite minimum confidence fails closed instead of bypassing the score floor", () => {
  for (const minConfidence of [NaN, Infinity, -Infinity]) {
    for (const confidence of [0, 90]) {
      blocked({
        ...input(),
        minConfidence,
        signal: { ...signal(), confidence }
      }, /Invalid minimum signal score/);
    }
  }
});
test("anti-chase rejects a last-minute spike or spot detached from the snapshot", () => {
  const spike = input();
  spike.history[0].niftyLtp += 11;
  spike.spot = spike.history[0].niftyLtp;
  blocked(spike, /do not chase/);
  for (const deviation of [-8.01, 8.01]) {
    blocked({ ...input(), spot: 23500 + deviation }, /do not chase/);
  }
  import_strict.default.equal(evaluateMomentumEntry({ ...input(), spot: 23508 }, confirmed()).ready, true);
});
test("net reward/risk includes both charges and adverse slippage", () => {
  const i = { ...input(), targetPct: 16 };
  const target = 116;
  const stop = 90;
  const entryCharges = computeCharges(100, 75, "BUY", 20).total;
  const rewardBeforeSlippage = 16 * 75 - entryCharges - computeCharges(target, 75, "SELL", 20).total;
  const riskBeforeSlippage = 10 * 75 + entryCharges + computeCharges(stop, 75, "SELL", 20).total;
  import_strict.default.ok(i.targetPct / i.stopPct > 1.3);
  import_strict.default.ok(rewardBeforeSlippage / riskBeforeSlippage > 1.3, "slippage is what tips this setup below the floor");
  const expected = (rewardBeforeSlippage - (100 + target) * 75 * 5e-3) / (riskBeforeSlippage + (100 + stop) * 75 * 5e-3);
  const result = blocked(i, /below 1\.3 after charges and slippage/);
  import_strict.default.ok(Math.abs(result.netRiskReward - expected) < 1e-12);
  import_strict.default.ok(expected < 1.3);
  blocked({ ...input(), brokerage: 500 }, /after charges and slippage/);
});
test("invalid execution and risk settings fail closed", () => {
  const cases = [
    { premium: 0 },
    { premium: -1 },
    { premium: NaN },
    { premium: Infinity },
    { quantity: 0 },
    { quantity: -1 },
    { quantity: 1.5 },
    { quantity: NaN },
    { quantity: Infinity },
    { targetPct: 0 },
    { targetPct: -1 },
    { targetPct: NaN },
    { targetPct: Infinity },
    { stopPct: 0 },
    { stopPct: -1 },
    { stopPct: 100 },
    { stopPct: NaN },
    { stopPct: Infinity },
    { brokerage: -1 },
    { brokerage: NaN },
    { brokerage: Infinity }
  ];
  for (const patch of cases) blocked({ ...input(), ...patch }, /Invalid execution/);
  import_strict.default.equal(evaluateMomentumEntry({ ...input(), brokerage: 0 }, confirmed()).ready, true);
});
test("required Vision needs readable, recent, successful captures", () => {
  blocked({ ...input(), requireVision: true }, /Vision required/);
  const cases = [
    ["capture older than 5m despite just finishing", (run) => {
      run.startedAt = new Date(AT - 5 * MINUTE2 - 1).toISOString();
    }],
    ["future capture", (run) => {
      run.startedAt = new Date(AT + 1).toISOString();
    }],
    ["invalid capture timestamp", (run) => {
      run.startedAt = "not-a-date";
    }],
    ["unreadable", (run) => {
      run.analysis.parsed.readable = false;
    }],
    ["missing verdict", (run) => {
      run.analysis.parsed = null;
    }],
    ["low confidence", (run) => {
      run.analysis.parsed.confidence = 69.99;
    }],
    ["invalid confidence", (run) => {
      run.analysis.parsed.confidence = NaN;
    }],
    ["no screenshots", (run) => {
      run.shots = [];
    }],
    ["one failed screenshot", (run) => {
      run.shots[1].ok = false;
    }],
    ["login page", (run) => {
      run.shots[1].awaitingLogin = true;
    }],
    ["analysis error", (run) => {
      run.analysis.ok = false;
      run.analysis.error = "model unavailable";
    }],
    ["skipped analysis", (run) => {
      run.analysis.skipped = true;
    }]
  ];
  for (const [label, mutate] of cases) {
    const run = vision();
    mutate(run);
    const result = blocked({ ...input(), requireVision: true, vision: run }, /Vision required/);
    import_strict.default.equal(result.ready, false, label);
  }
  blocked({
    ...input(),
    requireVision: true,
    vision: vision(),
    visionError: "capture service offline"
  }, /Vision required: capture service offline/);
});
test("required Vision rejects opposing, choppy and neutral opinions", () => {
  for (const bias of ["bearish", "choppy", "neutral"]) {
    blocked({ ...input(), requireVision: true, vision: vision(AT, bias) }, /Vision does not agree/);
  }
  blocked({
    ...input(AT, "SHORT"),
    requireVision: true,
    vision: vision()
  }, /Vision does not agree/);
});
test("aligned required Vision passes at the capture-age and confidence boundaries", () => {
  for (const direction of ["LONG", "SHORT"]) {
    const run = vision(AT, direction === "LONG" ? "bullish" : "bearish");
    run.startedAt = new Date(AT - 5 * MINUTE2).toISOString();
    run.analysis.parsed.confidence = 70;
    const result = evaluateMomentumEntry({
      ...input(AT, direction),
      requireVision: true,
      vision: run
    }, confirmed(AT, direction));
    import_strict.default.equal(result.ready, true, result.reason);
  }
});
test("optional Vision cannot veto an otherwise confirmed entry", () => {
  const failed = vision(AT - 60 * MINUTE2, "bearish");
  failed.analysis.ok = false;
  failed.shots[0].awaitingLogin = true;
  for (const run of [null, failed, vision(AT, "neutral"), vision(AT, "choppy")]) {
    import_strict.default.equal(evaluateMomentumEntry({
      ...input(),
      vision: run,
      visionError: "offline",
      requireVision: false
    }, confirmed()).ready, true);
  }
});
test("pairRoundTrips sorts without mutation, filters day/status and preserves fill quantities", () => {
  const fills = trip(AT - 20 * MINUTE2);
  const pe = trip(AT - 10 * MINUTE2, 110, PE, 25);
  const orphan = order({ side: "SELL", symbol: "unmatched", timestamp: AT });
  const open = order({ symbol: "still-open", timestamp: AT });
  const ignored = [
    ...trip(AT - 24 * 60 * MINUTE2),
    order({ symbol: "rejected", status: "REJECTED" }),
    order({ symbol: "partial", status: "PARTIAL" })
  ];
  const orders = [pe[1], orphan, fills[1], open, pe[0], ...ignored, fills[0]];
  const before = structuredClone(orders);
  import_strict.default.deepEqual(pairRoundTrips(orders, istDayKey(AT)), [
    { symbol: CE, entry: 100, exit: 120, qty: 75, at: AT - 21 * MINUTE2, closedAt: AT - 20 * MINUTE2 },
    { symbol: PE, entry: 100, exit: 110, qty: 25, at: AT - 11 * MINUTE2, closedAt: AT - 10 * MINUTE2 }
  ]);
  import_strict.default.deepEqual(orders, before);
  const fallback = trip(AT);
  fallback[0].filledQty = 0;
  import_strict.default.equal(pairRoundTrips(fallback, istDayKey(AT))[0].qty, 75);
  const replacement = [
    order({ timestamp: AT - 3 * MINUTE2, avgPrice: 80 }),
    ...trip(AT, 120, CE, 25),
    order({ side: "SELL", timestamp: AT + MINUTE2, avgPrice: 130 })
  ];
  import_strict.default.deepEqual(pairRoundTrips(replacement, istDayKey(AT)), [
    { symbol: CE, entry: 100, exit: 120, qty: 25, at: AT - MINUTE2, closedAt: AT }
  ]);
});
test("the gate checklist covers every gate, in order, exactly once", () => {
  const ids = MOMENTUM_GATES.map((g) => g.id);
  import_strict.default.equal(new Set(ids).size, ids.length, "gate ids must be unique");
  const checks = evaluateMomentumEntry(input(), confirmed()).checks;
  import_strict.default.deepEqual(checks.map((c) => c.id), ids, "checklist order must match MOMENTUM_GATES");
  import_strict.default.ok(MOMENTUM_GATES.every((g) => g.label.length > 0), "every gate needs a human label");
});
test("a confirmed entry reports every gate passed and nothing blocking", () => {
  const gate = evaluateMomentumEntry(input(), confirmed());
  import_strict.default.equal(gate.ready, true, gate.reason);
  import_strict.default.equal(gate.blockedBy, null);
  import_strict.default.ok(gate.checks.every((c) => c.status === "pass" || c.status === "skip"), "no blocks when ready");
  import_strict.default.equal(gate.checks.filter((c) => c.status === "block").length, 0);
});
test("exactly one gate blocks, earlier gates pass and later gates are not reached", () => {
  const weak = input();
  weak.signal = { ...signal(), confidence: 10 };
  const gate = evaluateMomentumEntry(weak, confirmed());
  import_strict.default.equal(gate.ready, false);
  import_strict.default.equal(gate.blockedBy, "score");
  const blocks = gate.checks.filter((c) => c.status === "block");
  import_strict.default.equal(blocks.length, 1, "the guard stops at the first failure");
  import_strict.default.equal(blocks[0].id, "score");
  import_strict.default.match(blocks[0].detail ?? "", /Signal score below/);
  import_strict.default.equal(blocks[0].detail, gate.reason, "the blocking detail is the reason shown in the log");
  const at = (id) => gate.checks.findIndex((c) => c.id === id);
  import_strict.default.ok(gate.checks.slice(0, at("score")).every((c) => c.status === "pass" || c.status === "skip"));
  import_strict.default.ok(
    gate.checks.slice(at("score") + 1).every((c) => c.status === "pending"),
    "gates after the block were never evaluated and must not claim to have passed"
  );
});
test("Vision is skipped when off and a real gate when on", () => {
  const off = evaluateMomentumEntry(input(), confirmed());
  import_strict.default.equal(off.checks.find((c) => c.id === "vision")?.status, "skip");
  const on = input();
  on.requireVision = true;
  const gate = evaluateMomentumEntry(on, confirmed());
  import_strict.default.equal(gate.blockedBy, "vision");
  import_strict.default.equal(gate.checks.find((c) => c.id === "vision")?.status, "block");
});
test("an outstanding multi-snapshot confirmation is reported as the blocking gate", () => {
  const gate = evaluateMomentumEntry(input(), null);
  import_strict.default.equal(gate.ready, false);
  import_strict.default.equal(gate.blockedBy, "confirmation");
  import_strict.default.match(gate.reason, /Confirming direction: 1\/3/);
  const at = gate.checks.findIndex((c) => c.id === "confirmation");
  import_strict.default.equal(at, gate.checks.length - 1, "confirmation is the last gate");
  import_strict.default.ok(
    gate.checks.slice(0, at).every((c) => c.status === "pass" || c.status === "skip"),
    "every rule passed; only the confirmation count is outstanding"
  );
});
test("blocking details quantify the price-alignment and breadth/momentum gates", () => {
  const flat = input();
  flat.history = flat.history.map((h) => ({ ...h, niftyLtp: 23500 }));
  flat.spot = 23500;
  const alignment = blocked(flat, /Wait for aligned 1m, 5m and 15m/);
  import_strict.default.equal(alignment.blockedBy, "price-alignment");
  import_strict.default.match(alignment.reason, /need >0 \/ >=5 \/ >=8/);
  const weakMomentum = input();
  weakMomentum.signal = {
    ...signal(),
    metrics: { ...signal().metrics, momentumScore: 3 }
  };
  const confirm = blocked(weakMomentum, /Breadth and momentum must both confirm/);
  import_strict.default.equal(confirm.blockedBy, "breadth-momentum");
  import_strict.default.match(confirm.reason, /momentum 3 needs >=15/);
});
test("super-trend relaxes efficiency hurdle from 0.30 to 0.20 when macro conviction aligns", () => {
  const rows = history();
  rows[0].niftyLtp = 23525;
  rows[1].niftyLtp = 23523;
  rows[5].niftyLtp = 23517;
  rows[15].niftyLtp = 23500;
  rows[2].niftyLtp = 23520;
  rows[3].niftyLtp = 23522;
  rows[4].niftyLtp = 23518;
  for (let idx = 6; idx < 15; idx++) {
    rows[idx].niftyLtp = idx % 2 === 0 ? 23512 : 23504;
  }
  const base = input();
  base.history = rows;
  base.spot = rows[0].niftyLtp;
  base.signal = {
    ...signal("LONG"),
    confidence: 80,
    metrics: { ...signal("LONG").metrics, trendStrength: 80, broadSentiment: 40 }
  };
  const normalResult = evaluateMomentumEntry(base, confirmed());
  import_strict.default.equal(normalResult.ready, false);
  import_strict.default.equal(normalResult.blockedBy, "efficiency");
  import_strict.default.match(normalResult.reason, /directional efficiency \d+% below 30%/i);
  base.signal = {
    ...signal("LONG"),
    confidence: 85,
    metrics: { ...signal("LONG").metrics, trendStrength: 90, broadSentiment: 45, trend15m: "BULLISH" }
  };
  const superResult = evaluateMomentumEntry(base, confirmed());
  import_strict.default.equal(superResult.ready, true, `Super-trend should pass with efficiency >= 20%: ${superResult.reason}`);
});
test("fast-track confirmation permits entry on 2nd observation over 45s on super-conviction setup", () => {
  const at = AT;
  const i = input(at, "LONG");
  i.fastTrackConfirmation = true;
  i.signal = {
    ...signal("LONG"),
    confidence: 95,
    metrics: {
      ...signal("LONG").metrics,
      trendStrength: 98,
      trend15m: "BULLISH",
      broadSentiment: 60
    }
  };
  const step1 = evaluateMomentumEntry(i, null);
  import_strict.default.equal(step1.ready, false);
  import_strict.default.equal(step1.blockedBy, "confirmation");
  import_strict.default.match(step1.reason, /Confirming direction: 1\/2/);
  import_strict.default.equal(step1.candidate?.observations, 1);
  const t2 = at + 50 * 1e3;
  const rows2 = history(t2, "LONG");
  const iStep2 = {
    ...i,
    now: t2,
    signalAt: t2,
    history: rows2,
    spot: rows2[0].niftyLtp
  };
  const step2 = evaluateMomentumEntry(iStep2, step1.candidate);
  import_strict.default.equal(step2.ready, true, `Fast-track should confirm after 2 observations: ${step2.reason}`);
  import_strict.default.equal(step2.blockedBy, null);
});
test("macro retest allowance expands move1Floor to -4.0 pts when 5m/15m displacement is massive", () => {
  const rows = history();
  rows[15].niftyLtp = 23470;
  rows[5].niftyLtp = 23482;
  rows[1].niftyLtp = 23502.5;
  rows[0].niftyLtp = 23500;
  const i = input();
  i.history = rows;
  i.spot = rows[0].niftyLtp;
  const res = evaluateMomentumEntry(i, confirmed());
  import_strict.default.notEqual(res.blockedBy, "price-alignment", `Retest wick should be tolerated under macro displacement: ${res.reason}`);
  import_strict.default.equal(res.ready, true);
});
console.log(`
${passed} Momentum entry guard regression tests passed.`);
