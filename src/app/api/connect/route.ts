import { requestAccessTo } from "@/app/tools/connect-tool";
import { registry } from "@/app/tools/registry";
import { NextRequest, NextResponse } from "next/server";

/**
 * This function will start run the authorization_code
 * flow with Auth0 and add a tool to token vault.
 */
export async function GET(request: NextRequest) {
    const toolName = request.nextUrl.searchParams.get("tool");
    if (!toolName) {
        return new NextResponse("Invalid Request", {
            status: 400,
            statusText: "Bad Request",
        });
    }

    if (toolName.startsWith("mcp-")) {
        return requestAccessTo({
            connectionName: toolName,
            connectionScopes: [],
        })
    }

    if (!Object.keys(registry).includes(toolName)) {
        return new NextResponse("Unknown Tool", {
            status: 404,
            statusText: "Tool Not Found",
        });
    }

    return requestAccessTo(
        registry[toolName]
    );
}