"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge, statusVariant, priorityVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCurrentUser } from "@/components/layout/UserSwitcher";
import { ROLE_PERMISSIONS } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface PendingRequest {
  id: string;
  type: string;
  status: string;
  priority: string;
  title: string;
  description: string;
  requestedBy: string;
  requestedAt: string;
  domain?: { name: string } | null;
  subdomain?: { fullDomain: string } | null;
}

export default function ApprovalsPage() {
  const [currentUser] = useCurrentUser();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const canApprove = ROLE_PERMISSIONS[currentUser.role].canApprove;

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/requests?status=PENDING");
      const pending = await res.json();
      const res2 = await fetch("/api/requests?status=UNDER_REVIEW");
      const underReview = await res2.json();
      setRequests([...pending, ...underReview]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    const handler = () => loadRequests();
    window.addEventListener("userchange", handler);
    return () => window.removeEventListener("userchange", handler);
  }, [loadRequests]);

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId);
    await fetch(`/api/requests/${requestId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approvedBy: currentUser.email.split("@")[0],
      }),
    });
    await loadRequests();
    setProcessing(null);
  };

  const handleReject = async (requestId: string) => {
    const reason = rejectReasons[requestId];
    if (!reason) return;
    setProcessing(requestId);
    await fetch(`/api/requests/${requestId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rejectedBy: currentUser.email.split("@")[0],
        reason,
      }),
    });
    await loadRequests();
    setProcessing(null);
    setRejectingId(null);
  };

  if (!canApprove) {
    return (
      <div className="flex-1 flex flex-col">
        <Header title="Approval Queue" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Access Restricted
            </h3>
            <p className="text-gray-500 text-sm">
              You need Approver or Admin role to access the approval queue.
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Current role: {currentUser.role}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Approval Queue"
        subtitle={`${requests.length} request${requests.length !== 1 ? "s" : ""} awaiting review`}
      />

      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-wso2-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              All clear!
            </h3>
            <p className="text-gray-500">No pending requests at this time.</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {requests.map((req) => (
              <Card key={req.id}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant={statusVariant(req.status)}>
                        {req.status.replace(/_/g, " ")}
                      </Badge>
                      <Badge variant={priorityVariant(req.priority)}>
                        {req.priority}
                      </Badge>
                      <Badge variant="info">{req.type.replace(/_/g, " ")}</Badge>
                    </div>
                    <Link href={`/requests/${req.id}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-wso2-orange transition-colors">
                        {req.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {req.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  <span>
                    by <strong>{req.requestedBy}</strong>
                  </span>
                  {req.domain && (
                    <span className="font-mono">{req.domain.name}</span>
                  )}
                  {req.subdomain && (
                    <span className="font-mono">{req.subdomain.fullDomain}</span>
                  )}
                  <span>
                    {formatDistanceToNow(new Date(req.requestedAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleApprove(req.id)}
                    loading={processing === req.id}
                    disabled={processing !== null}
                  >
                    ✓ Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      setRejectingId(rejectingId === req.id ? null : req.id)
                    }
                    disabled={processing !== null}
                  >
                    ✗ Reject
                  </Button>
                  <Link
                    href={`/requests/${req.id}`}
                    className="text-sm text-wso2-orange hover:underline ml-auto"
                  >
                    View details →
                  </Link>
                </div>

                {rejectingId === req.id && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={rejectReasons[req.id] || ""}
                      onChange={(e) =>
                        setRejectReasons((prev) => ({
                          ...prev,
                          [req.id]: e.target.value,
                        }))
                      }
                      placeholder="Rejection reason..."
                      className="flex-1 px-3 py-1.5 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleReject(req.id)}
                      loading={processing === req.id}
                      disabled={!rejectReasons[req.id]}
                    >
                      Confirm
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
