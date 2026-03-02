"use client";

import Link from "next/link";
import { StatusBadge, PriorityBadge, RequestTypeBadge } from "./StatusBadge";
import { formatDistanceToNow } from "date-fns";

interface RequestCardProps {
  request: {
    id: string;
    type: string;
    status: string;
    priority: string;
    title: string;
    description: string;
    requestedBy: string;
    requestedAt: string | Date;
    domain?: { name: string } | null;
    subdomain?: { fullDomain: string } | null;
    _count?: { comments: number; approvals: number };
  };
}

export function RequestCard({ request }: RequestCardProps) {
  return (
    <Link href={`/requests/${request.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-wso2-orange hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <RequestTypeBadge type={request.type} />
              <StatusBadge status={request.status} />
              <PriorityBadge priority={request.priority} />
            </div>
            <h3 className="font-medium text-gray-900 truncate">{request.title}</h3>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
              {request.description}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span>
              by <strong>{request.requestedBy}</strong>
            </span>
            {request.domain && (
              <span className="font-mono text-gray-600">{request.domain.name}</span>
            )}
            {request.subdomain && (
              <span className="font-mono text-gray-600">
                {request.subdomain.fullDomain}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {request._count && (
              <>
                {request._count.comments > 0 && (
                  <span>💬 {request._count.comments}</span>
                )}
                {request._count.approvals > 0 && (
                  <span>✓ {request._count.approvals}</span>
                )}
              </>
            )}
            <span>
              {formatDistanceToNow(new Date(request.requestedAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
