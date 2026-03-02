"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { DomainTree } from "@/components/domains/DomainTree";
import { DomainTable } from "@/components/domains/DomainTable";

export default function DomainsPage() {
  const [view, setView] = useState<"tree" | "table">("tree");
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/domains")
      .then((r) => r.json())
      .then((data) => {
        setDomains(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Domain Registry"
        subtitle="Browse and explore all registered domains and subdomains"
        actions={
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setView("tree")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "tree"
                  ? "bg-wso2-orange text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Tree
            </button>
            <button
              onClick={() => setView("table")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "table"
                  ? "bg-wso2-orange text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Table
            </button>
          </div>
        }
      />

      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-wso2-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Loading registry...</p>
            </div>
          </div>
        ) : view === "tree" ? (
          <DomainTree domains={domains} />
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <DomainTable domains={domains} />
          </div>
        )}
      </div>
    </div>
  );
}
