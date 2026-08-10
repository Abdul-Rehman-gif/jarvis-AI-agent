/**
 * Entry point. Loads .env.local FIRST, then dynamically imports the real
 * server. This matters because plain `import` statements are hoisted and
 * always execute before the importing file's own top-level code - so if
 * dotenv.config() lived inside server.ts itself, every module server.ts
 * statically imports (wsAgentServer.ts, agentBridge.ts, gemini.ts) would
 * already have read process.env - and generated their own random
 * fallback values - before dotenv had a chance to populate it.
 *
 * A dynamic import() here defers loading server.ts (and everything it
 * imports) until after dotenv.config() below has actually run.
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

await import("./server.js");
