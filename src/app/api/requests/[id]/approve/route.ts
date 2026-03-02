import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { approvedBy, comment } = body;

    const domainRequest = await prisma.domainRequest.findUnique({
      where: { id: params.id },
    });

    if (!domainRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (domainRequest.status !== "PENDING" && domainRequest.status !== "UNDER_REVIEW") {
      return NextResponse.json(
        { error: `Cannot approve request with status ${domainRequest.status}` },
        { status: 400 }
      );
    }

    const [updated, approval] = await Promise.all([
      prisma.domainRequest.update({
        where: { id: params.id },
        data: { status: "APPROVED" },
      }),
      prisma.approval.create({
        data: {
          requestId: params.id,
          approvedBy: approvedBy || "system",
          status: "APPROVED",
          comment,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: "REQUEST_APPROVED",
          entityType: "request",
          entityId: params.id,
          performedBy: approvedBy || "system",
          details: comment || "Approved",
          requestId: params.id,
        },
      }),
    ]);

    return NextResponse.json({ request: updated, approval });
  } catch (error) {
    console.error("POST /api/requests/[id]/approve error:", error);
    return NextResponse.json({ error: "Failed to approve request" }, { status: 500 });
  }
}
