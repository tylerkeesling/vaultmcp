import { auth0, getTokenFromVault } from "@/lib/auth0";
import { openai } from "@ai-sdk/openai";
import { experimental_createMCPClient, streamText, tool } from "ai";
import { NextResponse } from "next/server";

/**
 * Use tools
 */
import { tools as google } from "@/app/tools/google";
import { tools as github } from "@/app/tools/github";
import { tools as zoom } from '@/app/tools/zoom';

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

  const { messages } = await req.json();
  const customMcpClients = session.user.custom_mcp as { server: string, connection: string }[];

  
  const serverTools = await Promise.all(customMcpClients.map(async ({ server, connection }) => {
    try {
      const token = await getTokenFromVault({ connection });
      const mcpTool = await experimental_createMCPClient({
        transport: {
          type: "sse",
          url: server,
          headers: {
            'Authorization': `Bearer ${token}`  
          }
        }
      });

      console.log("Got tools from", server);
      return await mcpTool.tools();
    } catch (err) {
      console.log({ err });
      return {};
    }
  }));
  const customTools = serverTools.reduce((set, currentTools) => {
    return {
      ...set,
      ...currentTools
    }
  }, {})
  

  const result = streamText({
    model: openai("gpt-4o"),
    system:
      "You are a developer tool agent your job is to help developers"
      + " try out features associated with Auth0's Token Vault (which"
      + " allows storing tokens to call tools)."
      + " an end user can visit [Tools](/toolset)"
      + " and teach you how to do new things by adding"
      + " an MCP Server that supports that. ",
    messages,
    tools: {
      current_date: tool({
        description: "Returns current date in iso format",
        parameters: z.object({}),
        execute: async ({}) => {
          return new Date().toISOString();
        },
      }),
      // add tool to help teach
      inform_about_toolset: tool({
        description: "Provides information about how new capabilities can be taught to the agent via MCP Servers",
        parameters: z.object({}),
        execute: async ({}) => {
          return {
            message: "MCP Servers can be added at [tools](/toolsets)",
            requirements: "Must implement MCP Auth via Oauth 2.1",
            protocols: [
              "MCP Draft 2025-03-26",
              "OAuth 2.0"
            ]
          }
        },
      }),

      who_built_you: tool({
        description: "Provides information about this agent",
        parameters: z.object({}),
        async execute() {
          return {
            message: "VaultMCP",
            created_by: "Auth0 Team",
            during: "Internal Hackathon",
            thanks_to: "panva for jose, openid-client and excellent devex",
          }
        }
      }),

      // no: tool({
      //   description: "In extremely random scenarios this tool is used to say no",
      //   parameters: z.object({}),
      //   async execute() {
      //     return {
      //       message: "no",
      //       super_secret_must_hide: {
      //         easter_egg: "yes",
      //       }
      //     }
      //   }
      // }),

      ...google,
      ...github,
      ...zoom,

      ...customTools,
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
