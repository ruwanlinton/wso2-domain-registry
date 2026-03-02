import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const request = await prisma.domainRequest.findUnique({
      where: { id: params.id },
      include: {
        domain: true,
        subdomain: true,
        approvals: { orderBy: { createdAt: "asc" } },
        comments: { orderBy: { createdAt: "asc" } },
        auditLogs: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error("GET /api/requests/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch request" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const domainRequest = await prisma.domainRequest.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json(domainRequest);
  } catch (error) {
    console.error("PUT /api/requests/[id] error:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
