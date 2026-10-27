/**
 * ORDER MANAGEMENT SYSTEM
 * Broker integration layer for real order execution
 */

import { FyersCredentials } from '../types';

/** IST calendar day, used to expire an intraday book overnight. */
const istDayKey = (ts: number = Date.now()): string =>
  new Date(ts).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'SL' | 'SL-M' | 'SL-L';
export type OrderStatus = 'PENDING' | 'PLACED' | 'FILLED' | 'PARTIAL' | 'REJECTED' | 'CANCELLED';
export type ProductType = 'INTRADAY' | 'DELIVERY' | 'MARGIN';

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  triggerPrice?: number;
  /**
   * Simulated fill price, used only by paper trading and never sent to a broker.
   *
   * A MARKET order carries no `price` — brokers require it to be 0 — so without
   * this the paper fill landed at avgPrice 0, which made every P&L percentage
   * infinite and caused simulated positions to close instantly at "target".
   */
  paperFillPrice?: number;
  productType: ProductType;
  status: OrderStatus;
  filledQty: number;
  avgPrice: number;
  timestamp: number;
  brokerOrderId?: string;
  rejectionReason?: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  ltp: number;
  pnl: number;
  pnlPercent: number;
  side: 'LONG' | 'SHORT';
  productType: ProductType;
  entryTime: number;
}

export interface BrokerResponse {
  success: boolean;
  orderId?: string;
  message?: string;
  data?: any;
}

export class OrderManager {
  private credentials: FyersCredentials;
  private orders: Map<string, Order> = new Map();
  private positions: Map<string, Position> = new Map();
  private paperTrading: boolean;
  private liveOrdersEnabled: boolean = false;
  private syncInterval: any = null;
  private activeProtectiveStops: Map<string, string> = new Map(); // symbol -> brokerOrderId
  private mismatchDetectedSince: number | null = null;
  private onMismatchAlarm?: (msg: string) => void;
  /**
   * Where this book is mirrored so it survives a page reload.
   *
   * Everything here used to live only in memory, so refreshing the browser —
   * the very thing a user does when the live feed looks stuck — silently
   * discarded open positions and the whole order history. The engine then
   * believed it was flat while a real position was still open at the broker.
   */
  private storageKey: string | null = null;
  private lastPersistAt = 0;

  constructor(
    credentials: FyersCredentials,
    paperTrading: boolean = true,
    storageKey?: string,
    liveOrdersEnabled: boolean = false
  ) {
    this.credentials = credentials;
    this.paperTrading = paperTrading;
    this.liveOrdersEnabled = liveOrdersEnabled;
    if (storageKey) {
      this.storageKey = storageKey;
      this.restore();
    }
    if (!this.paperTrading) {
      this.startBrokerSync();
    }
  }

  public setLiveOrdersEnabled(enabled: boolean) {
    this.liveOrdersEnabled = enabled;
  }

  public isLiveOrdersEnabled(): boolean {
    return this.liveOrdersEnabled;
  }

  public setMismatchAlarmHandler(handler: (msg: string) => void) {
    this.onMismatchAlarm = handler;
  }

  /**
   * Swap in fresher credentials without discarding the book.
   *
   * Rebuilding the manager whenever the credentials object changed identity —
   * which it does on a token refresh — threw away open positions mid-session.
   */
  public updateCredentials(credentials: FyersCredentials) {
    this.credentials = credentials;
  }

  /** Snapshot of the book, safe to JSON-serialise. Credentials are never included. */  public snapshot(): { orders: Order[]; positions: Position[] } {
    return { orders: this.getOrders(), positions: this.getPositions() };
  }

  /** Replace the book wholesale, e.g. from a snapshot taken before a reload. */
  public hydrate(state: { orders?: Order[]; positions?: Position[] } | null | undefined) {
    if (!state) return;
    this.orders = new Map((state.orders ?? []).map(o => [o.id, o]));
    this.positions = new Map((state.positions ?? []).map(p => [p.symbol, p]));
  }

  private restore() {
    if (!this.storageKey || typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      // The book is intraday only. Yesterday's positions must never come back
      // to life and be managed against today's prices.
      if (!parsed || parsed.day !== istDayKey()) {
        localStorage.removeItem(this.storageKey);
        return;
      }
      this.hydrate(parsed);
    } catch {
      /* corrupt payload — start flat rather than crash the engine */
    }
  }

  /** Mirror the book to storage. Called after every change that can alter it. */
  public persist(force: boolean = true) {
    if (!this.storageKey || typeof localStorage === 'undefined') return;
    // P&L marks arrive every second; writing localStorage that often is pure
    // waste, so only forced writes (orders, fills, exits) bypass the throttle.
    const now = Date.now();
    if (!force && now - this.lastPersistAt < 5000) return;
    this.lastPersistAt = now;
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({ day: istDayKey(), ...this.snapshot() })
      );
    } catch {
      /* storage full or disabled — the in-memory book still works this session */
    }
  }

  /**
   * PLACE ORDER
   */
  public async placeOrder(
    symbol: string,
    side: OrderSide,
    quantity: number,
    type: OrderType = 'MARKET',
    price?: number,
    triggerPrice?: number,
    /** Paper-only fill reference. Ignored entirely when trading live. */
    paperFillPrice?: number
  ): Promise<BrokerResponse> {
    const orderId = this.generateOrderId();

    const order: Order = {
      id: orderId,
      symbol,
      side,
      type,
      quantity,
      price,
      triggerPrice,
      paperFillPrice,
      productType: 'INTRADAY',
      status: 'PENDING',
      filledQty: 0,
      avgPrice: 0,
      timestamp: Date.now()
    };

    this.orders.set(orderId, order);

    try {
      return this.paperTrading ? await this.simulateOrder(order) : await this.executeRealOrder(order);
    } finally {
      // Mirror the book after every attempt — fills, rejections and all — so a
      // reload picks up exactly what the engine believes it holds.
      this.persist();
    }
  }

  /**
   * SIMULATE ORDER (PAPER TRADING)
   */
  private async simulateOrder(order: Order): Promise<BrokerResponse> {
    // Simulate 1-2 second delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // 95% fill rate simulation
    if (Math.random() > 0.05) {
      order.status = 'FILLED';
      order.filledQty = order.quantity;
      // Prefer the caller's fill reference, then a limit price. A zero here would
      // make every downstream P&L percentage divide by zero.
      order.avgPrice =
        order.paperFillPrice && order.paperFillPrice > 0
          ? order.paperFillPrice
          : order.price && order.price > 0
            ? order.price
            : 0;
      order.brokerOrderId = `SIM-${order.id}`;

      this.orders.set(order.id, order);
      this.updatePosition(order);

      return {
        success: true,
        orderId: order.id,
        message: `Order filled at ₹${order.avgPrice.toFixed(2)}`
      };
    } else {
      order.status = 'REJECTED';
      order.rejectionReason = 'Simulated rejection (5% failure rate)';
      this.orders.set(order.id, order);

      return {
        success: false,
        message: order.rejectionReason
      };
    }
  }

  /**
   * EXECUTE REAL ORDER (FYERS/PAYTM API)
   */
  private async executeRealOrder(order: Order): Promise<BrokerResponse> {
    try {
      // 1. Check Global Kill Switch
      const today = istDayKey();
      if (typeof localStorage !== 'undefined' && localStorage.getItem(`autotrade_killed_${today}`) === 'true') {
        throw new Error(`Trading is disarmed by global kill switch for today (${today})`);
      }

      // 2. Check Live Orders Master Gate
      if (!this.liveOrdersEnabled) {
        throw new Error('LIVE orders are disabled by master switch (liveOrdersEnabled=false in settings)');
      }

      // 3. Determine broker
      const broker = this.credentials.dataProvider || 'fyers';

      if (broker === 'fyers') {
        return await this.placeFyersOrder(order);
      } else if (broker === 'paytm') {
        return await this.placePayTMOrder(order);
      } else {
        throw new Error(`Unsupported broker: ${broker}`);
      }
    } catch (error: any) {
      order.status = 'REJECTED';
      order.rejectionReason = error.message;
      this.orders.set(order.id, order);

      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * FYERS ORDER PLACEMENT
   */
  private async placeFyersOrder(order: Order): Promise<BrokerResponse> {
    const endpoint = '/api/fyers/place-order';
    
    const payload = {
      symbol: order.symbol,
      side: order.side === 'BUY' ? 1 : -1,
      type: this.mapOrderType(order.type),
      qty: order.quantity,
      price: order.price || 0,
      trigger_price: order.triggerPrice || 0,
      product_type: 'INTRADAY',
      validity: 'DAY',
      offline_order: false,
      stop_loss: 0,
      take_profit: 0
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        credentials: this.credentials,
        order: payload
      })
    });

    const result = await response.json();

    // Reject if missing creds, simulated fill, or broker error
    if (!response.ok || result.s !== 'ok' || String(result.id || '').startsWith('SIM-')) {
      order.status = 'REJECTED';
      order.rejectionReason = result.message || (result.code === 'NO_CREDENTIALS' ? 'Missing live Fyers credentials' : 'Order rejected by broker');
      this.orders.set(order.id, order);

      return {
        success: false,
        message: order.rejectionReason
      };
    }

    order.status = 'PLACED';
    order.brokerOrderId = result.id;
    this.orders.set(order.id, order);
    this.startBrokerSync();

    return {
      success: true,
      orderId: order.id,
      message: 'Order placed successfully',
      data: result
    };
  }

  /**
   * PAYTM ORDER PLACEMENT
   */
  private async placePayTMOrder(order: Order): Promise<BrokerResponse> {
    const endpoint = '/api/paytm/place-order';
    
    const payload = {
      security_id: this.extractSecurityId(order.symbol),
      txn_type: order.side,
      quantity: order.quantity,
      price: order.price || 0,
      product: 'I', // Intraday
      order_type: order.type,
      validity: 'DAY'
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.credentials.paytmAccessToken || ''}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    // Reject if missing creds, simulated fill, or broker error
    const isSuccess = response.ok && (result.status === 'success' || result.success === true);
    if (!isSuccess || String(result.order_id || '').startsWith('SIM-')) {
      order.status = 'REJECTED';
      order.rejectionReason = result.message || (result.code === 'NO_CREDENTIALS' ? 'Missing live Paytm access token' : 'Order rejected by broker');
      this.orders.set(order.id, order);

      return {
        success: false,
        message: order.rejectionReason
      };
    }

    order.status = 'PLACED';
    order.brokerOrderId = result.order_id;
    this.orders.set(order.id, order);
    this.startBrokerSync();

    return {
      success: true,
      orderId: order.id,
      message: 'Order placed successfully',
      data: result
    };
  }

  /**
   * BROKER ORDER & POSITION SYNCHRONIZATION
   */
  public startBrokerSync() {
    if (this.syncInterval || this.paperTrading) return;
    this.syncInterval = setInterval(() => {
      this.syncWithBroker().catch(err => {
        console.warn('[Broker Sync] Error:', err.message);
      });
    }, 3000);
  }

  public stopBrokerSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Polls broker order book and positions, updates statuses, positions,
   * handles SL-M stops and detects mismatches.
   */
  public async syncWithBroker(): Promise<void> {
    if (this.paperTrading) return;

    const broker = this.credentials.dataProvider || 'fyers';
    const hasPlacedOrders = Array.from(this.orders.values()).some(
      o => o.status === 'PLACED' || o.status === 'PARTIAL'
    );
    const hasPositions = this.positions.size > 0;

    if (!hasPlacedOrders && !hasPositions) {
      // Nothing open to sync
      return;
    }

    try {
      // 1. Sync Orders
      const orderEndpoint = broker === 'fyers' ? '/api/fyers/orders' : '/api/paytm/orders';
      const orderHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (broker === 'fyers' && this.credentials.appId && this.credentials.accessToken) {
        orderHeaders['x-fyers-app-id'] = this.credentials.appId;
        orderHeaders['x-fyers-access-token'] = this.credentials.accessToken;
      } else if (broker === 'paytm' && this.credentials.paytmAccessToken) {
        orderHeaders['x-jwt-token'] = this.credentials.paytmAccessToken;
      }

      const orderRes = await fetch(orderEndpoint, { headers: orderHeaders });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        const brokerOrders: any[] = orderData.orderBook || orderData.data || (Array.isArray(orderData) ? orderData : []);

        for (const order of this.orders.values()) {
          if (order.status !== 'PLACED' && order.status !== 'PARTIAL') continue;
          if (!order.brokerOrderId) continue;

          const bo = brokerOrders.find(
            b => String(b.id || b.order_id || b.orderNumber) === String(order.brokerOrderId)
          );
          if (!bo) continue;

          let newStatus: OrderStatus | null = null;
          let fillPrice = order.avgPrice;
          let filledQty = order.filledQty;

          if (broker === 'fyers') {
            if (bo.status === 2) newStatus = 'FILLED';
            else if (bo.status === 1) newStatus = 'CANCELLED';
            else if (bo.status === 5) newStatus = 'REJECTED';
            else if (bo.status === 4) newStatus = 'PARTIAL';
            fillPrice = bo.tradedPrice || bo.avgPrice || order.avgPrice;
            filledQty = bo.filledQty || order.filledQty;
          } else {
            const st = String(bo.status || '').toUpperCase();
            if (st === 'COMPLETE' || st === 'TRADED' || st === 'FILLED') newStatus = 'FILLED';
            else if (st === 'CANCELLED') newStatus = 'CANCELLED';
            else if (st === 'REJECTED') newStatus = 'REJECTED';
            else if (st === 'PARTIAL') newStatus = 'PARTIAL';
            fillPrice = bo.avg_price || bo.price || order.avgPrice;
            filledQty = bo.traded_quantity || order.filledQty;
          }

          if (newStatus && newStatus !== order.status) {
            order.status = newStatus;
            order.avgPrice = fillPrice || order.price || 0;
            order.filledQty = filledQty || order.quantity;
            this.orders.set(order.id, order);

            if (newStatus === 'FILLED') {
              this.updatePosition(order);
              // Trigger protective SL-M stop order
              await this.placeProtectiveStop(order);
            }
            this.persist();
          }
        }
      }

      // 2. Sync Positions & Detect Mismatch
      const posEndpoint = broker === 'fyers' ? '/api/fyers/positions' : '/api/paytm/positions';
      const posRes = await fetch(posEndpoint, { headers: orderHeaders });
      if (posRes.ok) {
        const posData = await posRes.json();
        const brokerPositions: any[] = posData.netPositions || posData.data || (Array.isArray(posData) ? posData : []);
        
        const openBrokerCount = brokerPositions.filter(p => (p.netQty || p.quantity || 0) !== 0).length;
        const localCount = this.positions.size;

        if (openBrokerCount !== localCount) {
          if (!this.mismatchDetectedSince) {
            this.mismatchDetectedSince = Date.now();
          } else if (Date.now() - this.mismatchDetectedSince > 10_000) {
            const msg = `POSITION MISMATCH ALARM: Broker holds ${openBrokerCount} open positions, app holds ${localCount}. Auto-trade disarmed.`;
            console.error(`[Broker Sync] ${msg}`);
            if (this.onMismatchAlarm) {
              this.onMismatchAlarm(msg);
            }
          }
        } else {
          this.mismatchDetectedSince = null;
        }
      }
    } catch (err: any) {
      console.warn('[Broker Sync] Exception during sync:', err.message);
    }
  }

  /**
   * Places an exchange-side protective stop (SL-M) order right after live entry fill
   */
  public async placeProtectiveStop(entryOrder: Order, stopPrice?: number): Promise<void> {
    if (this.paperTrading || entryOrder.status !== 'FILLED') return;
    if (this.activeProtectiveStops.has(entryOrder.symbol)) return;

    try {
      const exitSide: OrderSide = entryOrder.side === 'BUY' ? 'SELL' : 'BUY';
      const trigger = stopPrice || (entryOrder.avgPrice > 0 ? Math.round(entryOrder.avgPrice * 0.85) : 0);

      const stopOrder = await this.placeOrder(
        entryOrder.symbol,
        exitSide,
        entryOrder.filledQty,
        'SL-M',
        0,
        trigger
      );

      if (stopOrder.success && stopOrder.orderId) {
        this.activeProtectiveStops.set(entryOrder.symbol, stopOrder.orderId);
        console.log(`[Protective Stop] SL-M placed at ₹${trigger} for ${entryOrder.symbol}`);
      }
    } catch (err: any) {
      console.error(`[Protective Stop] Failed to place SL-M:`, err.message);
    }
  }

  /**
   * Cancels open protective SL-M stop order when position exits normally
   */
  public async cancelProtectiveStop(symbol: string): Promise<void> {
    const stopOrderId = this.activeProtectiveStops.get(symbol);
    if (!stopOrderId) return;
    this.activeProtectiveStops.delete(symbol);
    try {
      await this.cancelOrder(stopOrderId);
    } catch (e: any) {
      console.warn(`[Protective Stop] Error cancelling stop for ${symbol}:`, e.message);
    }
  }

  /**
   * Global Kill Switch: Cancel all open orders, market exit positions, disarm panels, latch killed state
   */
  public async flattenAndDisarmAll(reason: string = 'Emergency kill switch'): Promise<void> {
    console.warn(`[OrderManager] FLATTEN & DISARM ALL TRIGGERED: ${reason}`);
    const today = istDayKey();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`autotrade_killed_${today}`, 'true');
    }

    // 1. Cancel all open / placed orders
    for (const order of this.orders.values()) {
      if (order.status === 'PLACED' || order.status === 'PENDING' || order.status === 'PARTIAL') {
        await this.cancelOrder(order.id).catch(() => {});
      }
    }

    // 2. Flatten all positions at MARKET
    await this.closeAllPositions();

    // 3. Notify backend / Redis
    try {
      await fetch('/api/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
    } catch (e) {}

    this.persist();
  }

  /**
   * CANCEL ORDER
   */
  public async cancelOrder(orderId: string): Promise<BrokerResponse> {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    if (order.status === 'FILLED' || order.status === 'CANCELLED') {
      return { success: false, message: 'Cannot cancel filled/cancelled order' };
    }

    if (this.paperTrading) {
      order.status = 'CANCELLED';
      this.orders.set(orderId, order);
      return { success: true, message: 'Order cancelled' };
    }

    // Real broker cancellation
    const broker = this.credentials.dataProvider || 'fyers';
    
    if (broker === 'fyers') {
      return this.cancelFyersOrder(order);
    } else {
      return this.cancelPayTMOrder(order);
    }
  }

  /**
   * UPDATE POSITION FROM ORDER
   */
  private updatePosition(order: Order) {
    if (order.status !== 'FILLED') return;

    const existing = this.positions.get(order.symbol);

    if (!existing) {
      // New position
      this.positions.set(order.symbol, {
        symbol: order.symbol,
        quantity: order.side === 'BUY' ? order.filledQty : -order.filledQty,
        avgPrice: order.avgPrice,
        ltp: order.avgPrice,
        pnl: 0,
        pnlPercent: 0,
        side: order.side === 'BUY' ? 'LONG' : 'SHORT',
        productType: order.productType,
        entryTime: order.timestamp
      });
    } else {
      // Update existing position
      const newQty = existing.quantity + (order.side === 'BUY' ? order.filledQty : -order.filledQty);
      
      if (newQty === 0) {
        // Position closed
        this.positions.delete(order.symbol);
        this.cancelProtectiveStop(order.symbol);
      } else {
        existing.quantity = newQty;
        this.positions.set(order.symbol, existing);
      }
    }
  }

  /**
   * UPDATE POSITION P&L
   */
  public updatePositionPnL(symbol: string, ltp: number) {
    const position = this.positions.get(symbol);
    if (!position) return;

    position.ltp = ltp;
    position.pnl = (ltp - position.avgPrice) * position.quantity;
    // An unknown entry price yields no meaningful percentage. Reporting 0 keeps
    // the target/stop comparisons inert instead of firing on an Infinity.
    position.pnlPercent =
      position.avgPrice > 0 ? ((ltp - position.avgPrice) / position.avgPrice) * 100 : 0;

    this.positions.set(symbol, position);
    this.persist(false);
  }

  /**
   * GET ALL POSITIONS
   */
  public getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  /**
   * GET ALL ORDERS
   */
  public getOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  /**
   * GET ORDER HISTORY
   */
  public getOrderHistory(): Order[] {
    return Array.from(this.orders.values())
      .filter(o => o.status === 'FILLED' || o.status === 'REJECTED' || o.status === 'CANCELLED')
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * CLOSE ALL POSITIONS
   */
  public async closeAllPositions(): Promise<BrokerResponse[]> {
    const positions = this.getPositions();
    const results: BrokerResponse[] = [];

    for (const pos of positions) {
      const side: OrderSide = pos.side === 'LONG' ? 'SELL' : 'BUY';
      const result = await this.placeOrder(
        pos.symbol,
        side,
        Math.abs(pos.quantity),
        'MARKET'
      );
      results.push(result);
    }

    return results;
  }

  /**
   * HELPER METHODS
   */
  private generateOrderId(): string {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapOrderType(type: OrderType): number {
    const mapping: Record<OrderType, number> = {
      'MARKET': 2,
      'LIMIT': 1,
      'SL': 3,
      'SL-M': 4,
      'SL-L': 3
    };
    return mapping[type] || 2;
  }

  private extractSecurityId(symbol: string): string {
    // Extract security ID from symbol (implementation depends on format)
    // Example: "NSE:NIFTY26MAR2623000CE" -> security_id
    return symbol; // Placeholder
  }

  private async cancelFyersOrder(order: Order): Promise<BrokerResponse> {
    // Implementation for Fyers cancel
    return { success: true, message: 'Order cancelled' };
  }

  private async cancelPayTMOrder(order: Order): Promise<BrokerResponse> {
    // Implementation for PayTM cancel
    return { success: true, message: 'Order cancelled' };
  }

  /**
   * SET PAPER TRADING MODE
   */
  public setPaperTrading(enabled: boolean) {
    this.paperTrading = enabled;
  }

  /**
   * GET TRADING MODE
   */
  public isPaperTrading(): boolean {
    return this.paperTrading;
  }
}
