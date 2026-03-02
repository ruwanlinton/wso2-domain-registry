"use client";

import { format } from "date-fns";

interface TimelineEvent {
  id: string;
  type: "created" | "comment" | "approval" | "audit";
  actor: string;
  content: string;
  timestamp: Date | string;
  status?: string;
}

interface RequestTimelineProps {
  request: {
    requestedBy: string;
    requestedAt: Date | string;
    title: string;
  };
  approvals: Array<{
    id: string;
    approvedBy: string;
    status: string;
    comment: string | null;
    createdAt: Date | string;
  }>;
  comments: Array<{
    id: string;
    author: string;
    content: string;
    createdAt: Date | string;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    performedBy: string;
    details: string | null;
    createdAt: Date | string;
  }>;
}

export function RequestTimeline({
  request,
  approvals,
  comments,
  auditLogs,
}: RequestTimelineProps) {
  // Build unified timeline
  const events: TimelineEvent[] = ([
    {
      id: "created",
      type: "created" as const,
      actor: request.requestedBy,
      content: `Submitted request: "${request.title}"`,
      timestamp: request.requestedAt,
    },
    ...comments.map((c) => ({
      id: c.id,
      type: "comment" as const,
      actor: c.author,
      content: c.content,
      timestamp: c.createdAt,
    })),
    ...approvals.map((a) => ({
      id: a.id,
      type: "approval" as const,
      actor: a.approvedBy,
      content: a.comment || (a.status === "APPROVED" ? "Approved" : "Rejected"),
      timestamp: a.createdAt,
      status: a.status,
    })),
  ] as TimelineEvent[]).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const iconMap: Record<string, React.ReactNode> = {
    created: (
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
      </div>
    ),
    comment: (
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
      </div>
    ),
    approval: (
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100">
        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    ),
  };

  return (
    <div className="space-y-4">
      {events.map((event, idx) => (
        <div key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            {event.type === "approval" && event.status === "REJECTED" ? (
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            ) : (
              iconMap[event.type]
            )}
            {idx < events.length - 1 && (
              <div className="w-px flex-1 bg-gray-200 mt-1" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-sm text-gray-900">{event.actor}</span>
              {event.type === "approval" && (
                <span
                  className={
                    event.status === "APPROVED"
                      ? "text-xs text-green-600 font-medium"
                      : "text-xs text-red-600 font-medium"
                  }
                >
                  {event.status}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {format(new Date(event.timestamp), "MMM d, yyyy 'at' HH:mm")}
              </span>
            </div>
            <p className="text-sm text-gray-700">{event.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
