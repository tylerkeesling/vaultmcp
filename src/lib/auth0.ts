import { OAuth2Error } from "@auth0/nextjs-auth0/errors";
import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: process.env.AUTH0_SCOPE,
  },
  async beforeSessionSaved(session, idToken) {
    return {
      ...session,
      user: {
        ...session.user,
        id_token: idToken,
      },
    };
  },
});

/**
 *
 * @param connection
 * @returns
 */
export async function getTokenFromVault({
  connection,
}: {
  connection: string;
}) {
  const session = auth0.getSession();
  if (session === null) {
    throw new Error("Unauthorized");
  }

  try {
    const { token } = await auth0.getAccessTokenForConnection({
      connection,
    });  
    return token;
  } catch (err:any) {
    err = err.cause ? err.cause : err;
    if (err instanceof OAuth2Error && err.message === "Identity User not found.") {
      throw new BotReadableError("User has not connected this account to fix the user should visit [Tools](/toolsets) and connect Google by Karan Chhina");
    }
    throw err;
  }

}

export class BotReadableError extends Error {

}

export function t<T extends (...args: any[]) => Promise<any>>(t: T): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T> | string> => {
    try {
      return await t(...args);
    } catch (err: any) {
      if (err instanceof BotReadableError) {
        return "Unable to fetch the data, reason: " + err.message;
      }
      return "Unexpected Error performing the task: " + (err?.message || String(err));
    }
  }) as T;
}
