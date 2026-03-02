import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { rejectedBy, reason } = body;

    if (!reason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    const domainRequest = await prisma.domainRequest.findUnique({
      where: { id: params.id },
    });

    if (!domainRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (domainRequest.status !== "PENDING" && domainRequest.status !== "UNDER_REVIEW") {
      return NextResponse.json(
        { error: `Cannot reject request with status ${domainRequest.status}` },
        { status: 400 }
      );
    }

    const [updated, approval] = await Promise.all([
      prisma.domainRequest.update({
        where: { id: params.id },
        data: { status: "REJECTED" },
      }),
      prisma.approval.create({
        data: {
          requestId: params.id,
          approvedBy: rejectedBy || "system",
          status: "REJECTED",
          comment: reason,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: "REQUEST_REJECTED",
          entityType: "request",
          entityId: params.id,
          performedBy: rejectedBy || "system",
          details: reason,
          requestId: params.id,
        },
      }),
    ]);

    return NextResponse.json({ request: updated, approval });
  } catch (error) {
    console.error("POST /api/requests/[id]/reject error:", error);
    return NextResponse.json({ error: "Failed to reject request" }, { status: 500 });
  }
}
