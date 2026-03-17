/**
 * Fyers WebSocket Service
 * 
 * Provides real-time market depth data for all Nifty 50 stocks
 * without REST API rate limits.
 */

import { FyersQuote } from '../types';

interface WebSocketMessage {
  T: string;  // Message Type
  SLIST?: string[];  // Symbol List
  d?: any;  // Data
}

export class FyersWebSocketService {
  private ws: WebSocket | null = null;
  private accessToken: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;
  private subscribedSymbols: Set<string> = new Set();
  private onDataCallback: ((data: FyersQuote[]) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private dataBuffer: Map<string, any> = new Map();

  constructor() {}

  /**
   * Connect to Fyers WebSocket
   */
  connect(accessToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.accessToken = accessToken;
      
      // Fyers WebSocket URL for v3
      const wsUrl = `wss://api-t1.fyers.in/socket/v3/dataSock?access_token=${accessToken}`;
      
      console.log('[WebSocket] Connecting to Fyers...');
      
      try {
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('[WebSocket] ✅ Connected to Fyers');
          this.reconnectAttempts = 0;
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
        
        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          if (this.onErrorCallback) {
            this.onErrorCallback('WebSocket connection error');
          }
          reject(error);
        };
        
        this.ws.onclose = () => {
          console.log('[WebSocket] Connection closed');
          this.attemptReconnect();
        };
        
      } catch (error) {
        console.error('[WebSocket] Failed to create connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Subscribe to symbols for depth data
   */
  subscribe(symbols: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Not connected, cannot subscribe');
      return;
    }

    // Add to subscribed set
    symbols.forEach(sym => this.subscribedSymbols.add(sym));

    // Subscribe to depth data (DP mode)
    const message: WebSocketMessage = {
      T: 'SUB_DP',
      SLIST: symbols
    };

    this.ws.send(JSON.stringify(message));
    console.log(`[WebSocket] Subscribed to ${symbols.length} symbols`);
  }

  /**
   * Unsubscribe from symbols
   */
  unsubscribe(symbols: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    symbols.forEach(sym => this.subscribedSymbols.delete(sym));

    const message: WebSocketMessage = {
      T: 'UNSUB_DP',
      SLIST: symbols
    };

    this.ws.send(JSON.stringify(message));
    console.log(`[WebSocket] Unsubscribed from ${symbols.length} symbols`);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      // Handle depth data updates
      if (message.T === 'DP' && message.d) {
        this.processDepthData(message.d);
      }
      
      // Handle connection acknowledgment
      if (message.T === 'cn') {
        console.log('[WebSocket] Connection acknowledged');
      }
      
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  }

  /**
   * Process depth data and convert to FyersQuote format
   */
  private processDepthData(data: any): void {
    // Fyers WebSocket sends data in specific format
    // Update buffer with latest data
    const symbol = data.symbol || data.s;
    if (symbol) {
      this.dataBuffer.set(symbol, data);
    }

    // Convert buffered data to FyersQuote format
    const quotes: FyersQuote[] = [];
    
    this.dataBuffer.forEach((info, symbol) => {
      quotes.push({
        symbol: symbol,
        short_name: symbol.split(':')[1]?.replace('-EQ', '') || symbol,
        exchange: symbol.split(':')[0] || 'NSE',
        description: symbol,
        original_name: symbol,
        fyToken: '',
        tt: info.ltt || info.tt || Date.now() / 1000,
        
        // Price Data
        lp: info.ltp || info.lp || 0,
        open_price: info.open_price || info.o || 0,
        high_price: info.high_price || info.h || 0,
        low_price: info.low_price || info.l || 0,
        prev_close_price: info.prev_close_price || info.prev_close || info.c || 0,
        volume: info.volume || info.v || 0,
        
        // Change Data
        ch: info.ch || 0,
        chp: info.chp || 0,
        
        // Depth Data (KEY BENEFIT OF WEBSOCKET)
        total_buy_qty: info.totalbuyqty || info.total_buy_qty || 0,
        total_sell_qty: info.totalsellqty || info.total_sell_qty || 0,
        bid: info.bid_prices?.[0] || info.bids?.[0]?.price || info.bid || 0,
        ask: info.ask_prices?.[0] || info.asks?.[0]?.price || info.ask || 0,
        spread: 0,
        
        // Option Data
        oi: info.oi || 0
      });
    });

    // Trigger callback with updated data
    if (this.onDataCallback && quotes.length > 0) {
      this.onDataCallback(quotes);
    }
  }

  /**
   * Attempt to reconnect after disconnection
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached');
      if (this.onErrorCallback) {
        this.onErrorCallback('Failed to reconnect after multiple attempts');
      }
      return;
    }

    this.reconnectAttempts++;
    console.log(`[WebSocket] Reconnecting... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect(this.accessToken).then(() => {
        // Re-subscribe to all symbols
        if (this.subscribedSymbols.size > 0) {
          this.subscribe(Array.from(this.subscribedSymbols));
        }
      }).catch((error) => {
        console.error('[WebSocket] Reconnect failed:', error);
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Set callback for data updates
   */
  onData(callback: (data: FyersQuote[]) => void): void {
    this.onDataCallback = callback;
  }

  /**
   * Set callback for errors
   */
  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      console.log('[WebSocket] Disconnecting...');
      this.ws.close();
      this.ws = null;
      this.subscribedSymbols.clear();
      this.dataBuffer.clear();
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let wsInstance: FyersWebSocketService | null = null;

export const getFyersWebSocket = (): FyersWebSocketService => {
  if (!wsInstance) {
    wsInstance = new FyersWebSocketService();
  }
  return wsInstance;
};
