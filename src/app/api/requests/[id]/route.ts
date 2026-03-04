export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [row] = await sql`
      SELECT
        dr.*,
        d.name AS domain_name,
        s."fullDomain" AS subdomain_full_domain
      FROM "DomainRequest" dr
      LEFT JOIN "Domain" d ON d.id = dr."domainId"
      LEFT JOIN "Subdomain" s ON s.id = dr."subdomainId"
      WHERE dr.id = ${params.id}
    `;

    if (!row) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const [approvals, comments, auditLogs] = await Promise.all([
      sql`SELECT * FROM "Approval" WHERE "requestId" = ${params.id} ORDER BY "createdAt" ASC`,
      sql`SELECT * FROM "Comment" WHERE "requestId" = ${params.id} ORDER BY "createdAt" ASC`,
      sql`SELECT * FROM "AuditLog" WHERE "requestId" = ${params.id} ORDER BY "createdAt" ASC`,
    ]);

    const result = {
      ...row,
      domain: row.domain_name ? { name: row.domain_name } : null,
      subdomain: row.subdomain_full_domain ? { fullDomain: row.subdomain_full_domain } : null,
      approvals,
      comments,
      auditLogs,
      domain_name: undefined,
      subdomain_full_domain: undefined,
    };

    return NextResponse.json(result);
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
    const data = { ...body, updatedAt: new Date() };
    const [domainRequest] = await sql`
      UPDATE "DomainRequest" SET ${sql(data)} WHERE id = ${params.id} RETURNING *
    `;
    return NextResponse.json(domainRequest);
  } catch (error) {
    console.error("PUT /api/requests/[id] error:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
