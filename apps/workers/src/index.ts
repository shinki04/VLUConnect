// Load environment variables FIRST before any other imports
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });

// Now import other modules (they will have access to env vars)
import { startPostWorker } from "./consumers/postWorker.js";
import { startReportWorker } from "./consumers/reportWorker.js";

// Start all workers
startPostWorker();
startReportWorker();

console.log("WORKER", process.argv[1]);
