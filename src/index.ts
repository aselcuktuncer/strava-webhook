import { Hono } from "hono";
import dotenv from "dotenv";
import { GEAR_ID, getActivityById, updateActivityById } from "./activity";
import { getAccessToken } from "./auth";

dotenv.config();

export const STRAVA_API = "https://www.strava.com/api/v3";
const SHORT_TRAINING_TYPES = new Set(["Yoga", "Workout", "WeightTraining"]);

const parseBooleanEnv = (value: string | undefined, defaultValue: boolean) => {
  if (!value) return defaultValue;
  return value.toLowerCase() === "true";
};

const IS_COMMUTE_HIDE_FROM_FEED_ENABLED = parseBooleanEnv(
  process.env.IS_COMMUTE_HIDE_FROM_FEED_ENABLED,
  false
);
const IS_SHORT_TRAINING_HIDE_ENABLED = parseBooleanEnv(
  process.env.IS_SHORT_TRAINING_HIDE_ENABLED,
  true
);
const SHORT_TRAINING_MAX_MINUTES = Number(
  process.env.SHORT_TRAINING_MAX_MINUTES || 30
);

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

  if (
    IS_COMMUTE_HIDE_FROM_FEED_ENABLED &&
    act &&
    act.commute &&
    act.type === "Ride" &&
    !act.gear_id
  ) {
    await updateActivityById(token, act.id, {
      gear_id: GEAR_ID,
      hide_from_home: true,
    });
    console.log(
      `[${new Date().toISOString()}] Updated activity ${act.name} (${act.id}) `
    );
  }

  if (IS_SHORT_TRAINING_HIDE_ENABLED && act) {
    const activityType = act.sport_type || act.type;
    const isShortTrainingType = SHORT_TRAINING_TYPES.has(activityType);
    const isShortDuration =
      typeof act.elapsed_time === "number" &&
      act.elapsed_time < SHORT_TRAINING_MAX_MINUTES * 60;
    const isAlreadyHidden = act.hide_from_home === true;

    if (isShortTrainingType && isShortDuration && !isAlreadyHidden) {
      await updateActivityById(token, act.id, {
        hide_from_home: true,
      });
      console.log(
        `[${new Date().toISOString()}] Hid short training activity ${act.name} (${act.id}) type=${activityType} elapsed_time=${act.elapsed_time}s`
      );
    }
  }

  return c.text("OK");
});

export default app;
