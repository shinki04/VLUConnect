import { startPostWorker } from "./consumers/postWorker";

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });

startPostWorker();

console.log("WORKER", process.argv[1]);
