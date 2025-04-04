import { ToolCards } from "@/components/toolset-cards"
import { registry } from "../tools/registry"
import { auth0 } from "@/lib/auth0"
import { notFound } from "next/navigation";
import { manage } from "@/lib/auth0-manage";
import { TOOLSET_TYPE, ToolSetInfo } from "../tools/toolset";
import MCPDiscovery from "./new/mcp-discover";

export default async function Home() {
  const session = await auth0.getSession();

  if (!session) {
    notFound();
  }

  const { data: userObject, status } = await manage.users.get({ id: session.user.sub });

  if (!userObject || status !== 200) {
    notFound();
  }
  
  // This is to fix the issue where identities[0] does
  // not have the profile data.
  // won't happen in demos
  userObject.identities[0].profileData = userObject;

  // weave identities and registry maybe split this later
  const toolsets = Object.entries(registry).map(([connectionName, info]) => {
    const identity = userObject.identities.find((identity) => identity.connection === connectionName);
    const mapped: ToolSetInfo & ({ installed: false } | { installed: true, profileData: any}) = { ...info, installed: false };

    if (identity !== undefined) {
      // @ts-ignore
      mapped.installed = true;
      // @ts-ignore
      mapped.profileData = identity.profileData;
    }
    
    return mapped;
  }); 

  console.log(toolsets);
  
  const customMcp = ((userObject.app_metadata || {}).custom_mcp || []).map((mcpServerConnectionName: string) => {
    const identity = userObject.identities.find((identity) => identity.connection === mcpServerConnectionName);

    const mapped: ToolSetInfo & ({ installed: false } | { installed: true, profileData: any}) = {
      connectionName: mcpServerConnectionName,
      connectionScopes: [],
      contributedBy: "You",
      description: "your own custom mcp server",
      icon: "/icons/Google.png",
      installed: false,
      name: "Custom MCP",
      type: TOOLSET_TYPE.MCP_SERVER
    };

    if (identity !== undefined) {
      // @ts-ignore
      mapped.installed = true;
      // @ts-ignore
      mapped.profileData = identity.profileData;
    }

    return mapped;
  });

  return (
    <main className="container mx-auto py-10 px-4 space-y-16">

      <h1 className="text-3xl font-bold mb-6">MCP Server Dashboard</h1>
      <p className="text-muted-foreground mb-8">Manage access to built in tools</p>
      <ToolCards toolsets={toolsets} />

      <h2 className="text-3xl font-bold mb-6">Custom Tools</h2>
      <p className="text-muted-foreground mb-8">Add any MCP Server, or Manange Existing ones</p>
      <ToolCards toolsets={customMcp} />

      {customMcp.length < 3 && <MCPDiscovery />}
    </main>
  )
}

