// Paytm Session Management Service
// Handles OAuth flow and token storage

import crypto from 'crypto';

export interface SessionData {
  sessionId: string;
  status: 'pending' | 'completed' | 'failed';
  broker: 'paytm' | 'fyers';
  accessToken?: string;
  publicAccessToken?: string;
  readAccessToken?: string;
  timestamp: number;
  expiresAt: number;
  stateKey?: string;
  errorMessage?: string;
}

class SessionManager {
  private sessions: Map<string, SessionData> = new Map();
  private sessionTimeout = 15 * 60 * 1000; // 15 minutes

  /**
   * Create a new session
   */
  createSession(broker: 'paytm' | 'fyers'): SessionData {
    const sessionId = crypto.randomBytes(16).toString('hex');
    const stateKey = crypto.randomBytes(16).toString('hex');

    const session: SessionData = {
      sessionId,
      status: 'pending',
      broker,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout,
      stateKey,
    };

    this.sessions.set(sessionId, session);

    // Auto-cleanup expired sessions
    setTimeout(() => {
      this.sessions.delete(sessionId);
    }, this.sessionTimeout);

    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): SessionData | undefined {
    const session = this.sessions.get(sessionId);

    if (session && session.expiresAt < Date.now()) {
      this.sessions.delete(sessionId);
      return undefined;
    }

    return session;
  }

  /**
   * Update session with tokens
   */
  completeSession(
    sessionId: string,
    accessToken: string,
    publicAccessToken: string,
    readAccessToken: string
  ): SessionData | null {
    const session = this.getSession(sessionId);

    if (!session) {
      return null;
    }

    session.status = 'completed';
    session.accessToken = accessToken;
    session.publicAccessToken = publicAccessToken;
    session.readAccessToken = readAccessToken;
    session.timestamp = Date.now();

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Mark session as failed
   */
  failSession(sessionId: string, errorMessage: string): SessionData | null {
    const session = this.getSession(sessionId);

    if (!session) {
      return null;
    }

    session.status = 'failed';
    session.errorMessage = errorMessage;
    session.timestamp = Date.now();

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Get state key from session
   */
  getStateKey(sessionId: string): string | null {
    const session = this.getSession(sessionId);
    return session?.stateKey || null;
  }

  /**
   * Cleanup old sessions
   */
  cleanup(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Get all active sessions (for debugging)
   */
  getAllSessions(): SessionData[] {
    this.cleanup();
    return Array.from(this.sessions.values());
  }

  /**
   * Clear all sessions
   */
  clearAll(): void {
    this.sessions.clear();
  }
}

export const sessionManager = new SessionManager();

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  sessionManager.cleanup();
}, 5 * 60 * 1000);

export default sessionManager;
