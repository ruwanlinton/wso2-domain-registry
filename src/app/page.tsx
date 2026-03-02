import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { statusVariant } from "@/lib/badge-variants";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

async function getStats() {
  const [domains, subdomains, requests, auditLogs] = await Promise.all([
    prisma.domain.count(),
    prisma.subdomain.count(),
    prisma.domainRequest.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const pendingCount =
    requests.find((r) => r.status === "PENDING")?._count.status || 0;
  const underReviewCount =
    requests.find((r) => r.status === "UNDER_REVIEW")?._count.status || 0;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const approvedThisMonth = await prisma.domainRequest.count({
    where: {
      status: "APPROVED",
      updatedAt: { gte: startOfMonth },
    },
  });

  return { domains, subdomains, pendingCount, underReviewCount, approvedThisMonth, auditLogs };
}

async function getRecentRequests() {
  return prisma.domainRequest.findMany({
    orderBy: { requestedAt: "desc" },
    take: 5,
    include: {
      domain: { select: { name: true } },
    },
  });
}

export default async function Dashboard() {
  const [stats, recentRequests] = await Promise.all([getStats(), getRecentRequests()]);

  const statCards = [
    {
      label: "Total Domains",
      value: stats.domains,
      icon: "🌐",
      color: "text-blue-600 bg-blue-50",
      href: "/domains",
    },
    {
      label: "Total Subdomains",
      value: stats.subdomains,
      icon: "📋",
      color: "text-purple-600 bg-purple-50",
      href: "/domains",
    },
    {
      label: "Pending Requests",
      value: stats.pendingCount + stats.underReviewCount,
      icon: "⏳",
      color: "text-orange-600 bg-orange-50",
      href: "/requests",
    },
    {
      label: "Approved This Month",
      value: stats.approvedThisMonth,
      icon: "✅",
      color: "text-green-600 bg-green-50",
      href: "/approvals",
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Dashboard"
        subtitle="WSO2 Domain & Subdomain Registry"
      />

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((card) => (
            <Link key={card.label} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${card.color}`}
                  >
                    {card.icon}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Requests</CardTitle>
              <Link
                href="/requests"
                className="text-sm text-wso2-orange hover:underline"
              >
                View all →
              </Link>
            </CardHeader>
            <div className="space-y-3">
              {recentRequests.map((req) => (
                <Link key={req.id} href={`/requests/${req.id}`}>
                  <div className="flex items-start gap-3 py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {req.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={statusVariant(req.status)}>
                          {req.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          by {req.requestedBy}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatDistanceToNow(new Date(req.requestedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Activity</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {stats.auditLogs.map((log) => (
                <div key={log.id} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 mt-2 rounded-full bg-wso2-orange flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 font-medium">
                      {log.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      by {log.performedBy} ·{" "}
                      {formatDistanceToNow(new Date(log.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white">
          <h3 className="font-semibold text-lg mb-1">
            Need help with domains?
          </h3>
          <p className="text-gray-300 text-sm mb-4">
            Use the AI assistant to search, request, and manage domains using natural language.
          </p>
          <Link
            href="/agent"
            className="inline-flex items-center gap-2 bg-wso2-orange hover:bg-wso2-orange-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Open AI Assistant →
          </Link>
        </div>
      </div>
    </div>
  );
}
