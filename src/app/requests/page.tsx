"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { RequestCard } from "@/components/requests/RequestCard";
import { RequestForm } from "@/components/requests/RequestForm";
import { Button } from "@/components/ui/Button";
import { useCurrentUser } from "@/components/layout/UserSwitcher";
import { ROLE_PERMISSIONS } from "@/lib/types";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Implemented", value: "IMPLEMENTED" },
];

export default function RequestsPage() {
  const [currentUser] = useCurrentUser();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [myOnly, setMyOnly] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (myOnly) params.set("requestedBy", currentUser.email.split("@")[0]);
      const res = await fetch(`/api/requests?${params}`);
      const data = await res.json();
      setRequests(data);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, myOnly, currentUser]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Listen for user changes
  useEffect(() => {
    const handler = () => loadRequests();
    window.addEventListener("userchange", handler);
    return () => window.removeEventListener("userchange", handler);
  }, [loadRequests]);

  const canSubmit = ROLE_PERMISSIONS[currentUser.role].canSubmitRequests;

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Domain Requests"
        subtitle="Track and manage domain change requests"
        actions={
          canSubmit ? (
            <Button onClick={() => setShowForm(true)}>New Request</Button>
          ) : undefined
        }
      />

      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Status tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === tab.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={myOnly}
              onChange={(e) => setMyOnly(e.target.checked)}
              className="rounded accent-wso2-orange"
            />
            My requests only
          </label>
        </div>

        {/* Request List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-wso2-orange border-t-transparent rounded-full animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 mb-4">No requests found</p>
              {canSubmit && (
                <Button onClick={() => setShowForm(true)}>
                  Submit your first request
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req: Record<string, unknown>) => (
                <RequestCard key={req.id as string} request={req as Parameters<typeof RequestCard>[0]["request"]} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <RequestForm
          onClose={() => setShowForm(false)}
          onSuccess={() => loadRequests()}
        />
      )}
    </div>
  );
}
