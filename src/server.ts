import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import app from "./index";

dotenv.config();

const port = Number(process.env.PORT || 3000);

console.log(`🚀 Server running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
