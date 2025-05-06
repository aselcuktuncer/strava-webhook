import dotenv from "dotenv";
import { STRAVA_API } from "./index";

dotenv.config();

export interface Activity {
  id: number;
  name: string;
  commute: boolean;
  gear_id: string | null;
  type: string;
}

export const GEAR_ID = process.env.STRAVA_COMMUTE_BIKE_ID;

export const getActivityById = async (
  token: string,
  activityId: number
): Promise<Activity | null> => {
  try {
    const res = await fetch(`${STRAVA_API}/activities/${activityId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(
        `[${new Date().toISOString()}] Strava API error for activity ${activityId}: ${
          res.status
        } - ${errorText}`
      );
      return null;
    }

    return res.json();
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] Failed to fetch activity ${activityId}:`,
      err
    );
    return null;
  }
};

export const updateActivityById = async (
  accessToken: string,
  id: number,
  update: { gear_id?: string; hide_from_home?: boolean }
) => {
  const res = await fetch(`${STRAVA_API}/activities/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(update),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `[${new Date().toISOString()}] Failed to update activity ${id}: ${
        res.status
      } - ${text}`
    );
  }
};
