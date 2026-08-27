import { GoogleGenAI } from "@google/genai";
import { FyersCredentials, DEFAULT_OLLAMA_BASE_URL, DEFAULT_OLLAMA_MODEL } from "../types";

export type AIProviderId = 'gemini' | 'groq' | 'claude' | 'cerebras' | 'ollama';

// API Call Tracker
interface APICallLog {
  timestamp: number;
  provider: AIProviderId;
  model?: string;
  duration: number;
  success: boolean;
  error?: string;
  tokensUsed?: number;
}

class APICallTracker {
  private calls: APICallLog[] = [];
  private listeners: Array<(stats: APIStats) => void> = [];

  logCall(log: APICallLog) {
    this.calls.push(log);
    // Keep last 1000 calls
    if (this.calls.length > 1000) {
      this.calls = this.calls.slice(-1000);
    }
    this.notifyListeners();
  }

  subscribe(listener: (stats: APIStats) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    const stats = this.getStats();
    this.listeners.forEach(listener => listener(stats));
  }

  getStats(): APIStats {
    const now = Date.now();
    const lastMinute = this.calls.filter(c => now - c.timestamp < 60000);
    const last5Minutes = this.calls.filter(c => now - c.timestamp < 300000);
    const lastHour = this.calls.filter(c => now - c.timestamp < 3600000);
    const today = this.calls.filter(c => {
      const callDate = new Date(c.timestamp).toDateString();
      return callDate === new Date().toDateString();
    });

    const totalDuration = this.calls.reduce((sum, c) => sum + c.duration, 0);
    const avgDuration = this.calls.length > 0 ? totalDuration / this.calls.length : 0;
    const successRate = this.calls.length > 0 
      ? (this.calls.filter(c => c.success).length / this.calls.length) * 100 
      : 0;

    const geminiCalls = this.calls.filter(c => c.provider === 'gemini').length;
    const groqCalls = this.calls.filter(c => c.provider === 'groq').length;
    const claudeCalls = this.calls.filter(c => c.provider === 'claude').length;
    const cerebrasCalls = this.calls.filter(c => c.provider === 'cerebras').length;
    const ollamaCalls = this.calls.filter(c => c.provider === 'ollama').length;

    return {
      lastMinute: lastMinute.length,
      last5Minutes: last5Minutes.length,
      lastHour: lastHour.length,
      today: today.length,
      total: this.calls.length,
      avgDuration,
      successRate,
      geminiCalls,
      groqCalls,
      claudeCalls,
      cerebrasCalls,
      ollamaCalls,
      recentCalls: this.calls.slice(-10).reverse()
    };
  }

  getCalls() {
    return this.calls;
  }

  clearStats() {
    this.calls = [];
    this.notifyListeners();
  }
}

export const apiCallTracker = new APICallTracker();

export interface APIStats {
  lastMinute: number;
  last5Minutes: number;
  lastHour: number;
  today: number;
  total: number;
  avgDuration: number;
  successRate: number;
  geminiCalls: number;
  groqCalls: number;
  claudeCalls: number;
  cerebrasCalls: number;
  ollamaCalls: number;
  recentCalls: APICallLog[];
}

export async function callAI(
  credentials: FyersCredentials,
  systemInstruction: string,
  userContent: string,
  options?: { jsonMode?: boolean }
): Promise<string> {
  const provider = credentials.aiProvider || 'gemini';
  const jsonMode = options?.jsonMode ?? false;
  
  // Check which provider to use
  if (provider === 'ollama') {
    const model = credentials.ollamaModel || DEFAULT_OLLAMA_MODEL;
    return callOllamaAI(credentials.ollamaBaseUrl, systemInstruction, userContent, jsonMode, model);
  } else if (provider === 'groq' && credentials.groqApiKey) {
    const model = credentials.groqModel || 'mixtral-8x7b-32768';
    return callGroqAI(credentials.groqApiKey, systemInstruction, userContent, jsonMode, model);
  } else if (provider === 'claude' && credentials.claudeApiKey) {
    const model = credentials.claudeModel || 'claude-3-5-sonnet-20241022';
    return callClaudeAI(credentials.claudeApiKey, systemInstruction, userContent, jsonMode, model);
  } else if (provider === 'cerebras' && credentials.cerebrasApiKey) {
    const model = credentials.cerebrasModel || 'cerebras/llama-3.1-70b';
    return callCerebrasAI(credentials.cerebrasApiKey, systemInstruction, userContent, jsonMode, model);
  } else if (credentials.googleApiKey) {
    const model = credentials.geminiModel || 'gemini-2.0-flash';
    return callGeminiAI(credentials.googleApiKey, systemInstruction, userContent, jsonMode, model);
  } else {
    throw new Error('No valid AI API key configured');
  }
}

async function callGeminiAI(
  apiKey: string,
  systemInstruction: string,
  userContent: string,
  jsonMode: boolean = false,
  model: string = 'gemini-2.0-flash'
): Promise<string> {
  console.log(`%c📡 Calling Gemini AI (${model})`, 'color: green; font-size: 11px;');
  const startTime = performance.now();
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const config: any = { systemInstruction };
    
    // Only force JSON mode if explicitly requested
    if (jsonMode) {
      config.responseMimeType = "application/json";
    }
    
    const response = await ai.models.generateContent({
      model: model,
      contents: userContent,
      config
    });
    
    const duration = performance.now() - startTime;
    console.log(`%c✅ Gemini Response in ${duration.toFixed(2)}ms`, 'color: green; font-size: 11px;');
    
    apiCallTracker.logCall({
      timestamp: Date.now(),
      provider: 'gemini',
      model: model,
      duration,
      success: true
    });
    
    return response.text || '{}';
  } catch (error: any) {
    const duration = performance.now() - startTime;
    apiCallTracker.logCall({
      timestamp: Date.now(),
      provider: 'gemini',
      model: model,
      duration,
      success: false,
      error: error.message
    });
    throw error;
  }
}

async function callGroqAI(
  apiKey: string,
  systemInstruction: string,
  userContent: string,
  jsonMode: boolean = false,
  model: string = 'mixtral-8x7b-32768'
): Promise<string> {
  console.log(`%c📡 Calling Groq AI (${model})`, 'color: purple; font-size: 11px;');
  const startTime = performance.now();
  
  const fullPrompt = `${systemInstruction}\n\n${userContent}`;
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'user', content: fullPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    const duration = performance.now() - startTime;
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error(`%c❌ Groq Error: ${response.status}`, 'color: red; font-weight: bold;');
    console.error('Details:', errorData);
    
    apiCallTracker.logCall({
      timestamp: Date.now(),
      provider: 'groq',
      model,
      duration,
      success: false,
      error: `${response.status}: ${JSON.stringify(errorData)}`
    });
    
    throw new Error(`Groq API error (${response.status}): ${JSON.stringify(errorData)}`);
  }

  const duration = performance.now() - startTime;
  console.log(`%c✅ Groq Response in ${duration.toFixed(2)}ms`, 'color: purple; font-size: 11px;');
  
  const data = await response.json();
  const tokensUsed = data.usage?.total_tokens || 0;
  const responseText = data.choices?.[0]?.message?.content || '{}';
  
  apiCallTracker.logCall({
    timestamp: Date.now(),
    provider: 'groq',
    model,
    duration,
    success: true,
    tokensUsed
  });
  
  if (!jsonMode) {
    return responseText;
  }
  
  // Extract JSON if wrapped in code blocks
  try {
    return JSON.stringify(JSON.parse(responseText));
  } catch (e) {
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/```\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return jsonMatch[1];
    }
    return responseText;
  }
}

async function callClaudeAI(
  apiKey: string,
  systemInstruction: string,
  userContent: string,
  jsonMode: boolean = false,
  model: string = 'claude-3-5-sonnet-20241022'
): Promise<string> {
  console.log(`%c📡 Calling Claude AI (${model})`, 'color: orange; font-size: 11px;');
  const startTime = performance.now();
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 2048,
      system: systemInstruction,
      messages: [
        { role: 'user', content: userContent }
      ]
    })
  });

  if (!response.ok) {
    const duration = performance.now() - startTime;
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error(`%c❌ Claude Error: ${response.status}`, 'color: red; font-weight: bold;');
    console.error('Details:', errorData);
    
    apiCallTracker.logCall({
      timestamp: Date.now(),
      provider: 'claude',
      model,
      duration,
      success: false,
      error: `${response.status}: ${JSON.stringify(errorData)}`
    });
    
    throw new Error(`Claude API error (${response.status}): ${JSON.stringify(errorData)}`);
  }

  const duration = performance.now() - startTime;
  console.log(`%c✅ Claude Response in ${duration.toFixed(2)}ms`, 'color: orange; font-size: 11px;');
  
  const data = await response.json();
  const tokensUsed = data.usage?.input_tokens + data.usage?.output_tokens || 0;
  const responseText = data.content?.[0]?.text || '{}';
  
  apiCallTracker.logCall({
    timestamp: Date.now(),
    provider: 'claude',
    model,
    duration,
    success: true,
    tokensUsed
  });
  
  if (!jsonMode) {
    return responseText;
  }
  
  // Extract JSON if wrapped in code blocks
  try {
    return JSON.stringify(JSON.parse(responseText));
  } catch (e) {
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/```\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return jsonMatch[1];
    }
    return responseText;
  }
}

async function callCerebrasAI(
  apiKey: string,
  systemInstruction: string,
  userContent: string,
  jsonMode: boolean = false,
  model: string = 'cerebras/llama-3.1-70b'
): Promise<string> {
  console.log(`%c📡 Calling Cerebras AI (${model})`, 'color: #FF6B35; font-size: 11px;');
  const startTime = performance.now();
  
  try {
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userContent }
        ],
        temperature: 0.3,
        max_tokens: 2048,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const duration = performance.now() - startTime;
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`%c❌ Cerebras Error: ${response.status}`, 'color: red; font-weight: bold;');
      console.error('Details:', errorData);
      
      apiCallTracker.logCall({
        timestamp: Date.now(),
        provider: 'cerebras',
        model,
        duration,
        success: false,
        error: `${response.status}: ${JSON.stringify(errorData)}`
      });
      
      throw new Error(`Cerebras API error (${response.status}): ${JSON.stringify(errorData)}`);
    }

    const duration = performance.now() - startTime;
    console.log(`%c✅ Cerebras Response in ${duration.toFixed(2)}ms`, 'color: #FF6B35; font-size: 11px;');
    
    const data = await response.json();
    const tokensUsed = data.usage?.total_tokens || 0;
    const responseText = data.choices?.[0]?.message?.content || '{}';
    
    apiCallTracker.logCall({
      timestamp: Date.now(),
      provider: 'cerebras',
      model,
      duration,
      success: true,
      tokensUsed
    });
    
    if (!jsonMode) {
      return responseText;
    }
    
    // Extract JSON if wrapped in code blocks
    try {
      return JSON.stringify(JSON.parse(responseText));
    } catch (e) {
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/```\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        return jsonMatch[1];
      }
      return responseText;
    }
  } catch (error: any) {
    const duration = performance.now() - startTime;
    apiCallTracker.logCall({
      timestamp: Date.now(),
      provider: 'cerebras',
      model,
      duration,
      success: false,
      error: error.message
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Local Llama (Ollama) — https://ollama.com
// Runs entirely on the user's machine. No API key, no rate limits, no cost.
// ---------------------------------------------------------------------------

const OLLAMA_DEV_PROXY = '/api/ollama';

/** Normalises user input like "localhost:11434/" or "127.0.0.1:11434/api" to a clean origin. */
export function normalizeOllamaBaseUrl(baseUrl?: string): string {
  const raw = (baseUrl || '').trim() || DEFAULT_OLLAMA_BASE_URL;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  return withScheme.replace(/\/+$/, '').replace(/\/(api|v1)$/i, '');
}

/**
 * Calls the local Ollama server directly. If the browser blocks the request
 * (CORS or https->http mixed content) we retry through the local dev proxy.
 */
async function ollamaFetch(baseUrl: string, path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${baseUrl}${path}`, init);
  } catch (directError: any) {
    try {
      const proxied = await fetch(`${OLLAMA_DEV_PROXY}${path}?target=${encodeURIComponent(baseUrl)}`, init);
      if (proxied.status !== 404) return proxied;
    } catch {
      // fall through to the descriptive error below
    }
    throw new Error(
      `Cannot reach Ollama at ${baseUrl}. Make sure "ollama serve" is running and that this origin is allowed ` +
      `(start Ollama with OLLAMA_ORIGINS="*"). Note: a site served over HTTPS cannot call http://localhost. ` +
      `Original error: ${directError?.message || directError}`
    );
  }
}

/** Lists models available on the local Ollama instance (`ollama list`). */
export async function listOllamaModels(baseUrl?: string): Promise<string[]> {
  const url = normalizeOllamaBaseUrl(baseUrl);
  const response = await ollamaFetch(url, '/api/tags', { method: 'GET' });

  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status} while listing models.`);
  }

  const data = await response.json();
  return (data?.models || [])
    .map((m: any) => m?.name)
    .filter((name: any): name is string => typeof name === 'string' && name.length > 0)
    .sort();
}

/** Verifies the local Ollama server is reachable and returns its installed models. */
export async function testOllamaConnection(baseUrl?: string): Promise<{ ok: boolean; models: string[]; error?: string }> {
  try {
    const models = await listOllamaModels(baseUrl);
    return { ok: true, models };
  } catch (error: any) {
    return { ok: false, models: [], error: error?.message || 'Unknown error' };
  }
}

function extractJsonText(responseText: string): string {
  try {
    return JSON.stringify(JSON.parse(responseText));
  } catch (e) {
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/```\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return jsonMatch[1];
    }
    return responseText;
  }
}

async function callOllamaAI(
  baseUrl: string | undefined,
  systemInstruction: string,
  userContent: string,
  jsonMode: boolean = false,
  model: string = DEFAULT_OLLAMA_MODEL
): Promise<string> {
  const url = normalizeOllamaBaseUrl(baseUrl);
  console.log(`%c📡 Calling Local Llama via Ollama (${model} @ ${url})`, 'color: #22d3ee; font-size: 11px;');
  const startTime = performance.now();

  try {
    const response = await ollamaFetch(url, '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userContent }
        ],
        stream: false,
        ...(jsonMode ? { format: 'json' } : {}),
        options: {
          temperature: 0.3,
          top_p: 0.9,
          num_predict: 2048
        }
      })
    });

    if (!response.ok) {
      const duration = performance.now() - startTime;
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`%c❌ Ollama Error: ${response.status}`, 'color: red; font-weight: bold;');
      console.error('Details:', errorData);

      apiCallTracker.logCall({
        timestamp: Date.now(),
        provider: 'ollama',
        model,
        duration,
        success: false,
        error: `${response.status}: ${JSON.stringify(errorData)}`
      });

      const hint = response.status === 404
        ? ` Model "${model}" is not installed. Run: ollama pull ${model}`
        : '';
      throw new Error(`Ollama API error (${response.status}): ${JSON.stringify(errorData)}.${hint}`);
    }

    const duration = performance.now() - startTime;
    console.log(`%c✅ Ollama Response in ${duration.toFixed(2)}ms`, 'color: #22d3ee; font-size: 11px;');

    const data = await response.json();
    const tokensUsed = (data?.prompt_eval_count || 0) + (data?.eval_count || 0);
    const responseText = data?.message?.content || '{}';

    apiCallTracker.logCall({
      timestamp: Date.now(),
      provider: 'ollama',
      model,
      duration,
      success: true,
      tokensUsed
    });

    return jsonMode ? extractJsonText(responseText) : responseText;
  } catch (error: any) {
    const duration = performance.now() - startTime;
    // Connection failures never reach the logger above, so record them here.
    if (!/Ollama API error/.test(error?.message || '')) {
      apiCallTracker.logCall({
        timestamp: Date.now(),
        provider: 'ollama',
        model,
        duration,
        success: false,
        error: error?.message
      });
    }
    throw error;
  }
}

/**
 * True when the selected provider has everything it needs to run.
 * Ollama needs no key because it runs locally.
 */
export function isAIConfigured(credentials: FyersCredentials): boolean {
  switch (credentials.aiProvider || 'gemini') {
    case 'ollama': return true;
    case 'groq': return !!credentials.groqApiKey;
    case 'claude': return !!credentials.claudeApiKey;
    case 'cerebras': return !!credentials.cerebrasApiKey;
    default: return !!credentials.googleApiKey;
  }
}
