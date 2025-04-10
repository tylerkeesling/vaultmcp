import * as client from "openid-client";
import { manage } from "./auth0-manage";

/**
 * Some parts of this code are taken from
 * https://github.com/panva/oauth4webapi/blob/623164576dbd281ba3b1b1a6011871747ea72859/src/index.ts#L2445
 *
 * specifically for WWWAuthenticate Header parsing
 */

/**
 * @group Error Codes
 *
 * @see {@link WWWAuthenticateChallengeError}
 */
export const WWW_AUTHENTICATE_CHALLENGE = "WWW_AUTHENTICATE_CHALLENGE";

/**
 * Thrown when a server responds with WWW-Authenticate challenges, typically because of expired
 * tokens, or bad client authentication
 *
 * @example
 *
 * ```http
 * HTTP/1.1 401 Unauthorized
 * WWW-Authenticate: Bearer error="invalid_token",
 *                          error_description="The access token expired"
 * ```
 *
 * @group Errors
 */
export class WWWAuthenticateChallengeError extends Error {
  /**
   * The parsed WWW-Authenticate HTTP Header challenges
   */
  override cause: WWWAuthenticateChallenge[];

  code: typeof WWW_AUTHENTICATE_CHALLENGE;

  /**
   * The {@link !Response} that included a WWW-Authenticate HTTP Header challenges, its
   * {@link !Response.bodyUsed} is `true`
   */
  response: Response;

  /**
   * HTTP Status Code of the response
   */
  status: number;

  /**
   * @ignore
   */
  constructor(message: string, options: { cause: WWWAuthenticateChallenge[]; response: Response }) {
    super(message, options);
    this.name = this.constructor.name;
    this.code = WWW_AUTHENTICATE_CHALLENGE;
    this.cause = options.cause;
    this.status = options.response.status;
    this.response = options.response;
    Object.defineProperty(this, "response", { enumerable: false });

    Error.captureStackTrace?.(this, this.constructor);
  }
}

export interface WWWAuthenticateChallengeParameters {
  readonly realm?: string;
  readonly error?: string;
  readonly error_description?: string;
  readonly error_uri?: string;
  readonly algs?: string;
  readonly scope?: string;

  /**
   * NOTE: because the parameter names are case insensitive they are always returned lowercased
   */
  readonly [parameter: Lowercase<string>]: string | undefined;
}

export interface WWWAuthenticateChallenge {
  /**
   * NOTE: because the value is case insensitive it is always returned lowercased
   */
  readonly scheme: Lowercase<string>;
  readonly parameters: WWWAuthenticateChallengeParameters;
}

function unquote(value: string) {
  if (value.length >= 2 && value[0] === '"' && value[value.length - 1] === '"') {
    return value.slice(1, -1);
  }

  return value;
}

const SPLIT_REGEXP = /((?:,|, )?[0-9a-zA-Z!#$%&'*+-.^_`|~]+=)/;
const SCHEMES_REGEXP = /(?:^|, ?)([0-9a-zA-Z!#$%&'*+\-.^_`|~]+)(?=$|[ ,])/g;

function wwwAuth(scheme: string, params: string): WWWAuthenticateChallenge {
  const arr = params.split(SPLIT_REGEXP).slice(1);
  if (!arr.length) {
    return {
      scheme: scheme.toLowerCase() as Lowercase<string>,
      parameters: {},
    };
  }
  arr[arr.length - 1] = arr[arr.length - 1].replace(/,$/, "");
  const parameters: WWWAuthenticateChallenge["parameters"] = {};
  for (let i = 1; i < arr.length; i += 2) {
    const idx = i;
    if (arr[idx][0] === '"') {
      while (arr[idx].slice(-1) !== '"' && ++i < arr.length) {
        arr[idx] += arr[i];
      }
    }
    const key = arr[idx - 1].replace(/^(?:, ?)|=$/g, "").toLowerCase() as Lowercase<string>;
    // @ts-expect-error js strikes back
    parameters[key] = unquote(arr[idx]);
  }

  return {
    scheme: scheme.toLowerCase() as Lowercase<string>,
    parameters,
  };
}

function parseWwwAuthenticateChallenges(
  response: Response
): WWWAuthenticateChallenge[] | undefined {
  const header = response.headers.get("www-authenticate");
  if (header === null) {
    return undefined;
  }

  const result: [string, number][] = [];
  for (const { 1: scheme, index } of header.matchAll(SCHEMES_REGEXP)) {
    result.push([scheme, index!]);
  }

  if (!result.length) {
    return undefined;
  }

  const challenges = result.map(([scheme, indexOf], i, others) => {
    const next = others[i + 1];
    let parameters: string;
    if (next) {
      parameters = header.slice(indexOf, next[1]);
    } else {
      parameters = header.slice(indexOf);
    }
    return wwwAuth(scheme, parameters);
  });

  return challenges;
}

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

async function performDiscoveryCurrentDraft(serverAddress: string) {
  return {
    issuer: await discoverOrFallback(serverAddress),
    scopes_supported: []
  }
}

async function performWWWAuthenticateDiscovery(response: Response) {
  const wwwChallenges = parseWwwAuthenticateChallenges(response);
  if (!wwwChallenges) {
    throw new Error("No www-authenticate challenges were found");
  }

  if (wwwChallenges.length > 1) {
    throw new Error("Too many www-authenticate challenges were found");

  }
  const challenge = wwwChallenges[0];
  
  if (challenge.scheme === "bearer") {
    if (challenge.parameters.resource) {
      console.log("fetching", challenge.parameters.resource);
      const resourceMetadataRequest = await fetch(challenge.parameters.resource);
      if (resourceMetadataRequest.status !== 200) {
        throw new Error("Discovery failed");
      }
      const { authorization_servers, scopes_supported } = await resourceMetadataRequest.json();
      try {
        return {
          scopes_supported,
          issuer: await discoverOrFallback(authorization_servers[0] as string, "oauth2"),
        }
      } catch (e) {
        console.log("Failed oauth2, pulling oidc");
        return {
          issuer: await discoverOrFallback(authorization_servers[0] as string, "oidc"),
          scopes_supported
        }
      }
    }
  }

  throw new Error("Unsupproted schema");
}

/**
 *
 * @param serverAddress
 * @param method
 */
async function performDiscovery(serverAddress: string, method: "draft" | "#195") {
  console.log(method, serverAddress);

  let response;
  try {
    response = await fetch(serverAddress);
  } catch {
    throw new Error("Network Error");
  }

  console.log({ method }, response.status);

  if (response.status === 400) {
    if (method === "#195") {
      return performWWWAuthenticateDiscovery(response);
    }
  }

  if (response.status === 401) { 
    if (method === "draft") {
      return performDiscoveryCurrentDraft(serverAddress);
    }
  }

  throw new Error("Unsupported discovery");
}

/**
 * Attempts to discover Authorization Server Metadata per RFC8414
 * Falls back to static endpoints if discovery fails
 */
export async function discoverOrFallback(server: string, algorithm: "oauth2" | "oidc" = "oauth2") {
  try {
    const baseUrl = getAuthorizationBaseUrl(server);
    const issuer = await client.dynamicClientRegistration(
      new URL(baseUrl),
      {
        client_name: "VaultMCP",
        redirect_uris: ["https://auth0.vaultmcp.ai/login/callback"],
        grant_types: ["authorization_code", "refresh_token"],
        token_endpoint_auth_method: "client_secret_post",
        ...((algorithm === "oidc")? {

        } : {})
      },
      client.None,
      {
        algorithm,
        timeout: 5,
        [client.customFetch]: async (url, opts) => {
          let response = await globalThis.fetch(url, opts);
          if (response.ok) {
            const body = await response.json();
            response = new Response(
              JSON.stringify({
                ...body,
                client_secret_expires_at: body.client_secret_expires_at || 0,
              }),
              response
            );
          }
          return response;
        },
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
export async function createAuth0OIDCConnection(
  details: {
    authorization_endpoint: string;
    jwks_uri: string;
    issuer: string;
    client_id: string;
    client_secret: string;
    token_endpoint: string;
    scopes: string[];
  },
  { owner_sub }: { owner_sub: string }
) {
  const name = `mcp-oidc-${details.client_id}`.toLowerCase().replace(/[^a-z0-9-_]/g, "");

  const { data: connection } = await manage.connections.create({
    name,
    strategy: "oidc",
    options: {
      ...details, // what we got from discovery
      type: "back_channel",
      // default scopes
      scopes: "openid profile email offline_access " + details.scopes.join(" "),
      token_endpoint_auth_method: "client_secret_post",
      federated_connections_access_tokens: {
        active: true,
      },
    },
    metadata: {
      owner_sub: owner_sub,
      status: "un-approved",
      issuer: details.issuer,
    },
    enabled_clients: [
      process.env.CLIENT_INITIATED_ACCOUNT_LINKING_ACTION_CLIENT_ID!,
      process.env.AUTH0_CLIENT_ID!,
    ],
  });

  return connection;
}

/**
 * Creates an Auth0 OIDC connection with the MCP credentials
 */
async function createAuth0CustomSocialConnection(
  details: {
    authorization_endpoint: string;
    issuer: string;
    client_id: string;
    client_secret: string;
    token_endpoint: string;
    scopes: string[]
  },
  { owner_sub }: { owner_sub: string }
) {
  const name = `mcp-oauth-${details.client_id}`.toLowerCase().replace(/[^a-z0-9-_]/g, "");

  const { data: connection } = await manage.connections.create({
    name,
    strategy: "oauth2",
    options: {
      client_id: details.client_id,
      client_secret: details.client_secret,
      authorizationURL: details.authorization_endpoint,
      tokenURL: details.token_endpoint,
      // For now default scopes
      scope: details.scopes.join(" "),
      scripts: {
        fetchUserProfile: `function(accessToken, ctx, cb) {
  // Right now there is no user-info disclosure
  // which can result into its own problems
  // as such, to avoid this from becoming an issue
  // we will return a new user
  return cb(null, {
    name: "${details.issuer} User",
    user_id: 'u' + Date.now() + (Math.random() * 10000).toString()
  });
}`,
      },
      federated_connections_access_tokens: {
        active: true,
      },
    },
    metadata: {
      owner_sub: owner_sub,
      status: "un-approved",
      issuer: details.issuer,
    },
    enabled_clients: [
      process.env.CLIENT_INITIATED_ACCOUNT_LINKING_ACTION_CLIENT_ID!,
      process.env.AUTH0_CLIENT_ID!,
    ],
  });

  return connection;
}

/**
 * Main flow: Discover & Register -> Create Connection Auth0
 */
export async function registerMcpAndCreateAuth0Connection(
  mcpUrl: string,
  method: string,
  ownerSub: string
) {
  const {issuer, scopes_supported} = await performDiscovery(mcpUrl, method as any);

  if (!issuer) {
    throw new Error("Discovery Failed");
  }

  const client = issuer.clientMetadata();
  const server = issuer.serverMetadata();

  const connection = server.jwks_uri? 
  await createAuth0OIDCConnection({
    client_id: client.client_id,
    client_secret: client.client_secret!,
    authorization_endpoint: server.authorization_endpoint!,
    issuer: server.issuer,
    token_endpoint: server.token_endpoint!,
    jwks_uri: server.jwks_uri!,
    scopes: scopes_supported as string[],
  }, {
    owner_sub: ownerSub,
  })
  : await createAuth0CustomSocialConnection(
    {
      client_id: client.client_id,
      client_secret: client.client_secret!,
      authorization_endpoint: server.authorization_endpoint!,
      issuer: server.issuer,
      token_endpoint: server.token_endpoint!,
      scopes: scopes_supported as string[],
    },
    {
      owner_sub: ownerSub,
    }
  );

  // grant this current user access
  // Get than post.
  const { data: user, status } = await manage.users.get({ id: ownerSub });

  if (status === 200) {
    if (user.identities.length > 10) {
      throw new Error("You have too many identities");
    }

    user.app_metadata = user.app_metadata || {};
    user.app_metadata.custom_mcp = user.app_metadata.custom_mcp || [];

    const { custom_mcp: customMcp } = user.app_metadata;

    if (customMcp.length > 3) {
      throw new Error("You are on the maximum limit of Custom MCPs allowed");
    }

    // add new one
    customMcp.push({
      connection: connection.name,
      server: mcpUrl,
    });

    await manage.users.update(
      {
        id: ownerSub,
      },
      {
        app_metadata: user.app_metadata,
      }
    );
  }

  return connection;
}
