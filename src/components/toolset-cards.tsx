"use client";

import type React from "react";
import Image from "next/image";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ToolSetInfo } from "@/app/tools/toolset";

// Define server types
interface User {
  name: string;
  email: string;
  avatar: string;
  role: string;
}

interface Action {
  id: string;
  name: string;
  description: string;
  installed: boolean;
}

export function ToolCards({
  toolsets,
}: {
  toolsets: (ToolSetInfo & ({ installed: false } | { installed: true; profileData: any }))[];
}) {
  const router = useRouter();
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleCardExpansion = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const navigateToServerDetail = (serverId: string) => {
    router.push(`/server/${serverId}`);
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
      {toolsets.map((server) => (
        <Card
          key={server.connectionName}
          className="hover:shadow-bevel-lg flex min-h-64 cursor-pointer flex-col justify-between overflow-hidden"
          // onClick={() => navigateToServerDetail(server.connectionName)}
        >
          <CardHeader className="flex flex-1 pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Image
                  width={48}
                  height={48}
                  src={server.icon}
                  alt={server.connectionName + " logo"}
                />
                <div>
                  <CardTitle className="text-xl">{server.name}</CardTitle>
                  <CardTitle className="text-xs">
                    <span className="text-accent-foreground">by</span> {server.contributedBy}{" "}
                  </CardTitle>
                </div>
              </div>
            </div>
            <CardDescription className={expandedCards[server && server.id] ? "" : "line-clamp-2"}>
              {server.description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {server.installed && (
              <div className="border-border border-t border-dashed pt-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={server.profileData.picture} alt={server.profileData.name} />
                    <AvatarFallback>{server.profileData.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{server.profileData.name}</p>
                    <p className="text-muted-foreground text-xs">{server.profileData.role}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-2">
            <Button variant={server.installed ? "outline" : "default"} className="w-full">
              <a href={`/api/connect/?tool=${server.connectionName}`}>
                {!server.installed ? "Install & Connect" : server.installed ? "Manage" : "Connect"}
              </a>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
