import { auth0 } from "@/lib/auth0";
import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { NextResponse } from "next/server";

import { tools as google } from "@/app/tools/google";
import { tools as github } from "@/app/tools/github";

import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth0.getSession();

  if (!session) {
    return new NextResponse("Unauthorized", {
      status: 401,
      statusText: "Unauthorized",
    });
  }

  const { messages, tools } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system:
      "You are a developer tool agent your job is to help developers try out features associated with Auth0's Token Vault (which allows storing tokens to call tools).",
    messages,
    tools: {
      current_date: tool({
        description: "Returns current date in iso format",
        parameters: z.object({}),
        execute: async ({}) => {
          return new Date().toISOString();
        },
      }),
      ...google,
      ...github,
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
