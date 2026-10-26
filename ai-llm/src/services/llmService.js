import { config } from '../config/environment.js';

/**
 * Call Google Gemini REST API using native fetch
 */
async function callGemini(prompt) {
  if (!config.geminiApiKey) {
    return null;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.llmTimeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[AI-LLM Service] Gemini API returned error HTTP ${response.status}:`, errText);
      return null;
    }

    const data = await response.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidate ? candidate.trim() : null;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[AI-LLM Service] Gemini request failed or timed out: ${err.message}`);
    return null;
  }
}

/**
 * Call OpenAI REST API using native fetch
 */
async function callOpenAI(prompt) {
  if (!config.openaiApiKey) {
    return null;
  }

  const url = 'https://api.openai.com/v1/chat/completions';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.llmTimeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: config.openaiModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[AI-LLM Service] OpenAI API returned error HTTP ${response.status}:`, errText);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[AI-LLM Service] OpenAI request failed or timed out: ${err.message}`);
    return null;
  }
}

/**
 * Unified LLM Dispatcher
 *
 * @param {string} prompt
 * @returns {Promise<{ content: string, provider: string } | null>}
 */
export async function requestLlmCompletion(prompt) {
  if (config.llmProvider === 'gemini' && config.geminiApiKey) {
    const content = await callGemini(prompt);
    if (content) return { content, provider: 'Gemini AI' };
  }

  if ((config.llmProvider === 'openai' || !config.geminiApiKey) && config.openaiApiKey) {
    const content = await callOpenAI(prompt);
    if (content) return { content, provider: 'OpenAI' };
  }

  return null;
}

