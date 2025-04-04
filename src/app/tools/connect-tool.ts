import { auth0 } from "@/lib/auth0";
import { ToolSetInfo } from "./toolset";

/**
 * Given a toolset crafts a url to request account_linking
 * @param toolsetInfo
 * @returns
 */
export async function requestAccessTo(
  toolsetInfo: Pick<ToolSetInfo, "connectionName" | "connectionScopes">
) {
  const session = await auth0.getSession();

  if (session === null) {
    throw new Error("Unauthorized");
  }

  return auth0.startInteractiveLogin({
    authorizationParameters: {
      id_token_hint: session.user.id_token,
      requested_connection: toolsetInfo.connectionName,
      requested_connection_scope: toolsetInfo.connectionScopes.join(" "),
      scope: process.env.AUTH0_SCOPE + " link_account",
      audience: process.env.AUTH0_AUDIENCE,
    },
  });
}
