import { ToolCards } from "@/components/toolset-cards";
import { registry } from "../tools/registry";
import { auth0 } from "@/lib/auth0";
import { notFound } from "next/navigation";
import { manage } from "@/lib/auth0-manage";
import { TOOLSET_TYPE, ToolSetInfo } from "../tools/toolset";
import MCPDiscovery from "./new/mcp-discover";

export default async function Home() {
  const session = await auth0.getSession();

  if (!session) {
    notFound();
  }

  const { data: userObject, status } = await manage.users.get({
    id: session.user.sub,
  });

  if (!userObject || status !== 200) {
    notFound();
  }

  // This is to fix the issue where identities[0] does
  // not have the profile data.
  // won't happen in demos
  userObject.identities[0].profileData = userObject;

  // weave identities and registry maybe split this later
  const toolsets = Object.entries(registry).map(([connectionName, info]) => {
    const identity = userObject.identities.find(
      (identity) => identity.connection === connectionName
    );
    const mapped: ToolSetInfo & ({ installed: false } | { installed: true; profileData: any }) = {
      ...info,
      installed: false,
    };

    if (identity !== undefined) {
      // @ts-expect-error to be fixed
      mapped.installed = true;
      // @ts-expect-error to be fixed
      mapped.profileData = identity.profileData;
    }

    return mapped;
  });

  console.log(toolsets);

  const customMcp = ((userObject.app_metadata || {}).custom_mcp || []).map(
    ({server, connection}: { server: string, connection: string}) => {
      const identity = userObject.identities.find(
        (identity) => identity.connection === connection
      );

      const mapped: ToolSetInfo & ({ installed: false } | { installed: true; profileData: any }) = {
        connectionName: connection,
        connectionScopes: [],
        contributedBy: "You",
        description: "MCP Server at " + server,
        icon: "/icons/Cloudflare.png",
        installed: false,
        name: "Custom MCP",
        type: TOOLSET_TYPE.MCP_SERVER,
      };

      if (identity !== undefined) {
        // @ts-expect-error to be fixed
        mapped.installed = true;
        // @ts-expect-error to be fixed
        mapped.profileData = identity.profileData;
      }

      return mapped;
    }
  );

  return (
    <main className="mx-auto min-h-screen w-full">
      <div className="flex h-screen w-full flex-col">
        <div className="border-border mb-8 flex w-full flex-col items-start justify-start border-b px-6 py-4">
          <h1 className="text-3xl font-bold">MCP Server Dashboard</h1>

          <p className="text-muted-foreground">Manage access to built in tools</p>
        </div>
        <div className="mx-auto flex h-full w-full flex-row">
          <div className="mx-auto flex w-full flex-col">
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col space-y-6 overflow-y-auto px-4">
              <ToolCards toolsets={toolsets} />

              <h2 className="mb-6 text-3xl font-bold">Custom Tools</h2>
              <p className="text-muted-foreground mb-8">
                Add any MCP Server, or Manange Existing ones
              </p>
              <ToolCards toolsets={customMcp} />

              {customMcp.length < 3 && <MCPDiscovery />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
