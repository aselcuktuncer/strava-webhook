import { Hono } from "hono";
import dotenv from "dotenv";
import { GEAR_ID, getActivityById, updateActivityById } from "./activity";
import { getAccessToken } from "./auth";

dotenv.config();

export const STRAVA_API = "https://www.strava.com/api/v3";

interface StravaWebhookEvent {
  aspect_type: "create" | "update" | "delete";
  event_time: number;
  object_id: number;
  object_type: "activity" | "athlete" | string;
  owner_id: number;
  subscription_id: number;
  updates: Record<string, string>;
}

const app = new Hono();

app.get("/healthz", (c) => c.json({ status: "ok", uptime: process.uptime() }));

app.get("/cidom", (c) => {
  return c.json({
    message:
      "Hi Cidom. You're the heart behind every heartbeat of this app. With love, from Selcuk <3",
    status: "ok when you are happy",
  });
});

app.get("/webhook", (c) => {
  console.log("📥 Webhook verification request received");

  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");

  if (mode === "subscribe" && token === process.env.STRAVA_VERIFY_TOKEN) {
    return c.json({ "hub.challenge": challenge });
  }

  return c.text("Forbidden", 403);
});

app.post("/webhook", async (c) => {
  const body: StravaWebhookEvent = await c.req.json();

  console.log(
    `[${new Date().toISOString()}] Webhook received:`,
    JSON.stringify(body)
  );

  const token = await getAccessToken();

  const act = await getActivityById(token, body.object_id);

  if (act && act.commute && act.type === "Ride" && !act.gear_id) {
    await updateActivityById(token, act.id, {
      gear_id: GEAR_ID,
      hide_from_home: true,
    });
    console.log(
      `[${new Date().toISOString()}] Updated activity ${act.name} (${act.id}) `
    );
  }

  return c.text("OK");
});

export default app;
