"use server";

import { auth0 } from "@/lib/auth0";
import { manage } from "@/lib/auth0-manage";
import type { DeleteUserIdentityByUserIdProviderEnum } from "auth0";
import { notFound } from "next/navigation";

/**
 * 
 */
export async function removeTool(toolName: string, toolIdentity: string) {
    const session = await auth0.getSession();
    if (!session) {
        notFound();
    }

    if (toolName.startsWith("mcp-")) {
        // toolIdentity = toolIdentity;
        toolName = toolName.startsWith("mcp-oauth2-")  ? "oauth2" :  "oidc";
    }

    console.log({
        toolName,
        toolIdentity
    });

    // This will unlink users
    await manage.users.unlink({
        id: session.user.sub,
        provider: toolName as DeleteUserIdentityByUserIdProviderEnum,
        user_id: toolIdentity, 
    });
}