"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ToolCallCard } from "./ToolCallCard";
import { Button } from "@/components/ui/Button";
import { useCurrentUser } from "@/components/layout/UserSwitcher";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ToolCall {
  id: string;
  toolName: string;
  toolInput?: unknown;
  result?: unknown;
  isLoading: boolean;
}

const SUGGESTED_PROMPTS = [
  "Show me all production subdomains for wso2.com",
  "What pending requests are waiting for approval?",
  "Search for all API subdomains across all domains",
  "Show me the full domain registry tree",
  "Request a new subdomain staging-api under choreo.dev for API testing",
  "What is the status of recent requests?",
];

export function AgentChat() {
  const [currentUser] = useCurrentUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, toolCalls]);

  // Listen for user changes
  useEffect(() => {
    const handler = () => {
      setMessages([]);
      setToolCalls([]);
    };
    window.addEventListener("userchange", handler);
    return () => window.removeEventListener("userchange", handler);
  }, []);

  const sendMessage = async (text?: string) => {
    const userMessage = text || input.trim();
    if (!userMessage || isStreaming) return;

    setInput("");
    setIsStreaming(true);

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);

    let assistantContent = "";
    const newToolCalls: ToolCall[] = [];

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userId: currentUser.id,
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (!data) continue;

          try {
            const event = JSON.parse(data);

            if (event.type === "text") {
              assistantContent += event.content;
              setMessages([
                ...newMessages,
                { role: "assistant", content: assistantContent },
              ]);
            } else if (event.type === "tool_start") {
              const tc: ToolCall = {
                id: event.toolUseId,
                toolName: event.toolName,
                toolInput: event.toolInput,
                isLoading: true,
              };
              newToolCalls.push(tc);
              setToolCalls([...newToolCalls]);
            } else if (event.type === "tool_result") {
              const idx = newToolCalls.findIndex(
                (t) => t.id === event.toolUseId
              );
              if (idx >= 0) {
                newToolCalls[idx] = {
                  ...newToolCalls[idx],
                  result: event.result,
                  isLoading: false,
                };
                setToolCalls([...newToolCalls]);
              }
            } else if (event.type === "done") {
              break;
            } else if (event.type === "error") {
              console.error("Agent error:", event.message);
              assistantContent += `\n\nError: ${event.message}`;
              setMessages([
                ...newMessages,
                { role: "assistant", content: assistantContent },
              ]);
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full gap-4">
      {/* Tool Activity Panel */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          Tool Activity
        </h3>
        <div className="flex-1 overflow-y-auto space-y-2">
          {toolCalls.length === 0 ? (
            <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-4 text-center">
              Tool calls will appear here as the agent works
            </div>
          ) : (
            toolCalls.map((tc) => (
              <ToolCallCard
                key={tc.id}
                toolName={tc.toolName}
                toolInput={tc.toolInput}
                result={tc.result}
                isLoading={tc.isLoading}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 bg-wso2-orange/10 rounded-2xl flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-wso2-orange"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Domain Registry Assistant
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm">
                Ask me anything about the WSO2 domain registry, submit requests, or manage approvals.
              </p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-md">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-left text-sm px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-wso2-orange hover:bg-orange-50 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <ChatMessage
              key={idx}
              role={msg.role}
              content={msg.content}
              userName={currentUser.name}
            />
          ))}

          {isStreaming && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                AI
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t pt-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about domains, submit requests, approve changes..."
                rows={2}
                disabled={isStreaming}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-wso2-orange resize-none disabled:opacity-50"
              />
              <p className="absolute bottom-2 right-3 text-xs text-gray-400">
                ↵ Send
              </p>
            </div>
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isStreaming}
              loading={isStreaming}
              className="flex-shrink-0"
            >
              Send
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Logged in as <strong>{currentUser.name}</strong> ({currentUser.role})
            · Shift+Enter for newline
          </p>
        </div>
      </div>
    </div>
  );
}
