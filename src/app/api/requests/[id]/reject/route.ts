export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

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

    const [domainRequest] = await sql`SELECT * FROM "DomainRequest" WHERE id = ${params.id}`;

    if (!domainRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (domainRequest.status !== "PENDING" && domainRequest.status !== "UNDER_REVIEW") {
      return NextResponse.json(
        { error: `Cannot reject request with status ${domainRequest.status}` },
        { status: 400 }
      );
    }

    const rejecter = rejectedBy || "system";
    const now = new Date();

    const [updated] = await sql`
      UPDATE "DomainRequest" SET status = 'REJECTED', "updatedAt" = ${now} WHERE id = ${params.id} RETURNING *
    `;

    const approvalId = crypto.randomUUID();
    const [approval] = await sql`
      INSERT INTO "Approval" ${sql({
        id: approvalId,
        requestId: params.id,
        approvedBy: rejecter,
        status: "REJECTED",
        comment: reason,
        createdAt: now,
        updatedAt: now,
      })} RETURNING *
    `;

    await sql`
      INSERT INTO "AuditLog" ${sql({
        id: crypto.randomUUID(),
        action: "REQUEST_REJECTED",
        entityType: "request",
        entityId: params.id,
        performedBy: rejecter,
        details: reason,
        requestId: params.id,
        createdAt: now,
        updatedAt: now,
      })}
    `;

    return NextResponse.json({ request: updated, approval });
  } catch (error) {
    console.error("POST /api/requests/[id]/reject error:", error);
    return NextResponse.json({ error: "Failed to reject request" }, { status: 500 });
  }
}
