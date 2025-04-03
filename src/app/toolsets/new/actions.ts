"use server"

import { experimental_createMCPClient } from "ai"
// Remove the incorrect import and use the standard Response object

export async function discoverMCPTools(url: string) {
  // Create a streaming response
  const encoder = new TextEncoder()
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

        const mcpClient = await experimental_createMCPClient({
          transport: {
            type: "sse",
            url: url,
          },
        })

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

