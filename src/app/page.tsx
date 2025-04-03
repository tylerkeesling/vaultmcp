import { ChatBox } from "@/components/chat-box"
import { ToolCards } from "@/components/toolset-cards"

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Vault MCP</h1>
      <p className="text-muted-foreground mb-8">Talk to any MCP Server Securely</p>
      <ChatBox />
    </main>
  )
}

