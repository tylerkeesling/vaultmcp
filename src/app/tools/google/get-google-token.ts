import { auth } from "@googleapis/calendar";
import { getTokenFromVault } from "@/lib/auth0";

export const GOOGLE_CONNECTION_NAME = "google-oauth2";

export async function getGoogleAuth() {
  const googleToken = await getTokenFromVault({
    connection: GOOGLE_CONNECTION_NAME,
  });
  const gauth = new auth.OAuth2();
  gauth.setCredentials({
    access_token: googleToken,
  });
  return gauth;
}