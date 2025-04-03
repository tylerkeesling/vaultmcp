import { ToolCards } from "@/components/toolset-cards"
import { registry } from "../tools/registry"
import { auth0 } from "@/lib/auth0"
import { notFound } from "next/navigation";
import { manage } from "@/lib/auth0-manage";
import { ToolSetInfo } from "../tools/toolset";

export default async function Home() {
  const session = await auth0.getSession();

  if (!session) {
    notFound();
  }

  const { data: userObject, status } = await manage.users.get({ id: session.user.sub });

  if (!userObject || status !== 200) {
    notFound();
  }

  console.log(userObject.identities);

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

  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">MCP Server Dashboard</h1>
      <p className="text-muted-foreground mb-8">Manage your MCP server connections and view server status</p>
      <ToolCards toolsets={toolsets} />
    </main>
  )
}

