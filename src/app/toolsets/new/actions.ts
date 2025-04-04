"use server"

import { auth0 } from "@/lib/auth0";
import { registerMcpAndCreateAuth0Connection } from "@/lib/register-mcp-server-as-auth0-connection";
import { notFound } from "next/navigation";
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
  const session = await auth0.getSession();

  if (!session) {
    notFound();
  }

  const { data: mcpDiscovery, success, error } = mcpDiscoverySchema.safeParse(params);

  if (!success) {
    return {
        error: "invalid_request",
        error_description: "Invalid of unexpected input",
        errors: error.flatten()
    }
  }

  try {
    const newlyRegisteredConnection = await registerMcpAndCreateAuth0Connection(
        mcpDiscovery.url, 
        mcpDiscovery.authzNegotationMethod, 
        session.user.sub
    );
    const { name } = newlyRegisteredConnection;

    return {
        name,
    };
  } catch (err) {
    return {
        error: "failed_to_setup_mcp",
        error_description: (err as any).toString()
    };
  }
}

