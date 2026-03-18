// Load environment variables FIRST before any other imports
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });

// Now import other modules (they will have access to env vars)
import { createServer } from "http";

import { startPostWorker } from "./consumers/postWorker.js";
import { startReportWorker } from "./consumers/reportWorker.js";

// Start all workers
startPostWorker();
startReportWorker();

console.log("WORKER", process.argv[1]);

// Simple HTTP server for health checks
const port = process.env.PORT || 3001;
const server = createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(port, () => {
  console.log(`Health check server listening on port ${port}`);
});
