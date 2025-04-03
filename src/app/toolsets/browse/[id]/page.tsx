"use client"

import { useParams, useRouter } from "next/navigation"
import { serversData, type ServerInfo } from "@/components/toolset-cards"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, ArrowLeft, Settings, Download, RefreshCw } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState } from "react"

export default function ServerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const serverId = params.id as string

  // Find the server data
  const serverData = serversData.find((server) => server.id === serverId)

  const [server, setServer] = useState<ServerInfo | undefined>(serverData)

  if (!server) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Server not found</h1>
        <p className="mb-6">The server you are looking for does not exist.</p>
        <Button onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    )
  }

  const toggleActionInstallation = (actionId: string) => {
    setServer((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        actions: prev.actions.map((action) => {
          if (action.id === actionId) {
            return {
              ...action,
              installed: !action.installed,
            }
          }
          return action
        }),
      }
    })
  }

  // Count installed actions
  const installedActionsCount = server.actions.filter((action) => action.installed).length
  const totalActionsCount = server.actions.length

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => router.push("/")} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold">{server.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Server Information</CardTitle>
              <CardDescription>{server.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {server.installed ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Installed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        <XCircle className="h-3 w-3 mr-1" /> Not Installed
                      </Badge>
                    )}

                    {server.installed && (
                      <Badge
                        variant="outline"
                        className={
                          server.connected
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }
                      >
                        {server.connected ? "Connected" : "Disconnected"}
                      </Badge>
                    )}
                  </div>
                </div>

                {server.connected && server.user && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Connected User</h3>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={server.user.avatar} alt={server.user.name} />
                        <AvatarFallback>{server.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{server.user.name}</p>
                        <p className="text-sm text-muted-foreground">{server.user.role}</p>
                        <p className="text-xs text-muted-foreground">{server.user.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium mb-2">Actions Summary</h3>
                  <p className="text-sm">
                    <span className="font-medium">{installedActionsCount}</span> of{" "}
                    <span className="font-medium">{totalActionsCount}</span> actions installed
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-primary h-2.5 rounded-full"
                      style={{ width: `${(installedActionsCount / totalActionsCount) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" /> Configure Server
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <RefreshCw className="mr-2 h-4 w-4" /> Restart Server
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Installed Actions</CardTitle>
              <CardDescription>Manage the actions installed on this server</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {server.actions.map((action) => (
                  <div key={action.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{action.name}</h3>
                        {action.installed ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Installed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                            Not Installed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                    </div>
                    <Button
                      variant={action.installed ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleActionInstallation(action.id)}
                    >
                      {action.installed ? (
                        <>Uninstall</>
                      ) : (
                        <>
                          <Download className="mr-1 h-3 w-3" /> Install
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

