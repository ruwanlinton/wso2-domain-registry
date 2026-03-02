"use client";

import clsx from "clsx";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  userName?: string;
}

// Simple markdown-like renderer for bold and inline code
function renderContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Convert **bold** and `code` inline
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={j}
            className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });

    if (line.startsWith("### ")) {
      return (
        <h3 key={i} className="font-bold text-sm mt-3 mb-1">
          {line.slice(4)}
        </h3>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h2 key={i} className="font-bold text-sm mt-3 mb-1">
          {line.slice(3)}
        </h2>
      );
    }
    if (line.startsWith("# ")) {
      return (
        <h1 key={i} className="font-bold text-base mt-3 mb-1">
          {line.slice(2)}
        </h1>
      );
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <li key={i} className="ml-4 list-disc">
          {parts}
        </li>
      );
    }
    if (line.match(/^\d+\. /)) {
      return (
        <li key={i} className="ml-4 list-decimal">
          {parts}
        </li>
      );
    }
    if (line.startsWith("---") || line.startsWith("===")) {
      return <hr key={i} className="border-gray-200 my-2" />;
    }
    if (line === "") {
      return <br key={i} />;
    }
    return (
      <p key={i} className="leading-relaxed">
        {parts}
      </p>
    );
  });
}

export function ChatMessage({ role, content, userName }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={clsx(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={clsx(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0",
          isUser
            ? "bg-wso2-orange text-white"
            : "bg-gray-800 text-white"
        )}
      >
        {isUser ? (userName || "U")[0].toUpperCase() : "AI"}
      </div>

      <div
        className={clsx(
          "max-w-2xl rounded-2xl px-4 py-3 text-sm",
          isUser
            ? "bg-wso2-orange text-white rounded-tr-sm"
            : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
        )}
      >
        <div className="space-y-0.5">{renderContent(content)}</div>
      </div>
    </div>
  );
}
