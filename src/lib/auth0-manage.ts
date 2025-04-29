import { ManagementClient } from "auth0";

export const manage = new ManagementClient({
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  domain: process.env.AUTH0_CANNONICAL_DOMAIN!,
});
