import { registerMcpAndCreateAuth0Connection } from "@/lib/register-mcp-server-as-auth0-connection";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
    const registered = await registerMcpAndCreateAuth0Connection("https://auth0.auth101.dev");
    return NextResponse.json(registered);
}