# Strava Webhook Listener

A lightweight webhook service that listens for [Strava](https://www.strava.com/) activity updates and applies optional automation rules:

- Commute bike tagging + hide-from-feed automation (feature-flagged).
- Hide short training activities from feed for `Yoga`, `Workout`, and `WeightTraining` when duration is under a configurable threshold (default: 30 minutes).

---

## Tech

| Tech                                         | Purpose                                                    |
| -------------------------------------------- | ---------------------------------------------------------- |
| [Hono](https://hono.dev/)                    | Fast, lightweight web framework for handling requests.     |
| [Strava API](https://developers.strava.com/) | Webhook registration, activity access, and update actions. |
| [Render](https://render.com/)                | Free-tier deployment of the listener server.               |
| [UptimeRobot](https://uptimerobot.com/)      | Keeps the Render app alive by pinging the app regularly.   |

---

## Deployment (on Render.com)

Follow these steps to deploy your Strava Webhook Listener using Render’s free hosting:

1. **Fork this repository** and push it to your own GitHub account.

2. Go to [Render](https://render.com/) and create a **new Web Service**.

3. Choose **"Deploy from GitHub"** and select your forked repository.

4. Configure your **environment variables**:

   - `STRAVA_CLIENT_ID` – Your Strava app client ID.
   - `STRAVA_CLIENT_SECRET` – Your Strava app client secret.
   - `STRAVA_REFRESH_TOKEN` – A valid refresh token with `activity:read_all` access to read and modify activities.
   - `STRAVA_COMMUTE_BIKE_ID` – The gear ID of your commuter bike (from your Strava profile).
   - `IS_COMMUTE_HIDE_FROM_FEED_ENABLED` – Set to `true` to enable commute bike tagging/hide rule (default: `false`).
   - `IS_SHORT_TRAINING_HIDE_ENABLED` – Set to `true` to enable short-training hide rule (default: `true`).
   - `SHORT_TRAINING_MAX_MINUTES` – Duration threshold in minutes for short-training hide rule (default: `30`).

5. Set the **build and start commands**:

   - If you're using TypeScript:
     ```bash
     npm run build
     ```
     Then set the **start command**:
     ```bash
     npm start
     ```

6. After deployment, you’ll receive a public URL (e.g., `https://your-app.onrender.com`).

7. **Register the webhook endpoint with Strava**:

   - Go to [Strava Webhook Docs](https://developers.strava.com/docs/webhooks/) and follow the steps to:
     - Subscribe to webhook events using your Render URL (e.g., `https://your-app.onrender.com/webhook`).
     - Verify the webhook via challenge-response as per Strava's requirement.

8. **Set up UptimeRobot** to ping a simple health check endpoint like `/healthz` and keep your app alive.
