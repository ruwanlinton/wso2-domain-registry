import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const domain = await prisma.domain.findUnique({
      where: { id: params.id },
      include: {
        subdomains: { orderBy: { name: "asc" } },
        requests: { orderBy: { requestedAt: "desc" }, take: 10 },
        auditLogs: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    return NextResponse.json(domain);
  } catch (error) {
    console.error("GET /api/domains/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch domain" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const domain = await prisma.domain.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json(domain);
  } catch (error) {
    console.error("PUT /api/domains/[id] error:", error);
    return NextResponse.json({ error: "Failed to update domain" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.domain.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/domains/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete domain" }, { status: 500 });
  }
}
