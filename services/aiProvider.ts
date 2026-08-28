import { GoogleGenAI } from "@google/genai";
import { FyersCredentials, DEFAULT_OLLAMA_BASE_URL, DEFAULT_OLLAMA_MODEL, DEFAULT_OLLAMA_VISION_MODEL } from "../types";

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
 * Builds an actionable message for the exact reason the local server is unreachable.
 */
function buildOllamaUnreachableError(baseUrl: string, directError: any): Error {
  const pageOrigin = typeof window !== 'undefined' ? window.location.origin : 'this app';
  const isSecurePage = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isPlainTarget = baseUrl.startsWith('http://');

  if (isSecurePage && isPlainTarget) {
    return new Error(
      `Could not reach ${baseUrl} from ${pageOrigin}. Two things to check: (1) allow this origin - restart ` +
      `Ollama with OLLAMA_ORIGINS="${pageOrigin}"; (2) Safari and some browsers block an HTTPS page from ` +
      `calling a plain http:// address, so if it still fails run the dashboard locally ` +
      `("npm run dev" -> http://localhost:5173).`
    );
  }

  return new Error(
    `Cannot reach Ollama at ${baseUrl}. Check that "ollama serve" is running, then allow this origin by ` +
    `starting it with OLLAMA_ORIGINS="${pageOrigin}" (or "*"). Original error: ${directError?.message || directError}`
  );
}

/**
 * Calls the local Ollama server directly. If the browser blocks the request
 * (CORS or https->http mixed content) we retry through the local dev proxy.
 */
async function ollamaFetch(baseUrl: string, path: string, init?: RequestInit): Promise<{ response: Response; viaProxy: boolean }> {
  try {
    return { response: await fetch(`${baseUrl}${path}`, init), viaProxy: false };
  } catch (directError: any) {
    try {
      const proxied = await fetch(`${OLLAMA_DEV_PROXY}${path}?target=${encodeURIComponent(baseUrl)}`, init);
      // The SPA fallback answers unknown routes with index.html, so a 200 alone is
      // not proof the proxy exists - only trust a genuine JSON reply.
      const contentType = proxied.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return { response: proxied, viaProxy: true };
      }
    } catch {
      // fall through to the descriptive error below
    }
    throw buildOllamaUnreachableError(baseUrl, directError);
  }
}

/** Parses an Ollama reply, converting non-JSON bodies into a readable error. */
async function parseOllamaJson(response: Response, baseUrl: string): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `${baseUrl} did not return JSON - it does not look like an Ollama server. ` +
      `Received: ${text.slice(0, 80).replace(/\s+/g, ' ')}...`
    );
  }
}

/** Lists models available on the local Ollama instance (`ollama list`). */
export async function listOllamaModels(baseUrl?: string): Promise<string[]> {
  const url = normalizeOllamaBaseUrl(baseUrl);
  const { response } = await ollamaFetch(url, '/api/tags', { method: 'GET' });

  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status} while listing models.`);
  }

  const data = await parseOllamaJson(response, url);
  return (data?.models || [])
    .map((m: any) => m?.name)
    .filter((name: any): name is string => typeof name === 'string' && name.length > 0)
    .sort();
}

/** Name patterns of well-known multimodal models, used to complement reported capabilities. */
const VISION_MODEL_NAME_PATTERN = /vision|llava|-vl|vl:|minicpm-v|moondream|bakllava|pixtral|gemma3|gemma4/i;

/**
 * Lists only the multimodal models installed locally.
 * Newer Ollama builds report a `vision` capability per model, but the list is not
 * always complete, so well-known multimodal model names are accepted too.
 */
export async function listOllamaVisionModels(baseUrl?: string): Promise<string[]> {
  const url = normalizeOllamaBaseUrl(baseUrl);
  const { response } = await ollamaFetch(url, '/api/tags', { method: 'GET' });

  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status} while listing models.`);
  }

  const data = await parseOllamaJson(response, url);
  return (data?.models || [])
    .filter((m: any) => {
      const capabilities = Array.isArray(m?.capabilities) ? m.capabilities : [];
      return capabilities.includes('vision') || VISION_MODEL_NAME_PATTERN.test(m?.name || '');
    })
    .map((m: any) => m?.name)
    .filter((name: any): name is string => typeof name === 'string' && name.length > 0)
    .sort();
}

/** Verifies the local Ollama server is reachable and returns its installed models. */
export async function testOllamaConnection(
  baseUrl?: string
): Promise<{ ok: boolean; models: string[]; visionModels: string[]; error?: string }> {
  try {
    const [models, visionModels] = await Promise.all([
      listOllamaModels(baseUrl),
      listOllamaVisionModels(baseUrl).catch(() => [] as string[])
    ]);
    return { ok: true, models, visionModels };
  } catch (error: any) {
    return { ok: false, models: [], visionModels: [], error: error?.message || 'Unknown error' };
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
    const { response, viaProxy } = await ollamaFetch(url, '/api/chat', {
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
      const rawBody = await response.text().catch(() => '');
      let details = rawBody.slice(0, 200).replace(/\s+/g, ' ').trim();
      let hint = '';

      try {
        details = JSON.stringify(JSON.parse(rawBody));
        if (response.status === 404) {
          hint = ` Model "${model}" is not installed. Run: ollama pull ${model}`;
        }
      } catch {
        // A non-JSON body means the endpoint is not really Ollama's chat API.
        hint = viaProxy
          ? ` That reply came from this site's server, not from Ollama - it cannot see your machine. ` +
            `Allow the browser to call Ollama directly by restarting it with ` +
            `OLLAMA_ORIGINS="${typeof window !== 'undefined' ? window.location.origin : '*'}", ` +
            `or run the dashboard locally with "npm run dev".`
          : ` ${url} is not an Ollama chat endpoint. The Server URL should be just the host ` +
            `(e.g. ${DEFAULT_OLLAMA_BASE_URL}) with no path - check it in Settings.`;
      }

      console.error(`%c❌ Ollama Error: ${response.status}`, 'color: red; font-weight: bold;');
      console.error('Details:', details);

      apiCallTracker.logCall({
        timestamp: Date.now(),
        provider: 'ollama',
        model,
        duration,
        success: false,
        error: `${response.status}: ${details}`
      });

      throw new Error(`Ollama API error (${response.status}): ${details || '(empty response)'}.${hint}`);
    }

    const duration = performance.now() - startTime;
    console.log(`%c✅ Ollama Response in ${duration.toFixed(2)}ms`, 'color: #22d3ee; font-size: 11px;');

    const data = await parseOllamaJson(response, url);
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

// ---------------------------------------------------------------------------
// Vision (image) support - used by the Pre-Market chart analyser.
// Only Gemini (cloud) and Ollama (local) are wired up; the remaining providers
// fall back to whichever of those two is configured.
// ---------------------------------------------------------------------------

export type VisionProviderId = 'gemini' | 'ollama';

/** Strips a `data:image/png;base64,` prefix so only raw base64 is sent. */
function toBase64Payload(image: string): string {
  return image.includes(',') ? image.split(',')[1] : image;
}

function detectMimeType(image: string): string {
  const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  return match ? match[1] : 'image/jpeg';
}

/**
 * Picks the provider used for image prompts.
 * Ollama is honoured as-is; text-only cloud providers degrade to Gemini when a
 * key exists, otherwise to a local Ollama vision model.
 */
export function resolveVisionProvider(credentials: FyersCredentials): VisionProviderId {
  const provider = credentials.aiProvider || 'gemini';
  if (provider === 'ollama') return 'ollama';
  if (credentials.googleApiKey) return 'gemini';
  return 'ollama';
}

/** Human readable label for the vision engine, for UI badges. */
export function getVisionProviderLabel(credentials: FyersCredentials): string {
  if (resolveVisionProvider(credentials) === 'ollama') {
    return `Local Llama · ${credentials.ollamaVisionModel || DEFAULT_OLLAMA_VISION_MODEL}`;
  }
  return `Gemini · ${credentials.geminiModel || 'gemini-2.0-flash'}`;
}

/** True when an image prompt can actually be served right now. */
export function isVisionConfigured(credentials: FyersCredentials): boolean {
  // Ollama needs no key - it is local - so vision is always attemptable there.
  return resolveVisionProvider(credentials) === 'ollama' || !!credentials.googleApiKey;
}

/**
 * Sends a prompt plus one or more images to the configured vision provider.
 * Images may be data URLs or bare base64.
 */
export async function callAIVision(
  credentials: FyersCredentials,
  prompt: string,
  images: string[],
  options?: { maxTokens?: number; temperature?: number; jsonMode?: boolean }
): Promise<string> {
  const maxTokens = options?.maxTokens ?? 400;
  const temperature = options?.temperature ?? 0.3;
  const jsonMode = options?.jsonMode ?? false;

  if (resolveVisionProvider(credentials) === 'ollama') {
    return callOllamaVision(
      credentials.ollamaBaseUrl,
      prompt,
      images,
      credentials.ollamaVisionModel || DEFAULT_OLLAMA_VISION_MODEL,
      maxTokens,
      temperature,
      jsonMode
    );
  }

  if (!credentials.googleApiKey) {
    throw new Error('No vision-capable AI configured. Add a Gemini API key or switch to Ollama with a vision model.');
  }

  return callGeminiVision(
    credentials.googleApiKey,
    prompt,
    images,
    credentials.geminiModel || 'gemini-2.0-flash',
    maxTokens,
    temperature,
    jsonMode
  );
}

async function callGeminiVision(
  apiKey: string,
  prompt: string,
  images: string[],
  model: string,
  maxTokens: number,
  temperature: number,
  jsonMode: boolean = false
): Promise<string> {
  console.log(`%c📡 Calling Gemini Vision (${model})`, 'color: green; font-size: 11px;');
  const startTime = performance.now();

  try {
    const parts: any[] = images.map(img => ({
      inlineData: { mimeType: detectMimeType(img), data: toBase64Payload(img) }
    }));
    parts.push({ text: prompt });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            ...(jsonMode ? { responseMimeType: 'application/json' } : {})
          }
        })
      }
    );

    const duration = performance.now() - startTime;

    if (!response.ok) {
      const details = (await response.text().catch(() => '')).slice(0, 300);
      apiCallTracker.logCall({
        timestamp: Date.now(), provider: 'gemini', model, duration,
        success: false, error: `${response.status}: ${details}`
      });
      throw new Error(`Gemini vision error (${response.status}): ${details}`);
    }

    const data = await response.json();
    apiCallTracker.logCall({ timestamp: Date.now(), provider: 'gemini', model, duration, success: true });

    return (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
  } catch (error: any) {
    if (!/Gemini vision error/.test(error?.message || '')) {
      apiCallTracker.logCall({
        timestamp: Date.now(), provider: 'gemini', model,
        duration: performance.now() - startTime, success: false, error: error?.message
      });
    }
    throw error;
  }
}

async function callOllamaVision(
  baseUrl: string | undefined,
  prompt: string,
  images: string[],
  model: string,
  maxTokens: number,
  temperature: number,
  jsonMode: boolean = false
): Promise<string> {
  const url = normalizeOllamaBaseUrl(baseUrl);
  console.log(`%c📡 Calling Local Llama Vision (${model} @ ${url})`, 'color: #22d3ee; font-size: 11px;');
  const startTime = performance.now();

  try {
    const buildBody = (disableThinking: boolean) => JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt, images: images.map(toBase64Payload) }],
      stream: false,
      ...(jsonMode ? { format: 'json' } : {}),
      // Reasoning models spend the whole budget in `thinking` and return empty content,
      // so a second pass explicitly turns thinking off.
      ...(disableThinking ? { think: false } : {}),
      options: { temperature, num_predict: maxTokens }
    });

    let { response, viaProxy } = await ollamaFetch(url, '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: buildBody(false)
    });

    if (!response.ok) {
      const duration = performance.now() - startTime;
      const rawBody = await response.text().catch(() => '');
      let details = rawBody.slice(0, 200).replace(/\s+/g, ' ').trim();
      let hint = '';

      try {
        details = JSON.stringify(JSON.parse(rawBody));
        if (response.status === 404) {
          hint = ` Vision model "${model}" is not installed. Run: ollama pull ${model}`;
        }
      } catch {
        hint = viaProxy
          ? ` That reply came from this site's server, not from Ollama. Restart Ollama with ` +
            `OLLAMA_ORIGINS="${typeof window !== 'undefined' ? window.location.origin : '*'}" ` +
            `or run the dashboard locally with "npm run dev".`
          : ` ${url} is not an Ollama chat endpoint. The Server URL should be just the host ` +
            `(e.g. ${DEFAULT_OLLAMA_BASE_URL}) with no path - check it in Settings.`;
      }

      apiCallTracker.logCall({
        timestamp: Date.now(), provider: 'ollama', model, duration,
        success: false, error: `${response.status}: ${details}`
      });

      throw new Error(`Ollama vision error (${response.status}): ${details || '(empty response)'}.${hint}`);
    }

    const duration = performance.now() - startTime;
    let data = await parseOllamaJson(response, url);
    let text = (data?.message?.content || '').trim();

    // A reasoning model can burn the whole token budget on `thinking` and answer
    // with empty content - retry once with thinking disabled.
    if (!text && data?.message?.thinking) {
      const retry = await ollamaFetch(url, '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: buildBody(true)
      });
      if (retry.response.ok) {
        data = await parseOllamaJson(retry.response, url);
        text = (data?.message?.content || '').trim();
      }
    }

    apiCallTracker.logCall({
      timestamp: Date.now(), provider: 'ollama', model, duration: performance.now() - startTime, success: true,
      tokensUsed: (data?.prompt_eval_count || 0) + (data?.eval_count || 0)
    });

    if (!text) {
      throw new Error(
        `Ollama model "${model}" returned no text. Make sure it is a multimodal model ` +
        `(e.g. ${DEFAULT_OLLAMA_VISION_MODEL}) - text-only models ignore images.`
      );
    }

    return text;
  } catch (error: any) {
    if (!/Ollama vision error/.test(error?.message || '')) {
      apiCallTracker.logCall({
        timestamp: Date.now(), provider: 'ollama', model,
        duration: performance.now() - startTime, success: false, error: error?.message
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
