"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Send, Bot, User, Loader2, Copy, Check, RefreshCw, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

// Define message types
type MessageType = "text" | "code" | "tool-call" | "tool-result"

interface EnhancedMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  type: MessageType
  toolName?: string
  toolResult?: string
}

export function ChatBox() {
  // State
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [enhancedMessages, setEnhancedMessages] = useState<EnhancedMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // AI SDK chat hook
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, reload, stop, setMessages } = useChat({
    api: "/api/chat",
    onFinish: (message) => {
      // Process the final message to extract tool calls
      processMessage(message)
    },
  })

  // Process messages to enhance them with timestamps and types
  const processMessage = (message: any) => {
    const newMessage: EnhancedMessage = {
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: new Date(),
      type: "text",
    }

    // Simple detection of code blocks (anything between ```)
    if (message.content.includes("```")) {
      newMessage.type = "code"
    }

    // Simulate tool calls detection
    if (message.role === "assistant" && message.content.includes("Using tool:")) {
      const toolMatch = message.content.match(/Using tool: ([\w-]+)/)
      if (toolMatch) {
        newMessage.type = "tool-call"
        newMessage.toolName = toolMatch[1]

        // Simulate tool result
        setTimeout(() => {
          const toolResult: EnhancedMessage = {
            id: `result-${message.id}`,
            role: "system",
            content: `Result from ${toolMatch[1]}`,
            timestamp: new Date(),
            type: "tool-result",
            toolName: toolMatch[1],
            toolResult: `Executed ${toolMatch[1]} successfully. Retrieved 5 records.`,
          }

          setEnhancedMessages((prev) => [...prev, toolResult])
        }, 1000)
      }
    }

    setEnhancedMessages((prev) => [...prev, newMessage])
  }

  // Initialize with welcome message
  useEffect(() => {
    if (enhancedMessages.length === 0) {
      setEnhancedMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hi there! I'm your MCP assistant. I can help you interact with your servers using natural language. What would you like to know?",
          timestamp: new Date(),
          type: "text",
        },
      ])
    }
  }, [enhancedMessages.length])

  // Process incoming messages
  useEffect(() => {
    if (messages.length > enhancedMessages.length) {
      const newMessages = messages.slice(enhancedMessages.length)
      newMessages.forEach((message) => {
        if (!enhancedMessages.find((m) => m.id === message.id)) {
          processMessage(message)
        }
      })
    }
  }, [messages, enhancedMessages])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [enhancedMessages])

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Handle copy to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Clear chat
  const clearChat = () => {
    setEnhancedMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Chat history cleared. How can I help you today?",
        timestamp: new Date(),
        type: "text",
      },
    ])
    setMessages([])
  }

  // Custom submit handler
  const handleCustomSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!input.trim()) return

    // Add user message immediately with enhanced properties
    const userMessage: EnhancedMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
      type: "text",
    }

    setEnhancedMessages((prev) => [...prev, userMessage])

    // Then call the AI SDK's submit handler
    handleSubmit(e)
  }

  // Format code blocks
  const formatContent = (content: string) => {
    if (!content.includes("```")) return content

    // Split by code blocks
    const parts = content.split(/(```(?:[\w-]+)?\n[\s\S]*?\n```)/g)

    return parts.map((part, i) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        // Extract language and code
        const match = part.match(/```([\w-]+)?\n([\s\S]*?)\n```/)
        if (match) {
          const [_, language, code] = match
          return (
            <pre key={i} className="bg-black/5 dark:bg-white/5 p-3 rounded-md my-2 overflow-x-auto">
              <code className="text-sm font-mono">{code}</code>
            </pre>
          )
        }
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      {/* Chat header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-3 bg-gray-100 dark:bg-gray-800">
            <Bot className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Avatar>
          <h1 className="text-lg font-medium text-gray-900 dark:text-gray-100">MCP Assistant</h1>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  onClick={() => reload()}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Regenerate response</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  onClick={clearChat}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear chat</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      {/* Chat messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        <AnimatePresence initial={false}>
          {enhancedMessages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start",
                message.role === "system" ? "justify-center" : "",
              )}
            >
              {message.role === "system" ? (
                <div className="max-w-[85%] bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
                  <div className="text-sm text-gray-700 dark:text-gray-300">{message.toolResult}</div>
                </div>
              ) : (
                <div
                  className={cn(
                    "flex items-start gap-3 max-w-[85%] group",
                    message.role === "user" ? "flex-row-reverse" : "",
                  )}
                >
                  <Avatar
                    className={cn(
                      "h-8 w-8 shrink-0",
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
                    )}
                  >
                    {message.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                  </Avatar>

                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 relative",
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                    )}
                  >
                    {/* Message content */}
                    <div className="relative">
                      {typeof message.content === "string" && formatContent(message.content)}

                      {/* Copy button */}
                      <div
                        className={cn(
                          "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity",
                          message.role === "user" ? "-left-8" : "-right-8",
                        )}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                          onClick={() => copyToClipboard(message.content, message.id)}
                        >
                          {copiedId === message.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div
                      className={cn(
                        "text-xs mt-1",
                        message.role === "user" ? "text-blue-200 text-right" : "text-gray-500 dark:text-gray-400",
                      )}
                    >
                      {format(message.timestamp, "h:mm a")}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
            <div className="flex items-start gap-3 max-w-[85%]">
              <Avatar className="h-8 w-8 bg-gray-100 dark:bg-gray-800">
                <Bot className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Avatar>
              <div className="rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-800 flex items-center">
                <div className="flex space-x-1">
                  <span
                    className="h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></span>
                  <span
                    className="h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></span>
                  <span
                    className="h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error message */}
        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg px-4 py-2 flex items-center text-sm">
              <span>Error: {error.message}</span>
            </div>
          </motion.div>
        )}

        {/* Empty div for scrolling to bottom */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4">
        <form onSubmit={handleCustomSubmit} className="flex items-center space-x-2">
          <Input
            ref={inputRef}
            placeholder="Message MCP Assistant..."
            value={input}
            onChange={handleInputChange}
            className="flex-1 bg-gray-100 dark:bg-gray-800 border-0 focus-visible:ring-1 focus-visible:ring-gray-300 dark:focus-visible:ring-gray-700 rounded-full py-6"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className={cn(
              "rounded-full h-10 w-10 bg-blue-500 hover:bg-blue-600 text-white",
              isLoading ? "opacity-50 cursor-not-allowed" : "",
              !input.trim() ? "opacity-50 cursor-not-allowed" : "",
            )}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  )
}

