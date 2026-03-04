export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { approvedBy, comment } = body;

    const [domainRequest] = await sql`SELECT * FROM "DomainRequest" WHERE id = ${params.id}`;

    if (!domainRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (domainRequest.status !== "PENDING" && domainRequest.status !== "UNDER_REVIEW") {
      return NextResponse.json(
        { error: `Cannot approve request with status ${domainRequest.status}` },
        { status: 400 }
      );
    }

    const approver = approvedBy || "system";
    const now = new Date();

    const [updated] = await sql`
      UPDATE "DomainRequest" SET status = 'APPROVED', "updatedAt" = ${now} WHERE id = ${params.id} RETURNING *
    `;

    const approvalId = crypto.randomUUID();
    const [approval] = await sql`
      INSERT INTO "Approval" ${sql({
        id: approvalId,
        requestId: params.id,
        approvedBy: approver,
        status: "APPROVED",
        comment: comment ?? null,
        createdAt: now,
        updatedAt: now,
      })} RETURNING *
    `;

    await sql`
      INSERT INTO "AuditLog" ${sql({
        id: crypto.randomUUID(),
        action: "REQUEST_APPROVED",
        entityType: "request",
        entityId: params.id,
        performedBy: approver,
        details: comment || "Approved",
        requestId: params.id,
        createdAt: now,
        updatedAt: now,
      })}
    `;

    return NextResponse.json({ request: updated, approval });
  } catch (error) {
    console.error("POST /api/requests/[id]/approve error:", error);
    return NextResponse.json({ error: "Failed to approve request" }, { status: 500 });
  }
}
