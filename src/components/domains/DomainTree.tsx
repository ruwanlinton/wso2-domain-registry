"use client";

import { useState } from "react";
import { Badge, envVariant, statusVariant } from "@/components/ui/Badge";
import clsx from "clsx";

interface Subdomain {
  id: string;
  name: string;
  fullDomain: string;
  description: string | null;
  purpose: string;
  status: string;
  environment: string;
  targetIP: string | null;
  sslEnabled: boolean;
}

interface Domain {
  id: string;
  name: string;
  description: string | null;
  status: string;
  environment: string;
  owner: string;
  team: string | null;
  subdomains: Subdomain[];
  _count?: { subdomains: number };
}

const purposeIcon: Record<string, string> = {
  API: "⚡",
  WEB_APP: "🌐",
  INTERNAL: "🔒",
  DOCS: "📚",
  CDN: "🚀",
  MAIL: "✉️",
  MONITORING: "📊",
  ANALYTICS: "📈",
  OTHER: "•",
};

function SubdomainRow({ subdomain }: { subdomain: Subdomain }) {
  return (
    <div className="flex items-center gap-3 py-2 pl-8 pr-4 hover:bg-gray-50 rounded-md group">
      <span className="text-gray-400 text-sm w-4 flex-shrink-0">└</span>
      <span className="text-sm">{purposeIcon[subdomain.purpose] || "•"}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-gray-800 font-medium">
            {subdomain.fullDomain}
          </span>
          {subdomain.sslEnabled && (
            <span title="SSL Enabled" className="text-green-500 text-xs">
              🔐
            </span>
          )}
        </div>
        {subdomain.description && (
          <p className="text-xs text-gray-500 truncate">{subdomain.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant="default" className="text-xs">
          {subdomain.purpose}
        </Badge>
        <Badge variant={statusVariant(subdomain.status)}>{subdomain.status}</Badge>
        {subdomain.targetIP && (
          <span className="text-xs text-gray-400 font-mono hidden lg:block">
            {subdomain.targetIP}
          </span>
        )}
      </div>
    </div>
  );
}

function DomainNode({ domain }: { domain: Domain }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <span
          className={clsx(
            "text-gray-400 transition-transform text-sm",
            expanded ? "rotate-90" : ""
          )}
        >
          ▶
        </span>
        <svg
          className="w-4 h-4 text-wso2-orange flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-gray-900">{domain.name}</span>
            <Badge variant={envVariant(domain.environment)}>{domain.environment}</Badge>
            <Badge variant={statusVariant(domain.status)}>{domain.status}</Badge>
          </div>
          {domain.description && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{domain.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 text-xs text-gray-500">
          <span>{domain.subdomains.length} subdomains</span>
          <span>•</span>
          <span>{domain.owner}</span>
        </div>
      </button>

      {expanded && domain.subdomains.length > 0 && (
        <div className="border-t border-gray-100 bg-white px-2 py-1">
          {domain.subdomains.map((sub) => (
            <SubdomainRow key={sub.id} subdomain={sub} />
          ))}
        </div>
      )}

      {expanded && domain.subdomains.length === 0 && (
        <div className="border-t border-gray-100 bg-gray-50 px-8 py-3 text-sm text-gray-400">
          No subdomains registered
        </div>
      )}
    </div>
  );
}

interface DomainTreeProps {
  domains: Domain[];
}

export function DomainTree({ domains }: DomainTreeProps) {
  const grouped = domains.reduce(
    (acc, d) => {
      if (!acc[d.environment]) acc[d.environment] = [];
      acc[d.environment].push(d);
      return acc;
    },
    {} as Record<string, Domain[]>
  );

  const envOrder = ["PRODUCTION", "STAGING", "DEVELOPMENT", "ALL"];

  return (
    <div className="space-y-6">
      {envOrder.map((env) => {
        if (!grouped[env]) return null;
        return (
          <div key={env}>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={envVariant(env)}>{env}</Badge>
              <span className="text-sm text-gray-500">
                {grouped[env].length} domain{grouped[env].length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-2">
              {grouped[env].map((domain) => (
                <DomainNode key={domain.id} domain={domain} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
