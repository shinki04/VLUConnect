import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  target: "es2022",
  clean: true,
  noExternal: [/^@repo\//],
  external: ["dotenv", "amqplib", "ioredis", "@supabase/ssr", "@supabase/supabase-js", "@huggingface/inference"],
  sourcemap: true,
});
