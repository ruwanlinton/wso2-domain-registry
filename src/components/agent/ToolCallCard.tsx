"use client";

import { useState } from "react";
import clsx from "clsx";

interface ToolCallCardProps {
  toolName: string;
  toolInput?: unknown;
  result?: unknown;
  isLoading?: boolean;
}

const toolLabels: Record<string, string> = {
  list_domains: "List Domains",
  list_subdomains: "List Subdomains",
  search_registry: "Search Registry",
  get_domain_tree: "Get Domain Tree",
  get_request: "Get Request",
  list_requests: "List Requests",
  create_domain_request: "Create Domain Request",
  create_subdomain_request: "Create Subdomain Request",
  modify_entry_request: "Modify Entry Request",
  delete_entry_request: "Delete Entry Request",
  approve_request: "Approve Request",
  reject_request: "Reject Request",
};

const toolIcons: Record<string, string> = {
  list_domains: "🌐",
  list_subdomains: "📋",
  search_registry: "🔍",
  get_domain_tree: "🌳",
  get_request: "📄",
  list_requests: "📋",
  create_domain_request: "✨",
  create_subdomain_request: "✨",
  modify_entry_request: "✏️",
  delete_entry_request: "🗑️",
  approve_request: "✅",
  reject_request: "❌",
};

export function ToolCallCard({ toolName, toolInput, result, isLoading }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className={clsx(
          "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
          isLoading ? "bg-blue-50" : result ? "bg-green-50" : "bg-gray-50"
        )}
      >
        <span>{toolIcons[toolName] || "🔧"}</span>
        <span className="font-medium text-gray-700">
          {toolLabels[toolName] || toolName}
        </span>
        {isLoading && (
          <span className="ml-auto">
            <svg
              className="animate-spin h-3 w-3 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </span>
        )}
        {!isLoading && Boolean(result) && (
          <span className="ml-auto text-green-600">✓</span>
        )}
        <span className="text-gray-400">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 divide-y divide-gray-100">
          {Boolean(toolInput) && (
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-gray-500 mb-1">Input</p>
              <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(toolInput, null, 2)}
              </pre>
            </div>
          )}
          {Boolean(result) && (
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-gray-500 mb-1">Result</p>
              <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap max-h-48">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
