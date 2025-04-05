"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bot, RefreshCw, Trash2, ArrowUp, CopyIcon, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { duotoneLight, duotoneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// Define message types
type MessageType = "text" | "code" | "tool-call" | "tool-result";

interface EnhancedMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  type: MessageType;
  toolName?: string;
  toolResult?: string;
}

export function ChatBox() {
  // State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [enhancedMessages, setEnhancedMessages] = useState<EnhancedMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // AI SDK chat hook
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    setMessages,
  } = useChat({
    api: "/api/chat",
    onFinish: (message) => {
      // Process the final message to extract tool calls
      processMessage(message);
    },
  });

  // Process messages to enhance them with timestamps and types
  const processMessage = (message: {
    id: string;
    role: "user" | "assistant" | "system" | "data";
    content: string;
  }) => {
    const newMessage: EnhancedMessage = {
      id: message.id,
      role: message.role === "data" ? "system" : message.role,
      content: message.content,
      timestamp: new Date(),
      type: "text",
    };

    // Simple detection of code blocks (anything between ```)
    if (message.content.includes("```")) {
      newMessage.type = "code";
    }

    // Simulate tool calls detection
    if (message.role === "assistant" && message.content.includes("Using tool:")) {
      const toolMatch = message.content.match(/Using tool: ([\w-]+)/);
      if (toolMatch) {
        newMessage.type = "tool-call";
        newMessage.toolName = toolMatch[1];

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
          };

          setEnhancedMessages((prev) => [...prev, toolResult]);
        }, 1000);
      }
    }

    setEnhancedMessages((prev) => [...prev, newMessage]);
  };

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
      ]);
    }
  }, [enhancedMessages.length]);

  // Process incoming messages
  useEffect(() => {
    if (messages.length > enhancedMessages.length) {
      const newMessages = messages.slice(enhancedMessages.length);
      newMessages.forEach((message) => {
        if (!enhancedMessages.find((m) => m.id === message.id)) {
          processMessage(message);
        }
      });
    }
  }, [messages, enhancedMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [enhancedMessages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle copy to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
    ]);
    setMessages([]);
  };

  // Custom submit handler
  const handleCustomSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message immediately with enhanced properties
    const userMessage: EnhancedMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
      type: "text",
    };

    setEnhancedMessages((prev) => [...prev, userMessage]);

    // Then call the AI SDK's submit handler
    handleSubmit(e);
  };

  // Format code blocks
  const formatContent = (content: string) => {
    if (!content.includes("```")) return content;

    // Split by code blocks
    const parts = content.split(/(```(?:[\w-]+)?\n[\s\S]*?\n```)/g);

    return parts.map((part, i) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        // Extract language and code
        const match = part.match(/```([\w-]+)?\n([\s\S]*?)\n```/);
        if (match) {
          const [, , code] = match;
          return (
            <pre key={i} className="my-2 overflow-x-auto rounded-md bg-black/5 p-3 dark:bg-white/5">
              <code className="font-mono text-sm">{code}</code>
            </pre>
          );
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="mx-auto flex w-full flex-col">
      {/* Chat header */}
      <header className="border-border mb-8 flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center justify-start gap-2">
          <Avatar className="bg-muted flex h-10 w-10 items-center justify-center">
            <Bot className="h-5 w-5" />
          </Avatar>
          <h1 className="mt-0.5 text-lg font-semibold">MCP Assistant</h1>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => reload()}>
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
                <Button variant="destructive" size="sm" onClick={clearChat}>
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
      <div
        ref={chatContainerRef}
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col space-y-6 px-6 md:px-0"
        style={{
          WebkitMaskImage: "linear-gradient(to top, transparent 0%, black 5%)",
          maskImage: "linear-gradient(to top, transparent 0%, black 5%)",
        }}
      >
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
                message.role === "system" ? "justify-center" : ""
              )}
            >
              {message.role === "system" ? (
                <div className="bg-muted border-border w-full max-w-[85%] rounded-lg border p-3">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {message.toolResult}
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    "group flex w-full max-w-[85%] items-start gap-3",
                    message.role === "user" ? "flex-row-reverse" : ""
                  )}
                >
                  {/* Message content */}
                  <div
                    className={cn("group relative w-full py-2", {
                      "bg-muted text-primary-foreground max-w-[80%] rounded-2xl px-3":
                        message.role === "user",
                      "bg-background max-w-full": message.role !== "user",
                    })}
                    style={{ isolation: "auto" }}
                  >
                    <div
                      className={cn(
                        "prose prose-sm text-foreground relative flex max-w-none flex-col items-start transition-opacity",
                        {
                          "gap-2": message.role === "assistant",
                          "min-h-[20px]": message.role === "assistant",
                        }
                      )}
                    >
                      <span className="w-full text-base leading-tight">
                        {typeof message.content === "string" && (
                          <Markdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw, rehypeSanitize]}
                            components={{
                              h1: ({ ...props }) => (
                                <h1 className="mt-3 mb-2 text-xl font-bold" {...props} />
                              ),
                              h2: ({ ...props }) => (
                                <h2 className="mt-3 mb-2 text-lg font-bold" {...props} />
                              ),
                              h3: ({ ...props }) => (
                                <h3 className="text-md mt-3 mb-2 font-bold" {...props} />
                              ),
                              p: ({ ...props }) => <p className="my-2" {...props} />,
                              a: ({ ...props }) => (
                                <a
                                  className="text-foreground hover:text-muted-foreground underline underline-offset-6"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  {...props}
                                />
                              ),
                              ul: ({ children, ...props }) => (
                                <ul className="my-2 list-none pl-4" {...props}>
                                  {children}
                                </ul>
                              ),
                              ol: ({ ...props }) => (
                                <ol className="my-2 list-none pl-5" {...props} />
                              ),
                              li: ({ children, ...props }) => (
                                <li className="chat relative my-1" {...props}>
                                  {children}
                                </li>
                              ),
                              blockquote: ({ ...props }) => (
                                <blockquote
                                  className="border-border my-2 border-l-4 pl-4 italic"
                                  {...props}
                                />
                              ),
                              // @ts-expect-error - Code component has specific props from react-markdown
                              code({
                                ref,
                                className,
                                children,
                                inline,
                                ...props
                              }: {
                                ref: Ref<SyntaxHighlighter> | undefined;
                                className: string;
                                children: React.ReactNode;
                                inline: boolean;
                              }) {
                                const match = /language-(\w+)/.exec(className || "");
                                return !inline && match ? (
                                  <div className="relative">
                                    <SyntaxHighlighter
                                      ref={ref}
                                      style={theme === "light" ? duotoneLight : duotoneDark}
                                      showLineNumbers={true}
                                      wrapLines={true}
                                      wrapLongLines={true}
                                      lineNumberStyle={{ fontStyle: "unset" }}
                                      language={match[1]}
                                      PreTag="div"
                                      className="border-border outline-border !my-3 max-w-full overflow-clip rounded-xl border font-mono text-sm text-wrap shadow-md outline outline-offset-2"
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, "")}
                                    </SyntaxHighlighter>
                                    <Button
                                      variant="outline"
                                      className="hover:bg-background absolute top-2 right-2 h-7 cursor-pointer rounded-lg p-1"
                                      onClick={handleCopy}
                                      title="Copy to clipboard"
                                    >
                                      <CopyIcon className="text-foreground size-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <code
                                    className={cn(
                                      "bg-muted/25 border-border/80 rounded-md border px-1 py-0.5 font-mono text-xs text-wrap shadow-[0_1px_2px_-1px_rgba(0,0,0,0.16)]",
                                      className
                                    )}
                                    {...props}
                                  >
                                    {String(children).trimStart().trimEnd()}
                                  </code>
                                );
                              },
                              table: ({ ...props }) => (
                                <div className="border-border shadow-bevel-xs my-4 overflow-x-auto rounded-xl border">
                                  <table
                                    className="divide-border min-w-full divide-y text-sm"
                                    {...props}
                                  />
                                </div>
                              ),
                              th: ({ ...props }) => (
                                <th
                                  className="bg-muted/50 px-2.5 py-1.5 text-left text-xs font-semibold"
                                  {...props}
                                />
                              ),
                              td: ({ ...props }) => (
                                <td className="border-border border-t px-2.5 py-1.5" {...props} />
                              ),
                              img: ({ ...props }) => (
                                <div className="border-border bg-card flex max-w-[30%] flex-col gap-1 rounded-xl border p-1">
                                  <img
                                    className="border-border rounded-lg border shadow-md"
                                    {...props}
                                  />
                                  <caption className="flex w-full items-center gap-1 px-1 py-1 text-left text-xs">
                                    <span className="bg-muted rounded-full p-1">
                                      <Info className="size-4" />
                                    </span>
                                    {props!.alt}
                                  </caption>
                                </div>
                              ),
                              hr: ({ ...props }) => (
                                <hr className="border-border my-4 w-full" {...props} />
                              ),
                            }}
                          >
                            {message.content}
                          </Markdown>
                        )}
                      </span>
                      <span className="text-muted-foreground w-fit text-xs">
                        {format(message.timestamp, "h:mm a")}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "absolute top-1/2 hidden -translate-y-1/2 group-hover:flex",
                        message.role === "user" ? "-left-10" : "right-0"
                      )}
                    >
                      <Button
                        variant="outline"
                        className="hover:bg-background h-7 cursor-pointer rounded-lg p-1"
                        onClick={() => copyToClipboard(message.content, message.id)}
                        title="Copy to clipboard"
                      >
                        <CopyIcon className="text-foreground size-4" />
                      </Button>
                      {copiedId === message.id && (
                        <span className="absolute right-0 -bottom-5 text-xs text-green-500">
                          Copied!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full justify-start"
          >
            <div className="flex max-w-[85%] items-start gap-3">
              <div className="border-muted flex items-center rounded-2xl border border-dashed px-4 py-3">
                <div className="flex space-x-1">
                  <span
                    className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full"
                    style={{ animationDelay: "0ms" }}
                  ></span>
                  <span
                    className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full"
                    style={{ animationDelay: "150ms" }}
                  ></span>
                  <span
                    className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full dark:bg-gray-500"
                    style={{ animationDelay: "300ms" }}
                  ></span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <div className="shadow-btn-destructive-resting bg-btn-destructive text-destructive-foreground flex w-full items-center rounded-2xl px-4 py-2 text-sm">
              <span>Error: {error.message}</span>
            </div>
          </motion.div>
        )}

        {/* Empty div for scrolling to bottom */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="mx-auto mb-4 flex w-full max-w-2xl flex-col gap-3 px-4 md:px-0">
        <form
          onSubmit={handleCustomSubmit}
          className="focus-within:shadow-input-focus bg-background border-border relative z-10 mx-auto flex w-full max-w-3xl cursor-text flex-col items-stretch gap-1.5 rounded-4xl border pt-2.5 pr-2.5 pb-2.5 pl-6 shadow-xs transition-all duration-200 sm:mx-0"
        >
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Message MCP Assistant..."
              value={input}
              onChange={handleInputChange}
              className="px-0 text-base shadow-none focus:shadow-none"
              disabled={isLoading}
            />
            <Button type="submit" variant="default" disabled={isLoading || !input.trim()}>
              <ArrowUp />
            </Button>
          </div>
        </form>
        <footer className="text-muted-foreground mx-auto w-full max-w-2xl text-center text-xs">
          Powered by Auth0
        </footer>
      </div>
    </div>
  );
}
