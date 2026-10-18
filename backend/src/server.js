import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import { app } from './app.js';
import { config } from './config/environment.js';
import { connectDatabase } from './config/database.js';

async function startServer() {
    // Attempt MongoDB connection (non-fatal if MongoDB is not running)
    await connectDatabase();

    app.listen(config.port, () => {
        console.log(`[CacheWise Backend] Server running on http://localhost:${config.port}`);
        console.log(`[CacheWise Backend] Active default strategy: ${config.defaultCacheStrategy}`);
    });
}

startServer().catch((err) => {
    console.error('[CacheWise Backend] Fatal startup error:', err);
    process.exit(1);
});