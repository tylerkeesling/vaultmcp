import { auth0 } from "@/lib/auth0";
import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { NextResponse } from "next/server";

/**
 * Use tools
 */
import { tools as google } from "@/app/tools/google";
import { tools as github } from "@/app/tools/github";
import { tools as zoom } from '@/app/tools/zoom';
import * as todos from '@/app/tools/todos/todos';

import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  // const session = await auth0.getSession();

  // if (!session) {
  //   return new NextResponse("Unauthorized", {
  //     status: 401,
  //     statusText: "Unauthorized",
  //   });
  // }

  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system: "You are helpful agent that can help customers organize their day to day activities, you can note todos, keep track of them and interact with other tools they use daily",
    messages,
    tools: {
      current_date: tool({
        description: "Returns current date and time in iso format",
        parameters: z.object({}),
        execute: async ({}) => {
          return new Date().toISOString();
        },
      }),

      // First party tool
      ...todos,

      // Everyday apps
      ...google,
      ...github,
      // ...zoom,

    },
    maxSteps: 100,
  });

  return result.toDataStreamResponse({
    getErrorMessage(error) {
      console.error(error);
      return "no";
    },
  });
}
