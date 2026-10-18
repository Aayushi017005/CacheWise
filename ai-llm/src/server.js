import { app } from './app.js';
import { config } from './config/environment.js';

app.listen(config.port, () => {
  console.log(`[CacheWise AI-LLM] Service listening on http://localhost:${config.port}`);
  console.log(`[CacheWise AI-LLM] Configured Provider: ${config.llmProvider}`);
  console.log(`[CacheWise AI-LLM] Gemini Key Present: ${Boolean(config.geminiApiKey)}`);
  console.log(`[CacheWise AI-LLM] OpenAI Key Present: ${Boolean(config.openaiApiKey)}`);
});

