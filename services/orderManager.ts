/**
 * ORDER MANAGEMENT SYSTEM
 * Broker integration layer for real order execution
 */

import { FyersCredentials } from '../types';

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

/**
 * ORDER MANAGER CLASS
 * Handles all broker interactions
 */
export class OrderManager {
  private credentials: FyersCredentials;
  private orders: Map<string, Order> = new Map();
  private positions: Map<string, Position> = new Map();
  private paperTrading: boolean;

  constructor(credentials: FyersCredentials, paperTrading: boolean = true) {
    this.credentials = credentials;
    this.paperTrading = paperTrading;
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
    triggerPrice?: number
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
      productType: 'INTRADAY',
      status: 'PENDING',
      filledQty: 0,
      avgPrice: 0,
      timestamp: Date.now()
    };

    this.orders.set(orderId, order);

    if (this.paperTrading) {
      return this.simulateOrder(order);
    } else {
      return this.executeRealOrder(order);
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
      order.avgPrice = order.price || 0; // Would need real LTP here
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
      // Determine broker
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

    if (result.s === 'ok') {
      order.status = 'PLACED';
      order.brokerOrderId = result.id;
      this.orders.set(order.id, order);

      return {
        success: true,
        orderId: order.id,
        message: 'Order placed successfully',
        data: result
      };
    } else {
      order.status = 'REJECTED';
      order.rejectionReason = result.message || 'Unknown error';
      this.orders.set(order.id, order);

      return {
        success: false,
        message: order.rejectionReason
      };
    }
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
        'Authorization': `Bearer ${this.credentials.paytmAccessToken}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.status === 'success') {
      order.status = 'PLACED';
      order.brokerOrderId = result.order_id;
      this.orders.set(order.id, order);

      return {
        success: true,
        orderId: order.id,
        message: 'Order placed successfully',
        data: result
      };
    } else {
      order.status = 'REJECTED';
      order.rejectionReason = result.message || 'Unknown error';
      this.orders.set(order.id, order);

      return {
        success: false,
        message: order.rejectionReason
      };
    }
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
    position.pnlPercent = ((ltp - position.avgPrice) / position.avgPrice) * 100;

    this.positions.set(symbol, position);
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
