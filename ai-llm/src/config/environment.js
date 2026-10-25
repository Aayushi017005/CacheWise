import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: parseInt(process.env.PORT, 10) || 5001,
    nodeEnv: process.env.NODE_ENV || 'development',
    llmProvider: (process.env.LLM_PROVIDER || 'gemini').toLowerCase(),
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    llmTimeoutMs: parseInt(process.env.LLM_TIMEOUT_MS, 10) || 8000,
};