"use server"

import { experimental_createMCPClient } from "ai"
import { z } from 'zod';
// Remove the incorrect import and use the standard Response object

const mcpDiscoverySchema = z.object({
    url: z.string().url().describe("URL for the MCP Server"),
    authzNegotationMethod: z.enum([
        "draft", 
        "#195", 
        "#205"
    ]),
})



export async function discoverMCPTools(params: z.infer<typeof mcpDiscoverySchema>) {
  // Create a streaming response
  const encoder = new TextEncoder();
  const { data: mcpDiscovery, success, error } = mcpDiscoverySchema.safeParse(params);

  if (!success) {
    return {
        error: "invalid_request",
        error_description: "Invalid of unexpected input",
        errors: error.flatten()
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial connection message
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "status",
              message: "Initializing connection to MCP server...",
            }) + "\n",
          ),
        )

        // Create an MCP client using the SSE transport
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "status",
              message: "Creating MCP client...",
            }) + "\n",
          ),
        )

        // This will unfortunately blow up every now and then
        // if the session expires. :(
        const mcpClient = await experimental_createMCPClient({
          transport: {
            type: "sse",
            url: mcpDiscovery.url,
            headers: {

            }
          },
        })

        console.log({ mcpClient });

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "status",
              message: "MCP client created successfully. Discovering tools...",
            }) + "\n",
          ),
        )

        // Discover available tools
        const discoveredTools = await mcpClient.tools()

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "status",
              message: "Tools discovered successfully!",
            }) + "\n",
          ),
        )

        // Send the discovered tools
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "tools",
              data: discoveredTools,
            }) + "\n",
          ),
        )

        // Close the client to release resources
        await mcpClient.close()

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "status",
              message: "Connection closed successfully.",
            }) + "\n",
          ),
        )
      } catch (err) {
        console.log(err);
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "error",
              message: `Error: ${err instanceof Error ? err.message : String(err)}`,
            }) + "\n",
          ),
        )
      } finally {
        controller.close()
      }
    },
  })

  // Use the standard Response object instead of StreamingTextResponse
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

