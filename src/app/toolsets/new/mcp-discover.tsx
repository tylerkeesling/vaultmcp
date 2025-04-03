"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { discoverMCPTools } from "./actions";

/**
 * 
 * @returns 
 */
export default function MCPDiscovery() {
  const [url, setUrl] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [tools, setTools] = useState<Record<string, any> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<Array<{ type: string; message: string }>>([])
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs])

  const handleDiscoverTools = async () => {
    if (!url) {
      setError("Please enter an MCP server URL")
      return
    }

    setIsConnecting(true)
    setError(null)
    setTools(null)
    setLogs([])

    try {
      // Call the server action directly
      const response = await discoverMCPTools(url)

      if (!response.body) {
        throw new Error("Response body is not readable")
      }

      // Process the streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        // Decode the chunk and add it to our buffer
        buffer += decoder.decode(value, { stream: true })

        // Process complete lines in the buffer
        const lines = buffer.split("\n")
        buffer = lines.pop() || "" // Keep the last incomplete line in the buffer

        for (const line of lines) {
          if (line.trim() === "") continue

          try {
            const data = JSON.parse(line)

            if (data.type === "status") {
              setLogs((prev) => [...prev, { type: "status", message: data.message }])
            } else if (data.type === "error") {
              setLogs((prev) => [...prev, { type: "error", message: data.message }])
              setError(data.message)
            } else if (data.type === "tools") {
              setTools(data.data)
            }
          } catch (e) {
            console.error("Error parsing JSON:", e, line)
          }
        }
      }
    } catch (err) {
      console.error("Error connecting to MCP server:", err)
      setError(`Failed to connect to MCP server: ${err instanceof Error ? err.message : String(err)}`)
      setLogs((prev) => [
        ...prev,
        {
          type: "error",
          message: `Failed to connect to MCP server: ${err instanceof Error ? err.message : String(err)}`,
        },
      ])
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>MCP Server Discovery</CardTitle>
          <CardDescription>Connect to an MCP server and discover available tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="Enter MCP server URL (e.g., https://example.com/mcp/sse)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleDiscoverTools} disabled={isConnecting}>
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Discover Tools"
                )}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {logs.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Connection Log</h3>
                <div className="bg-muted p-4 rounded-md overflow-auto max-h-40 text-sm font-mono">
                  {logs.map((log, index) => (
                    <div key={index} className={`mb-1 ${log.type === "error" ? "text-red-500" : ""}`}>
                      {log.type === "status" ? (
                        <div className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                          <span>{log.message}</span>
                        </div>
                      ) : (
                        <div className="flex items-start">
                          <AlertCircle className="h-4 w-4 mr-2 mt-0.5 text-red-500" />
                          <span>{log.message}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            )}

            {tools && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Discovered Tools</h3>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96">{JSON.stringify(tools, null, 2)}</pre>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            This component uses Next.js Server Actions to connect to MCP servers with streaming updates.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

