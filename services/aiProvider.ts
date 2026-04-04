import { GoogleGenAI } from "@google/genai";
import { FyersCredentials } from "../types";

// API Call Tracker
interface APICallLog {
  timestamp: number;
  provider: 'gemini' | 'groq' | 'claude';
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
  if (provider === 'groq' && credentials.groqApiKey) {
    const model = credentials.groqModel || 'llama-3.3-70b-versatile';
    return callGroqAI(credentials.groqApiKey, systemInstruction, userContent, jsonMode, model);
  } else if (provider === 'claude' && credentials.claudeApiKey) {
    const model = credentials.claudeModel || 'claude-sonnet-4-6';
    return callClaudeAI(credentials.claudeApiKey, systemInstruction, userContent, jsonMode, model);
  } else if (credentials.googleApiKey) {
    const model = credentials.geminiModel || 'gemini-2.5-flash';
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
  model: string = 'gemini-2.5-flash'
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
  model: string = 'llama-3.3-70b-versatile'
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
  model: string = 'claude-sonnet-4-6'
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
