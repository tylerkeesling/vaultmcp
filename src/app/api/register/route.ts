import { auth0 } from "@/lib/auth0";
import { registerMcpAndCreateAuth0Connection } from "@/lib/register-mcp-server-as-auth0-connection";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
    const session = await auth0.getSession();
    if (!session) {
        notFound();
    }


    const registered = await registerMcpAndCreateAuth0Connection("https://mcp-auth0-oidc.sandrino.run/sse", session.user.sub);
    return NextResponse.json(registered);
}