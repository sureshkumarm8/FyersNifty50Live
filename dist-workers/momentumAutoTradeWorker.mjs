// scripts/momentumAutoTradeWorker.ts
import { Redis } from "@upstash/redis";
import dotenv from "dotenv";

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
    if (optionFlow > 3) {
      optionFlowDirection = "BULLISH";
    } else if (optionFlow < -3) {
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
    const recent = historyLog.slice(0, 5).reverse();
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
    return {
      oiExpanding
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
  static analyzeAbsorption(history, currentSpot, callBuyPressure, putBuyPressure) {
    if (history.length < 5) {
      return { absorptionScore: 0, liquiditySweep: "NONE" };
    }
    const recentSnaps = history.slice(0, 15);
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
  static calculateTradeLevels(signal, currentPrice, srLevels, metrics) {
    if (signal.direction === "NEUTRAL") {
      return {
        entry: currentPrice,
        target: currentPrice,
        stopLoss: currentPrice
      };
    }
    const volatility = Math.max(15, metrics.volatility / 10);
    const riskPoints = volatility * 1.5;
    const rewardPoints = volatility * 2;
    if (signal.direction === "LONG") {
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
    if (backfillOwnership([...this.book.positions, ...this.book.trades])) this.persist();
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
  /** Hard stop. No exceptions. */
  hardStop: "10:15",
  /**
   * When the engine switches itself off.
   *
   * Five minutes after the hard stop, so a 10:15 exit has time to fill and be
   * logged. Past this the protocol has nothing left to do today — staying armed
   * only burns CPU on a one-second loop and risks acting on a stale read.
   */
  standDown: "10:20",
  targetPoints: 30,
  stopPoints: 30,
  /** MySystemAutoTrade uses a fixed 250-point ITM strike. */
  itmPoints: 250,
  strikeStep: 50,
  /** MySystemAutoTrade rejects live signals below this confidence. */
  minEngineConfidence: 75,
  /** MySystemAutoTrade treats price within this distance as "at the zone". */
  zoneBuffer: 30,
  /**
   * Minimum wall-to-wall room. Entry happens up to `zoneBuffer` inside the
   * zone and needs `targetPoints` of travel, so anything under 60 makes the
   * 30-point target mathematically unreachable before the opposite wall.
   */
  minZoneWidth: 60,
  /** Below this the day is technically tradable but uncomfortably tight. */
  comfortableZoneWidth: 90,
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
var HARD_STOP = hhmmToMinutes(SNIPER.hardStop);
var STAND_DOWN = hhmmToMinutes(SNIPER.standDown);
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
function evaluateMomentumEntry(input, previous) {
  const deny = (reason2, gate) => ({
    ready: false,
    reason: reason2,
    candidate: null,
    checks: buildChecks(gate, reason2, input.requireVision),
    blockedBy: gate
  });
  const { now, signal: s, history, spot } = input;
  const policy = MOMENTUM_POLICY;
  if (!input.running) return deny("Engine stopped; entry confirmation reset.", "engine-running");
  if (input.tradingMode === "LIVE") {
    return deny("LIVE Momentum entries disabled: verified option quotes and broker fill reconciliation are required.", "paper-mode");
  }
  if (!Number.isFinite(input.minConfidence)) return deny("Invalid minimum signal score.", "settings-valid");
  const maxDailyTrades = input.maxDailyTrades === void 0 ? policy.maxDailyTrades : input.maxDailyTrades;
  if (!Number.isSafeInteger(maxDailyTrades) || maxDailyTrades < 1) {
    return deny("Invalid daily entry limit; enter a positive whole number.", "settings-valid");
  }
  const minutes = istMinutesOf(new Date(now));
  if (!isMarketLive(new Date(now)) || minutes < 9 * 60 + 30 || minutes >= 15 * 60) {
    return deny("Entry window: 09:30-15:00 IST; wait outside the opening noise.", "entry-window");
  }
  if (input.openPositions > 0 || input.orders.some((o) => ["PENDING", "PLACED", "PARTIAL"].includes(o.status))) {
    return deny("Position or unconfirmed order already open.", "flat-book");
  }
  const today = istDayKey(now);
  const orders = input.orders.filter((o) => istDayKey(o.timestamp) === today);
  const buys = orders.filter((o) => o.side === "BUY" && o.status === "FILLED");
  if (buys.length >= maxDailyTrades) return deny(`Daily limit: ${maxDailyTrades} entries reached.`, "daily-limit");
  const trips = pairRoundTrips(orders, today);
  let netPnl = 0;
  let losses = 0;
  let lastNet = 0;
  for (const trip of trips) {
    if (![trip.entry, trip.exit, trip.qty].every((v) => Number.isFinite(v) && v > 0)) {
      return deny("Order book contains an unpriced fill; reconcile it before entering again.", "loss-limits");
    }
    lastNet = (trip.exit - trip.entry) * trip.qty - computeCharges(trip.entry, trip.qty, "BUY", input.brokerage).total - computeCharges(trip.exit, trip.qty, "SELL", input.brokerage).total;
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
  const latest = history[0];
  const snapshotAt = latest?.timestamp;
  if (!Number.isFinite(spot) || !(spot > 0) || !Number.isFinite(snapshotAt) || now - snapshotAt > policy.maxSnapshotAgeMs || snapshotAt > now) {
    return deny("Waiting for a fresh timestamped market snapshot (maximum age 90s).", "fresh-snapshot");
  }
  if (!s || s.direction === "NEUTRAL") return deny("No directional setup.", "directional-signal");
  if (input.signalAt !== snapshotAt) return deny("New market data arrived; waiting for a fresh signal scan.", "signal-current");
  if (snapshotAt <= lastAttempt || snapshotAt <= cooldownUntil) {
    return deny("Waiting for new market evidence after the previous trade/cooldown.", "new-evidence");
  }
  const threshold = Math.max(policy.minConfidence, input.minConfidence);
  if (!Number.isFinite(s.confidence) || s.confidence < threshold) {
    return deny(`Signal score below ${threshold}; this score is not a win probability.`, "score");
  }
  const anchor = (age) => history.find((h) => Number.isFinite(h.timestamp) && h.timestamp <= snapshotAt - age * MINUTE);
  const one = anchor(1);
  const five = anchor(5);
  const fifteen = anchor(15);
  if (!one || !five || !fifteen || snapshotAt - one.timestamp > 2.5 * MINUTE || snapshotAt - five.timestamp > 6.5 * MINUTE || snapshotAt - fifteen.timestamp > 16.5 * MINUTE) {
    return deny("Warming up: need continuous, timestamped 1m, 5m and 15m market history.", "history-anchors");
  }
  const window = history.slice(0, history.indexOf(fifteen) + 1);
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
  if (input.requireVision) {
    if (input.visionError) return deny(`Vision required: ${input.visionError}`, "vision");
    const run = input.vision;
    const verdict = run?.analysis.parsed;
    const capturedAt = run ? Date.parse(run.startedAt) : NaN;
    if (!run?.analysis.ok || run.analysis.skipped || !verdict || verdict.readable !== true || !Number.isFinite(capturedAt) || now - capturedAt > policy.maxVisionAgeMs || capturedAt > now || !Number.isFinite(verdict.confidence) || verdict.confidence < 70 || run.shots.length === 0 || run.shots.some((shot) => !shot.ok || shot.awaitingLogin)) {
      return deny("Vision required: waiting for a readable, successful chart capture less than 5m old.", "vision");
    }
    if (verdict.bias !== (sign === 1 ? "bullish" : "bearish")) {
      return deny(`Vision does not agree (${verdict.bias}); stand aside.`, "vision");
    }
  }
  const { premium, quantity, targetPct, stopPct, brokerage } = input;
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
    input.fastTrackConfirmation && s.confidence >= 90 && m.trendStrength >= 95 && m.trend15m === (sign === 1 ? "BULLISH" : "BEARISH") && sign * m.broadSentiment >= 50
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
    checks: buildChecks(ready ? null : "confirmation", reason, input.requireVision),
    blockedBy: ready ? null : "confirmation"
  };
}

// services/gammaExposure.ts
function normalPdf(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}
function calculateGamma(spot, strike, timeToExpiryYears, iv = 0.13, riskFreeRate = 0.065) {
  if (spot <= 0 || strike <= 0 || timeToExpiryYears <= 0 || iv <= 0) return 0;
  const sqrtT = Math.sqrt(timeToExpiryYears);
  const d1 = (Math.log(spot / strike) + (riskFreeRate + 0.5 * iv * iv) * timeToExpiryYears) / (iv * sqrtT);
  const pdf = normalPdf(d1);
  return pdf / (spot * iv * sqrtT);
}
function calculateGexProfile(quotes, spot, daysToExpiry = 2) {
  if (!spot || spot <= 0 || !quotes || quotes.length === 0) {
    return {
      spot: spot || 0,
      strikes: [],
      netGexTotal: 0,
      zeroGammaFlipLevel: null,
      regime: "NEUTRAL",
      majorCallWallGex: null,
      majorPutWallGex: null,
      volatilityAtm: 0.13
    };
  }
  const tYears = Math.max(0.5, daysToExpiry) / 365;
  const atmIv = 0.13;
  const strikeMap = /* @__PURE__ */ new Map();
  for (const q of quotes) {
    const sym = q.symbol || "";
    const match = /(?:NIFTY|NSE:NIFTY).*?(\d{5})(CE|PE)$/i.exec(sym);
    if (!match) continue;
    const strike = parseInt(match[1], 10);
    const type = match[2].toUpperCase();
    const oi = q.oi || 0;
    if (!strikeMap.has(strike)) {
      strikeMap.set(strike, { callOi: 0, putOi: 0 });
    }
    const cur = strikeMap.get(strike);
    if (type === "CE") cur.callOi += oi;
    else if (type === "PE") cur.putOi += oi;
  }
  const sortedStrikes = Array.from(strikeMap.keys()).sort((a, b) => a - b);
  const strikeGexList = [];
  let netGexTotal = 0;
  for (const strike of sortedStrikes) {
    const { callOi, putOi } = strikeMap.get(strike);
    if (callOi === 0 && putOi === 0) continue;
    const gamma = calculateGamma(spot, strike, tYears, atmIv);
    const scale = spot * spot * 0.01 / 1e6;
    const callGex = gamma * callOi * scale;
    const putGex = -gamma * putOi * scale;
    const netGex = callGex + putGex;
    strikeGexList.push({
      strike,
      callOi,
      putOi,
      gamma,
      callGex,
      putGex,
      netGex
    });
    netGexTotal += netGex;
  }
  let zeroGammaFlipLevel = null;
  for (let i = 0; i < strikeGexList.length - 1; i++) {
    const s1 = strikeGexList[i];
    const s2 = strikeGexList[i + 1];
    if (s1.netGex <= 0 && s2.netGex >= 0 || s1.netGex >= 0 && s2.netGex <= 0) {
      const diff = s2.netGex - s1.netGex;
      const factor = diff !== 0 ? Math.abs(s1.netGex) / Math.abs(diff) : 0.5;
      zeroGammaFlipLevel = Math.round(s1.strike + factor * (s2.strike - s1.strike));
      break;
    }
  }
  let maxCallGex = -1;
  let majorCallWall = null;
  let maxPutGex = 1;
  let majorPutWall = null;
  for (const s of strikeGexList) {
    if (s.callGex > maxCallGex) {
      maxCallGex = s.callGex;
      majorCallWall = s.strike;
    }
    if (s.putGex < maxPutGex) {
      maxPutGex = s.putGex;
      majorPutWall = s.strike;
    }
  }
  const regime = netGexTotal > 15 ? "LONG_GAMMA" : netGexTotal < -15 ? "SHORT_GAMMA" : "NEUTRAL";
  return {
    spot,
    strikes: strikeGexList,
    netGexTotal,
    zeroGammaFlipLevel,
    regime,
    majorCallWallGex: majorCallWall,
    majorPutWallGex: majorPutWall,
    volatilityAtm: atmIv
  };
}

// scripts/momentumAutoTradeWorker.ts
dotenv.config({ path: ".env.local" });
var activeCandidate = null;
async function runMomentumCycle() {
  const now = /* @__PURE__ */ new Date();
  const istTimeStr = now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: true });
  console.log(`
================================================================`);
  console.log(`\u{1F916} MOMENTUM AUTOTRADE 5-MIN CADENCE | ${istTimeStr}`);
  console.log(`================================================================`);
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  });
  try {
    const timestamps = await redis.zrange("snapshots:index", 0, 80, { rev: true });
    const snaps = [];
    let latestWithOpts = null;
    for (const ts of timestamps) {
      const raw = await redis.get("snapshot:" + ts);
      if (!raw) continue;
      const s = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (s.niftyLTP) {
        const stocksList = s.stocks || [];
        const optsList = s.options || [];
        let ceOi = 0, peOi = 0;
        optsList.forEach((o) => {
          if (o.type === "CE" || o.symbol && o.symbol.includes("CE")) ceOi += o.oi || 0;
          else if (o.type === "PE" || o.symbol && o.symbol.includes("PE")) peOi += o.oi || 0;
        });
        const snap = {
          time: s.istTime || new Date(s.timestamp).toLocaleTimeString("en-IN"),
          timestamp: s.timestamp,
          istTime: s.istTime,
          niftyLTP: s.niftyLTP,
          niftyLtp: s.niftyLTP,
          ptsChg: s.ptsChg || 0,
          overallSent: s.overallSent || 0,
          adv: s.adv || 0,
          dec: s.dec || 0,
          stockSent: s.stockSent || 0,
          callSent: s.callSent || 0,
          putSent: s.putSent || 0,
          pcr: s.pcr || (ceOi > 0 ? peOi / ceOi : 1),
          optionsSent: s.optionsSent || 0,
          callsBuyQty: s.callsBuyQty || 0,
          callsSellQty: s.callsSellQty || 0,
          putsBuyQty: s.putsBuyQty || 0,
          putsSellQty: s.putsSellQty || 0,
          callsOI: ceOi,
          putsOI: peOi,
          stocks: stocksList,
          options: optsList,
          stockCount: s.stockCount || stocksList.length,
          optionsCount: s.optionsCount || optsList.length,
          source: s.source || "frontend"
        };
        snaps.push(snap);
        if (snap.options && snap.options.length > 0 && !latestWithOpts) {
          latestWithOpts = snap;
        }
      }
    }
    for (let i = 0; i < snaps.length; i++) {
      if ((!snaps[i].options || snaps[i].options.length === 0) && latestWithOpts?.options) {
        snaps[i].options = latestWithOpts.options;
        snaps[i].optionsCount = latestWithOpts.options.length;
      }
    }
    if (snaps.length === 0) {
      console.log("\u26A0\uFE0F No market snapshots found in Redis index.");
      return;
    }
    const latest = snaps[0];
    const currentSpot = latest.niftyLTP || 0;
    const pivotSupport = Math.floor(currentSpot / 50) * 50 - 50;
    const pivotResistance = Math.ceil(currentSpot / 50) * 50 + 50;
    const signal = EnhancedSignalGenerator.generateSignal(snaps, pivotSupport, pivotResistance, currentSpot);
    const guardInput = {
      now: now.getTime(),
      signal,
      signalAt: latest.timestamp || now.getTime(),
      history: snaps,
      spot: currentSpot,
      running: true,
      tradingMode: "PAPER",
      minConfidence: MOMENTUM_POLICY.minConfidence,
      maxDailyTrades: 4,
      openPositions: 0,
      orders: [],
      premium: 120,
      quantity: 50,
      targetPct: 20,
      stopPct: 10,
      brokerage: 40,
      chargesBudget: 1e3,
      dailyPnL: 0,
      requireVision: false,
      vision: null,
      visionRun: null,
      fastTrackConfirmation: true
    };
    const guardDecision = evaluateMomentumEntry(guardInput, activeCandidate);
    activeCandidate = guardDecision.candidate;
    console.log(`\u{1F4C8} Nifty Spot: ${currentSpot.toFixed(2)} | Snapshots in Window: ${snaps.length}`);
    if (latest.options && latest.options.length > 0) {
      const gex = calculateGexProfile(latest.options, currentSpot);
      console.log(`\u26A1 GEX Positioning: Regime=[${gex.regime}] | Net GEX: ${gex.netGexTotal.toFixed(1)} Cr${gex.zeroGammaFlipLevel ? " | Zero-\u0393 Flip: " + gex.zeroGammaFlipLevel : ""}`);
    }
    console.log(`\u{1F30A} Signal Direction: ${signal.direction} | Confidence: ${signal.confidence.toFixed(1)}%`);
    console.log(`\u{1F6E1}\uFE0F Momentum Gate Status: ${guardDecision.ready ? "\u2705 READY TO EXECUTE" : "\u26D4 BLOCKED"}`);
    console.log(`   Gate Reason: ${guardDecision.reason}`);
    if (guardDecision.blockedBy) {
      console.log(`   Blocked By Gate: [${guardDecision.blockedBy}]`);
    }
    if (guardDecision.ready && guardDecision.candidate) {
      const atmStrike = Math.round(currentSpot / 50) * 50;
      const optType = guardDecision.candidate.direction === "LONG" ? "CE" : "PE";
      console.log(`\u{1F525} HIGH-CONVICTION MOMENTUM TRADE ARMED: NIFTY ${atmStrike} ${optType}`);
      console.log(`   Entry Spot: ${currentSpot} | Direction: ${guardDecision.candidate.direction} (Observed: ${guardDecision.candidate.observations}m)`);
    } else {
      console.log(`\u{1F4A4} Momentum Desk Stance: FLAT CASH / STAND DOWN`);
    }
    console.log(`================================================================
`);
  } catch (err) {
    console.error("Error in Momentum AutoTrade Cycle:", err.message);
  }
}
if (process.argv.includes("--daemon")) {
  console.log("\u{1F680} Momentum AutoTrade 5-Min Worker Started in Daemon Mode (Every 300s)...");
  runMomentumCycle();
  setInterval(runMomentumCycle, 5 * 60 * 1e3);
} else {
  runMomentumCycle();
}
