import { ChatBox } from "@/components/chat-box";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen w-full">
      <div className="flex h-screen w-full flex-col">
        <div className="border-border flex w-full flex-col items-start justify-start border-b px-6 py-4">
          <h1 className="text-3xl font-bold">Vault MCP</h1>

          <p className="text-muted-foreground">Talk to any MCP Server Securely</p>
        </div>
        <div className="mx-auto flex h-full w-full flex-row">
          <ChatBox />
        </div>
      </div>
    </main>
  );
}
