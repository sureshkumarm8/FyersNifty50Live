// Paytm Money API Client - TypeScript/Node.js Port
// Complete reimplementation of Python pmClient

import crypto from 'crypto';

export interface PaytmConfig {
  host: string;
  loginParam: string;
  routes: {
    [key: string]: [string, Set<string>];
  };
}

export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export interface SessionResponse {
  access_token: string;
  public_access_token: string;
  read_access_token: string;
}

export class PaytmClient {
  private apiKey: string;
  private apiSecret: string;
  private accessToken: string | null = null;
  private publicAccessToken: string | null = null;
  private readAccessToken: string | null = null;
  private serviceConfig: PaytmConfig;

  constructor(apiKey: string, apiSecret: string) {
    if (!apiKey) {
      throw new Error('API Key is required');
    }
    if (!apiSecret) {
      throw new Error('API Secret is required');
    }

    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.serviceConfig = this.getServiceConfig();
  }

  /**
   * Get Paytm service configuration
   */
  private getServiceConfig(): PaytmConfig {
    return {
      host: 'https://developer.paytmmoney.com',
      loginParam: '&state=',
      routes: {
        login: ['https://login.paytmmoney.com/merchant-login?apiKey=', new Set()],
        logout: ['/accounts/v1/logout', new Set(['access_token', 'public_access_token', 'read_access_token'])],
        user_details: ['/accounts/v1/user/details', new Set(['access_token', 'read_access_token'])],
        access_token: ['/accounts/v2/gettoken', new Set()],

        // Orders
        place_regular: ['/orders/v1/place/regular', new Set(['access_token'])],
        modify_regular: ['/orders/v1/modify/regular', new Set(['access_token'])],
        cancel_regular: ['/orders/v1/cancel/regular', new Set(['access_token'])],

        // Market Data
        live_market_data: ['/data/v1/price/live?mode={mode_type}&pref={preferences}', new Set(['access_token', 'read_access_token'])],
        option_chain: ['/fno/v1/option-chain?type={type}&symbol={symbol}&expiry={expiry}', new Set(['access_token', 'read_access_token'])],
        security_master: ['/data/v1/scrips/{file_name}', new Set()],

        // Positions
        position: ['/orders/v1/position', new Set(['access_token', 'read_access_token'])],
        holdings_value: ['/holdings/v1/get-holdings-value', new Set(['access_token', 'read_access_token'])],

        // WebSocket
        broadcast_websocket: ['wss://developer-ws.paytmmoney.com/broadcast/user/v1/data?x_jwt_token={public_access_token}', new Set()],
      },
    };
  }

  /**
   * Generate login URL
   */
  getLoginUrl(stateKey: string): string {
    if (!stateKey) {
      throw new Error('State key is required');
    }
    const config = this.serviceConfig;
    return `${config.routes.login[0]}${this.apiKey}${config.loginParam}${stateKey}`;
  }

  /**
   * Generate session and exchange request token for access tokens
   */
  async generateSession(requestToken: string): Promise<SessionResponse> {
    if (!requestToken) {
      throw new Error('Request token is required');
    }

    try {
      const requestBody = {
        api_key: this.apiKey,
        api_secret_key: this.apiSecret,
        request_token: requestToken,
      };

      const response = await fetch(`${this.serviceConfig.host}${this.serviceConfig.routes.access_token[0]}`, {
        method: RequestMethod.POST,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to generate session: ${errorData}`);
      }

      const data = (await response.json()) as SessionResponse;

      if (data.access_token) {
        this.setAccessToken(data.access_token);
      }
      if (data.public_access_token) {
        this.setPublicAccessToken(data.public_access_token);
      }
      if (data.read_access_token) {
        this.setReadAccessToken(data.read_access_token);
      }

      return data;
    } catch (error) {
      console.error('[PaytmClient] Session generation error:', error);
      throw error;
    }
  }

  /**
   * Set access token
   */
  setAccessToken(token: string): string {
    this.accessToken = token;
    return token;
  }

  /**
   * Set public access token
   */
  setPublicAccessToken(token: string): string {
    this.publicAccessToken = token;
    return token;
  }

  /**
   * Set read access token
   */
  setReadAccessToken(token: string): string {
    this.readAccessToken = token;
    return token;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Get current public access token
   */
  getPublicAccessToken(): string | null {
    return this.publicAccessToken;
  }

  /**
   * Get current read access token
   */
  getReadAccessToken(): string | null {
    return this.readAccessToken;
  }

  /**
   * Make API call with proper headers
   */
  async apiCall(
    endpoint: string,
    method: RequestMethod = RequestMethod.GET,
    data?: object,
    params?: object
  ): Promise<any> {
    try {
      let url = `${this.serviceConfig.host}${endpoint}`;

      // Format URL with parameters
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url = url.replace(`{${key}}`, String(value));
        });
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add JWT token based on endpoint requirements
      const jwtToken = this.getJwtToken(endpoint);
      if (jwtToken) {
        headers['x-jwt-token'] = jwtToken;
      }

      const options: RequestInit = {
        method,
        headers,
      };

      if (data && (method === RequestMethod.POST || method === RequestMethod.PUT)) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      // Handle text responses (e.g., security master CSV)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text')) {
        return await response.text();
      }

      return await response.json();
    } catch (error) {
      console.error('[PaytmClient] API call error:', error);
      throw error;
    }
  }

  /**
   * Determine which JWT token to use for endpoint
   */
  private getJwtToken(endpoint: string): string | null {
    // Find matching route
    for (const [route, config] of Object.entries(this.serviceConfig.routes)) {
      if (endpoint.includes(config[0])) {
        const requiredTokens = config[1];

        if (requiredTokens.has('access_token') && this.accessToken) {
          return this.accessToken;
        }
        if (requiredTokens.has('public_access_token') && this.publicAccessToken) {
          return this.publicAccessToken;
        }
        if (requiredTokens.has('read_access_token') && this.readAccessToken) {
          return this.readAccessToken;
        }
      }
    }
    return null;
  }

  /**
   * Get user details
   */
  async getUserDetails(): Promise<any> {
    return this.apiCall(this.serviceConfig.routes.user_details[0]);
  }

  /**
   * Get live market data
   */
  async getLiveMarketData(mode: string, preferences: string): Promise<any> {
    const endpoint = this.serviceConfig.routes.live_market_data[0];
    const url = endpoint.replace('{mode_type}', mode).replace('{preferences}', preferences);
    return this.apiCall(url);
  }

  /**
   * Get option chain
   */
  async getOptionChain(type: string, symbol: string, expiry: string): Promise<any> {
    const endpoint = this.serviceConfig.routes.option_chain[0];
    const url = endpoint.replace('{type}', type).replace('{symbol}', symbol).replace('{expiry}', expiry);
    return this.apiCall(url);
  }

  /**
   * Get security master
   */
  async getSecurityMaster(fileName: string): Promise<string> {
    const endpoint = this.serviceConfig.routes.security_master[0];
    const url = endpoint.replace('{file_name}', fileName);
    return this.apiCall(url);
  }

  /**
   * Get position details
   */
  async getPositions(): Promise<any> {
    return this.apiCall(this.serviceConfig.routes.position[0]);
  }

  /**
   * Get holdings
   */
  async getHoldings(): Promise<any> {
    return this.apiCall(this.serviceConfig.routes.holdings_value[0]);
  }

  /**
   * Logout and clear tokens
   */
  async logout(): Promise<any> {
    const result = await this.apiCall(this.serviceConfig.routes.logout[0], RequestMethod.DELETE);
    this.accessToken = null;
    this.publicAccessToken = null;
    this.readAccessToken = null;
    return result;
  }
}

export default PaytmClient;
