import { z } from "zod";
import { tool } from "ai";
import { getGoogleAuth } from "./get-google-token";
import * as google from "@googleapis/calendar";

export const create_google_event = tool({
  description: "Create an event in Google Calendar",
  parameters: z.object({
    calendarId: z.string().describe("The calendar ID to create the event in"),
    summary: z.string().describe("The event summary"),
    start: z.string().describe("The event start time"),
    end: z.string().describe("The event end time"),
  }),
  execute: async ({ calendarId, summary, start, end }) => {
    try {
      const instance = google.calendar({
        version: "v3",
        auth: await getGoogleAuth(),
      });
      const event = {
        summary,
        start: {
          dateTime: start,
          timeZone: "America/New_York",
        },
        end: {
          dateTime: end,
          timeZone: "America/New_York",
        },
      };

      const response = await instance.events.insert({
        calendarId,
        requestBody: event,
      });

      return response.data;
    } catch (error: any) {
      throw new Error("Error creating event:", error.toString());
    }
  },
});

export const list_calendars = tool({
  description: "Get a list of calendars from Google Calendar",
  parameters: z.object({}),
  execute: async () => {
    const auth = await getGoogleAuth();
    const calendar = google.calendar({ version: "v3", auth });

    const response = await calendar.calendarList.list({
      fields: "items(id,summary,timeZone)",
    });

    return response.data.items;
  },
});



export const list_calendar_events = tool({
    description: "Get a list of events from Google Calendar",
    parameters: z.object({
      calendarId: z.string().describe("The calendar ID to get the events for"),
      maxResults: z.number().default(10).describe("The maximum number of events to return"),
      start: z.string().optional().describe("The start time of the events to get"),
      end: z.string().optional().describe("The end time of the events to get"),
    }),
    execute: async ({ calendarId, maxResults, start, end }) => {
      const auth = await getGoogleAuth();
      const calendar = google.calendar({ version: "v3", auth });
  
      const timeMin = start ? new Date(start).toISOString() : new Date().toISOString();
      const timeMax = end
        ? new Date(end).toISOString()
        : new Date(new Date(timeMin).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
      const response = await calendar.events.list({
        calendarId,
        maxResults: maxResults + 1,
        fields: "items(summary,start,end,location)",
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
      });
  
      return response.data.items;
    },
  });