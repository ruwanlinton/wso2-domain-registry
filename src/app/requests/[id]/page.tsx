"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, statusVariant, envVariant, priorityVariant } from "@/components/ui/Badge";
import { RequestTimeline } from "@/components/requests/RequestTimeline";
import { Button } from "@/components/ui/Button";
import { useCurrentUser } from "@/components/layout/UserSwitcher";
import { ROLE_PERMISSIONS } from "@/lib/types";
import { format } from "date-fns";

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [currentUser] = useCurrentUser();
  interface RequestData {
    id: string;
    type: string;
    status: string;
    priority: string;
    title: string;
    description: string;
    justification?: string | null;
    requestedBy: string;
    requestedAt: string;
    proposedName?: string | null;
    proposedEnvironment?: string | null;
    proposedPurpose?: string | null;
    proposedDescription?: string | null;
    currentValue?: string | null;
    proposedValue?: string | null;
    domain?: { name: string } | null;
    subdomain?: { fullDomain: string } | null;
    approvals: Array<{ id: string; approvedBy: string; status: string; comment: string | null; createdAt: string }>;
    comments: Array<{ id: string; author: string; content: string; createdAt: string }>;
    auditLogs: Array<{ id: string; action: string; performedBy: string; details: string | null; createdAt: string }>;
  }
  const [request, setRequest] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [implementing, setImplementing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [comment, setComment] = useState("");

  const loadRequest = async () => {
    const res = await fetch(`/api/requests/${id}`);
    const data = await res.json();
    setRequest(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRequest();
  }, [id]);

  const canApprove = ROLE_PERMISSIONS[currentUser.role].canApprove;
  const canImplement = ROLE_PERMISSIONS[currentUser.role].canImplement;
  const isPending =
    request?.status === "PENDING" || request?.status === "UNDER_REVIEW";
  const isApproved = request?.status === "APPROVED";

  const handleApprove = async () => {
    setApproving(true);
    await fetch(`/api/requests/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approvedBy: currentUser.email.split("@")[0],
        comment,
      }),
    });
    await loadRequest();
    setApproving(false);
    setComment("");
  };

  const handleReject = async () => {
    if (!rejectReason) return;
    setRejecting(true);
    await fetch(`/api/requests/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rejectedBy: currentUser.email.split("@")[0],
        reason: rejectReason,
      }),
    });
    await loadRequest();
    setRejecting(false);
    setShowRejectForm(false);
    setRejectReason("");
  };

  const handleImplement = async () => {
    setImplementing(true);
    await fetch(`/api/requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "IMPLEMENTED" }),
    });
    await loadRequest();
    setImplementing(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-wso2-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Request not found</p>
          <Button onClick={() => router.back()} variant="secondary" className="mt-4">
            Go back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Request Detail"
        subtitle={`#${request.id.slice(-8)}`}
        actions={
          <Button variant="secondary" onClick={() => router.back()} size="sm">
            ← Back
          </Button>
        }
      />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {request.title}
              </h2>
              <p className="text-gray-600 mb-4">{request.description}</p>
              {request.justification && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">
                    Business Justification
                  </p>
                  <p className="text-sm text-gray-700">
                    {request.justification}
                  </p>
                </div>
              )}
            </Card>

            {/* Proposed changes */}
            {(request.proposedName ||
              request.currentValue ||
              request.proposedValue) && (
              <Card>
                <CardHeader>
                  <CardTitle>Proposed Changes</CardTitle>
                </CardHeader>
                <div className="space-y-2 text-sm">
                  {request.proposedName && (
                    <div className="flex gap-4">
                      <span className="text-gray-500 w-32 flex-shrink-0">
                        Name
                      </span>
                      <span className="font-mono font-medium">
                        {request.proposedName}
                        {request.domain?.name ? `.${request.domain.name}` : ""}
                      </span>
                    </div>
                  )}
                  {request.proposedPurpose && (
                    <div className="flex gap-4">
                      <span className="text-gray-500 w-32 flex-shrink-0">
                        Purpose
                      </span>
                      <Badge variant="default">
                        {request.proposedPurpose}
                      </Badge>
                    </div>
                  )}
                  {request.proposedEnvironment && (
                    <div className="flex gap-4">
                      <span className="text-gray-500 w-32 flex-shrink-0">
                        Environment
                      </span>
                      <Badge variant={envVariant(request.proposedEnvironment)}>
                        {request.proposedEnvironment}
                      </Badge>
                    </div>
                  )}
                  {request.proposedDescription && (
                    <div className="flex gap-4">
                      <span className="text-gray-500 w-32 flex-shrink-0">
                        Description
                      </span>
                      <span>{request.proposedDescription}</span>
                    </div>
                  )}
                  {request.currentValue && (
                    <div className="flex gap-4">
                      <span className="text-gray-500 w-32 flex-shrink-0">
                        Current
                      </span>
                      <span className="font-mono text-red-600 line-through">
                        {request.currentValue}
                      </span>
                    </div>
                  )}
                  {request.proposedValue && (
                    <div className="flex gap-4">
                      <span className="text-gray-500 w-32 flex-shrink-0">
                        Proposed
                      </span>
                      <span className="font-mono text-green-600">
                        {request.proposedValue}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <RequestTimeline
                request={request}
                approvals={request.approvals}
                comments={request.comments}
                auditLogs={request.auditLogs}
              />
            </Card>

            {/* Approve/Reject Actions */}
            {canApprove && isPending && (
              <Card>
                <CardHeader>
                  <CardTitle>Review This Request</CardTitle>
                </CardHeader>
                <div className="space-y-3">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add an approval comment (optional)..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wso2-orange resize-none"
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="success"
                      onClick={handleApprove}
                      loading={approving}
                    >
                      ✓ Approve
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setShowRejectForm(!showRejectForm)}
                    >
                      ✗ Reject
                    </Button>
                  </div>
                  {showRejectForm && (
                    <div className="space-y-2">
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Rejection reason (required)..."
                        rows={2}
                        className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                      />
                      <Button
                        variant="danger"
                        onClick={handleReject}
                        loading={rejecting}
                        disabled={!rejectReason}
                        size="sm"
                      >
                        Confirm Rejection
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Implement Action */}
            {canImplement && isApproved && (
              <Card>
                <CardHeader>
                  <CardTitle>Implement This Request</CardTitle>
                </CardHeader>
                <p className="text-sm text-gray-600 mb-3">
                  This request has been approved. Mark it as implemented once the
                  DNS changes are applied.
                </p>
                <Button
                  variant="primary"
                  onClick={handleImplement}
                  loading={implementing}
                >
                  Mark as Implemented
                </Button>
              </Card>
            )}
          </div>

          {/* Sidebar metadata */}
          <div className="space-y-4">
            <Card>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500 mb-0.5">Status</dt>
                  <dd>
                    <Badge variant={statusVariant(request.status)}>
                      {request.status.replace(/_/g, " ")}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-0.5">Priority</dt>
                  <dd>
                    <Badge variant={priorityVariant(request.priority)}>
                      {request.priority}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-0.5">Type</dt>
                  <dd>
                    <Badge variant="info">
                      {request.type.replace(/_/g, " ")}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-0.5">Requested by</dt>
                  <dd className="font-medium">{request.requestedBy}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-0.5">Submitted</dt>
                  <dd>
                    {format(new Date(request.requestedAt), "MMM d, yyyy")}
                  </dd>
                </div>
                {request.domain?.name && (
                  <div>
                    <dt className="text-gray-500 mb-0.5">Domain</dt>
                    <dd className="font-mono font-medium">
                      {request.domain.name}
                    </dd>
                  </div>
                )}
                {request.subdomain?.fullDomain && (
                  <div>
                    <dt className="text-gray-500 mb-0.5">Subdomain</dt>
                    <dd className="font-mono font-medium">
                      {request.subdomain.fullDomain}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
