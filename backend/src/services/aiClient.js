import { config } from '../config/environment.js';

/**
 * HTTP Client to communicate with the internal AI/LLM microservice
 */
export async function fetchBenchmarkInsights(benchmarkData) {
  const targetUrl = `${config.aiServiceUrl.replace(/\/+$/, '')}/internal/insights`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(benchmarkData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI service responded with HTTP ${response.status}: ${errText}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`[AI Client] Notice: AI Microservice unreachable or failed at ${targetUrl} (${error.message}). Providing fallback response.`);

    return {
      explanation: `The AI explanation service is currently unavailable. The empirical benchmark measurements shown above are computed directly by the backend engine and remain fully accurate.`,
      source: 'offline',
      provider: 'AI unavailable',
      isOffline: true,
    };
  }
}
