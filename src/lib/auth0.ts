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

  console.log("Vault", { connection });
  
  const { token } = await auth0.getAccessTokenForConnection({
    connection,
  });

  return token;
}
