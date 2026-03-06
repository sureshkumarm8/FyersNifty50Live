import { GoogleGenAI } from "@google/genai";
import { FyersCredentials } from "../types";

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
    return callGroqAI(credentials.groqApiKey, systemInstruction, userContent, jsonMode);
  } else if (credentials.googleApiKey) {
    return callGeminiAI(credentials.googleApiKey, systemInstruction, userContent, jsonMode);
  } else {
    throw new Error('No valid AI API key configured');
  }
}

async function callGeminiAI(
  apiKey: string,
  systemInstruction: string,
  userContent: string,
  jsonMode: boolean = false
): Promise<string> {
  console.log('%c📡 Calling Gemini AI (gemini-2.5-flash)', 'color: green; font-size: 11px;');
  const startTime = performance.now();
  
  const ai = new GoogleGenAI({ apiKey });
  const config: any = { systemInstruction };
  
  // Only force JSON mode if explicitly requested
  if (jsonMode) {
    config.responseMimeType = "application/json";
  }
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userContent,
    config
  });
  
  const duration = (performance.now() - startTime).toFixed(2);
  console.log(`%c✅ Gemini Response in ${duration}ms`, 'color: green; font-size: 11px;');
  
  return response.text || '{}';
}

async function callGroqAI(
  apiKey: string,
  systemInstruction: string,
  userContent: string,
  jsonMode: boolean = false
): Promise<string> {
  const model = 'llama-3.3-70b-versatile';
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

  const duration = (performance.now() - startTime).toFixed(2);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error(`%c❌ Groq Error: ${response.status}`, 'color: red; font-weight: bold;');
    console.error('Details:', errorData);
    throw new Error(`Groq API error (${response.status}): ${JSON.stringify(errorData)}`);
  }

  console.log(`%c✅ Groq Response in ${duration}ms`, 'color: purple; font-size: 11px;');
  
  const data = await response.json();
  const responseText = data.choices?.[0]?.message?.content || '{}';
  
  if (!jsonMode) {
    // Return plain text response
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
