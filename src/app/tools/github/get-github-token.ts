import { auth0, getTokenFromVault } from "@/lib/auth0";
import { auth0AI } from "@/lib/auth0-ai";
import { ToolExecutionOptions } from "ai";

export const GITHUB_CONNECTION_NAME = "github";

export async function getGithubToken() {
  const ghToken = await getTokenFromVault({
    connection: GITHUB_CONNECTION_NAME,
  });

  return ghToken;
}
