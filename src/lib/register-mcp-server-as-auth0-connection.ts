import * as client from "openid-client";
import { manage } from "./auth0-manage";

/**
 * Extracts base authorization URL by stripping path from MCP URL
 */
function getAuthorizationBaseUrl(mcpUrl: string): string {
  const parsed = new URL(mcpUrl);
  parsed.pathname = "";
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

/**
 * Attempts to discover Authorization Server Metadata per RFC8414
 * Falls back to static endpoints if discovery fails
 */
export async function discoverOrFallback(server: string) {
  try {
    const issuer = await client.dynamicClientRegistration(
      new URL(server),
      {
        client_name: "VaultMCP",
        redirect_uris: ["https://auth0.vaultmcp.ai/login/callback"],
        grant_types: ["authorization_code", "refresh_token"],
        token_endpoint_auth_method: "client_secret_post",
      },
      client.None,
      {
        algorithm: "oidc",
        timeout: 5,
      }
    );

    console.log("✅ Discovered metadata at:", issuer);
    console.log(`Registered: ${issuer.clientMetadata()}`);

    return issuer;
  } catch (err) {
    console.warn("⚠️ Discovery failed, using fallback endpoints", err);
    throw err;
  }
}

/**
 * Creates an Auth0 OIDC connection with the MCP credentials
 */
async function createAuth0Connection(
  details: {
    authorization_endpoint: string;
    jwks_uri: string;
    issuer: string;
    client_id: string;
    client_secret: string;
    token_endpoint: string;
  },
  { owner_sub }: { owner_sub: string }
) {
  const name = `mcp-${details.client_id}`
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "");

  const { data: connection } = await manage.connections.create({
    name,
    strategy: "oidc",
    options: {
      ...details, // what we got from discovery
      type: "back_channel",
      // default scopes
      scopes: "openid profile email",
      token_endpoint_auth_method: "client_secret_post",
      federated_connection_access_token: {
        active: true,
      },
    },
    metadata: {
      owner_sub: owner_sub,
      status: "un-approved",
    },
    enabled_clients: [
      process.env.CLIENT_INITIATED_ACCOUNT_LINKING_ACTION_CLIENT_ID!,
    ],
  });

  return connection;
}

/**
 * Main flow: Discover & Register -> Create Connection Auth0
 */
export async function registerMcpAndCreateAuth0Connection(
  mcpUrl: string,
  ownerSub: string
) {
  const authBase = getAuthorizationBaseUrl(mcpUrl);
  const issuer = await discoverOrFallback(authBase);
  const client = issuer.clientMetadata();
  const server = issuer.serverMetadata();

  return await createAuth0Connection(
    {
      client_id: client.client_id,
      client_secret: client.client_secret!,
      authorization_endpoint: server.authorization_endpoint!,
      issuer: server.issuer,
      jwks_uri: server.jwks_uri!,
      token_endpoint: server.token_endpoint!,
    },
    {
      owner_sub: ownerSub,
    }
  );
}
