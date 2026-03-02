import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const requestedBy = searchParams.get("requestedBy");
    const priority = searchParams.get("priority");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (requestedBy) where.requestedBy = requestedBy;
    if (priority) where.priority = priority;

    const requests = await prisma.domainRequest.findMany({
      where,
      include: {
        domain: { select: { name: true } },
        subdomain: { select: { fullDomain: true } },
        approvals: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { comments: true, approvals: true } },
      },
      orderBy: { requestedAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("GET /api/requests error:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const domainRequest = await prisma.domainRequest.create({
      data: body,
      include: {
        domain: { select: { name: true } },
        subdomain: { select: { fullDomain: true } },
      },
    });
    return NextResponse.json(domainRequest, { status: 201 });
  } catch (error) {
    console.error("POST /api/requests error:", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
