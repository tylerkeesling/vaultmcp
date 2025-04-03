"use client"

import type React from "react"
import Image from 'next/image';

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ToolSetInfo } from "@/app/tools/toolset"

// Define server types
interface User {
  name: string
  email: string
  avatar: string
  role: string
}

interface Action {
  id: string
  name: string
  description: string
  installed: boolean
}



export function ToolCards({ toolsets }: { toolsets: (ToolSetInfo & ({ installed: false } | { installed: true, profileData: any })) []}) {
  const router = useRouter()
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

  const toggleCardExpansion = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }
  const navigateToServerDetail = (serverId: string) => {
    router.push(`/server/${serverId}`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {toolsets.map((server) => (
        <Card
          key={server.connectionName}
          className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          // onClick={() => navigateToServerDetail(server.connectionName)}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <Image width={48} height={48} src={server.icon} alt={server.connectionName + ' logo'} />
                <div>
                  <CardTitle className="text-xl">{server.name}</CardTitle>
                  <CardTitle className="text-xs"><span className="text-accent-foreground">by</span> {server.contributedBy} </CardTitle>
                 
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-3">
            <CardDescription className={expandedCards[server.id] ? "" : "line-clamp-2"}>
              {server.description}
            </CardDescription>
          </CardContent>

          {server.installed && (
            <div className="px-6 pb-2">
              <div className="pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={server.profileData.picture} alt={server.profileData.name} />
                    <AvatarFallback>{server.profileData.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{server.profileData.name}</p>
                    <p className="text-xs text-muted-foreground">{server.profileData.role}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <CardFooter className="pt-2">
            <Button
              variant={server.installed ? "outline" : "default"}
              size="sm"
              className="w-full"
              asChild
            >
              <a href={`/api/connect/?tool=${server.connectionName}`}>
                {!server.installed ? "Install & Connect" : server.installed ? "Manage" : "Connect"}
              </a>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

