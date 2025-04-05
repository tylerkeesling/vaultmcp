"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { discoverMCPTools } from "./actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/**
 *
 * @returns
 */
export default function MCPDiscovery() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [tools, setTools] = useState<Record<string, any> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [authzNegotationMethod, setAuthzNegotiationMethod] = useState<"draft" | "#195" | "#205">("draft")
  const [url, setUrl] = useState("")

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
      // Add initial log
      setLogs([{ type: "status", message: `Connecting to ${url}...` }])

      // Call the server action directly
      const response = await discoverMCPTools({
        authzNegotationMethod,
        url: url,
      })

      // Check if the response contains an error
      if (response.error) {
        setError(`${response.error}: ${response.error_description}`)
        setLogs((prev) => [
          ...prev,
          {
            type: "error",
            message: `Error: ${response.error_description}`,
          },
        ])
      } else {
        // Success case
        setLogs((prev) => [
          ...prev,
          {
            type: "status",
            message: `Successfully connected to MCP server. Connection name: ${response.name}`,
          },
        ])

        // Set the tools with the response
        setTools({ name: response.name })
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
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>MCP Server Discovery</CardTitle>
        <CardDescription>Connect to an MCP server and discover available tools</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Select
              onValueChange={(value) => {
                setAuthzNegotiationMethod(value as "draft" | "#195" | "#205")
              }}
              value={authzNegotationMethod}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem disabled value="#195">#195 and #205</SelectItem>
              </SelectContent>
            </Select>
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
              <h3 className="mb-2 text-lg font-medium">Connection Log</h3>
              <div className="bg-muted max-h-40 overflow-auto rounded-md p-4 font-mono text-sm">
                {logs.map((log, index) => (
                  <div key={index} className={`mb-1 ${log.type === "error" ? "text-red-500" : ""}`}>
                    {log.type === "status" ? (
                      <div className="flex items-start">
                        <CheckCircle2 className="mt-0.5 mr-2 h-4 w-4 text-green-500" />
                        <span>{log.message}</span>
                      </div>
                    ) : (
                      <div className="flex items-start">
                        <AlertCircle className="mt-0.5 mr-2 h-4 w-4 text-red-500" />
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
              <h3 className="mb-2 text-lg font-medium">Discovered Tools</h3>
              <pre className="bg-muted max-h-96 overflow-auto rounded-md p-4">{JSON.stringify(tools, null, 2)}</pre>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-muted-foreground text-sm">
          This will create a client and register for you.
        </p>
      </CardFooter>
    </Card>
  )
}

