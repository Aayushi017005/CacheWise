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
      explanation: `### AI Insights Offline Notice\nThe AI/LLM Microservice is currently offline at \`${config.aiServiceUrl}\`.\n\nTo enable automated AI explanations:\n1. Ensure the \`ai-llm/\` service is running (\`npm start\` in \`ai-llm/\` on port 5001).\n2. Optionally configure \`GEMINI_API_KEY\` in \`ai-llm/.env\`.\n\n*Empirical benchmark results above remain 100% accurate and measured directly in backend memory.*`,
      source: 'offline-fallback',
      provider: 'None (Service Offline)',
      isOffline: true,
    };
  }
}

