"use client";

import { useState } from "react";
import { Badge, envVariant, statusVariant } from "@/components/ui/Badge";

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
  domain: { name: string };
}

interface DomainTableProps {
  domains: Array<{
    id: string;
    name: string;
    description: string | null;
    status: string;
    environment: string;
    owner: string;
    team: string | null;
    subdomains: Subdomain[];
  }>;
}

export function DomainTable({ domains }: DomainTableProps) {
  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("");

  // Flatten all subdomains
  const allRows = domains.flatMap((d) =>
    d.subdomains.map((s) => ({
      ...s,
      domainName: d.name,
      domainOwner: d.owner,
    }))
  );

  const filtered = allRows.filter((row) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      row.fullDomain.toLowerCase().includes(q) ||
      row.description?.toLowerCase().includes(q) ||
      row.targetIP?.includes(q) ||
      row.domainName.toLowerCase().includes(q);
    const matchEnv = !envFilter || row.environment === envFilter;
    const matchPurpose = !purposeFilter || row.purpose === purposeFilter;
    return matchSearch && matchEnv && matchPurpose;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search domains, IPs, descriptions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wso2-orange focus:border-transparent"
        />
        <select
          value={envFilter}
          onChange={(e) => setEnvFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wso2-orange"
        >
          <option value="">All Environments</option>
          <option value="PRODUCTION">Production</option>
          <option value="STAGING">Staging</option>
          <option value="DEVELOPMENT">Development</option>
        </select>
        <select
          value={purposeFilter}
          onChange={(e) => setPurposeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wso2-orange"
        >
          <option value="">All Purposes</option>
          {["API", "WEB_APP", "INTERNAL", "DOCS", "CDN", "MAIL", "MONITORING", "ANALYTICS", "OTHER"].map(
            (p) => (
              <option key={p} value={p}>
                {p}
              </option>
            )
          )}
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-3">{filtered.length} subdomains</p>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-4 font-medium text-gray-600">
                Full Domain
              </th>
              <th className="text-left py-2 pr-4 font-medium text-gray-600">
                Purpose
              </th>
              <th className="text-left py-2 pr-4 font-medium text-gray-600">
                Environment
              </th>
              <th className="text-left py-2 pr-4 font-medium text-gray-600">
                Status
              </th>
              <th className="text-left py-2 pr-4 font-medium text-gray-600">
                Target IP
              </th>
              <th className="text-left py-2 font-medium text-gray-600">SSL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="py-2.5 pr-4">
                  <div>
                    <span className="font-mono font-medium text-gray-900">
                      {row.fullDomain}
                    </span>
                    {row.description && (
                      <p className="text-xs text-gray-500 truncate max-w-xs">
                        {row.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="py-2.5 pr-4">
                  <Badge variant="default">{row.purpose}</Badge>
                </td>
                <td className="py-2.5 pr-4">
                  <Badge variant={envVariant(row.environment)}>
                    {row.environment}
                  </Badge>
                </td>
                <td className="py-2.5 pr-4">
                  <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                </td>
                <td className="py-2.5 pr-4 font-mono text-xs text-gray-600">
                  {row.targetIP || "—"}
                </td>
                <td className="py-2.5">
                  {row.sslEnabled ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-gray-400">✗</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No subdomains match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
