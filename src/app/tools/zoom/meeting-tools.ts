import { tool } from "ai";
import { z } from "zod";
import { getZoomToken } from "./get-zoom-token";

export const get_zoom_meeting_details = tool({
  description: "Fetch full details of a specific Zoom meeting",
  parameters: z.object({
    meeting_id: z.string(),
  }),
  execute: async ({ meeting_id }) => {
    const res = await fetch(`https://api.zoom.us/v2/meetings/${meeting_id}`, {
      headers: {
        Authorization: `Bearer ${await getZoomToken()}`,
      },
    });

    if (!res.ok) throw new Error("Failed to get Zoom meeting details");
    return await res.json();
  },
});

export const get_zoom_meeting_invitation = tool({
  description: "Get the invitation text for a Zoom meeting",
  parameters: z.object({
    meeting_id: z.string(),
  }),
  execute: async ({ meeting_id }) => {
    const res = await fetch(
      `https://api.zoom.us/v2/meetings/${meeting_id}/invitation`,
      {
        headers: {
          Authorization: `Bearer ${await getZoomToken()}`,
        },
      }
    );

    if (!res.ok) throw new Error("Failed to get Zoom meeting invitation");
    return await res.text(); // this endpoint returns plain text
  },
});

export const get_zoom_user_email = tool({
  description: "Get the authenticated Zoom user’s email address",
  parameters: z.object({}),
  execute: async () => {
    const res = await fetch("https://api.zoom.us/v2/users/me", {
      headers: {
        Authorization: `Bearer ${await getZoomToken()}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch Zoom user info");
    const data = await res.json();
    return { email: data.email, user_id: data.id };
  },
});

export const get_zoom_meeting_summary = tool({
  description: "Fetch AI-generated summary for a Zoom meeting",
  parameters: z.object({
    meeting_id: z.string(),
  }),
  execute: async ({ meeting_id }) => {
    const res = await fetch(
      `https://api.zoom.us/v2/meetings/${meeting_id}/summary`,
      {
        headers: {
          Authorization: `Bearer ${await getZoomToken()}`,
        },
      }
    );

    if (!res.ok) throw new Error("Failed to fetch meeting summary");
    return await res.json();
  },
});
