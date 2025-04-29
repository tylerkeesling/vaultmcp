import { ChatBox } from "@/components/chat-box";
import { LoginOrUser } from "@/components/user-button";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen w-full">
      <div className="flex h-screen w-full flex-col">
        <div className="border-border tems-start flex w-full items-center justify-start border-b px-6 py-4">
          <div>
            <h1 className="text-3xl font-bold">Auth for GenAI</h1>
            <p className="text-muted-foreground">Secure your AI Agents with Auth0</p>
          </div>
          <div className="flex-grow" />
          <LoginOrUser />
        </div>
        <div className="mx-auto flex h-full w-full flex-row">
          <ChatBox />
        </div>
      </div>
    </main>
  );
}
