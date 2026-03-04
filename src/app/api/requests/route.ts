export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const requestedBy = searchParams.get("requestedBy");
    const priority = searchParams.get("priority");

    const rows = await sql`
      SELECT
        dr.*,
        d.name AS domain_name,
        s."fullDomain" AS subdomain_full_domain,
        (SELECT COUNT(*)::int FROM "Comment" c WHERE c."requestId" = dr.id) AS comment_count,
        (SELECT COUNT(*)::int FROM "Approval" a WHERE a."requestId" = dr.id) AS approval_count
      FROM "DomainRequest" dr
      LEFT JOIN "Domain" d ON d.id = dr."domainId"
      LEFT JOIN "Subdomain" s ON s.id = dr."subdomainId"
      WHERE TRUE
        ${status ? sql`AND dr.status = ${status}` : sql``}
        ${type ? sql`AND dr.type = ${type}` : sql``}
        ${requestedBy ? sql`AND dr."requestedBy" ILIKE ${"%" + requestedBy + "%"}` : sql``}
        ${priority ? sql`AND dr.priority = ${priority}` : sql``}
      ORDER BY dr."requestedAt" DESC
    `;

    const result = rows.map((r) => ({
      ...r,
      domain: r.domain_name ? { name: r.domain_name } : null,
      subdomain: r.subdomain_full_domain ? { fullDomain: r.subdomain_full_domain } : null,
      _count: { comments: r.comment_count, approvals: r.approval_count },
      domain_name: undefined,
      subdomain_full_domain: undefined,
      comment_count: undefined,
      approval_count: undefined,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/requests error:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = crypto.randomUUID();
    const now = new Date();
    const data = { id, ...body, requestedAt: now, updatedAt: now };
    const [domainRequest] = await sql`INSERT INTO "DomainRequest" ${sql(data)} RETURNING *`;

    const domain = domainRequest.domainId
      ? (await sql`SELECT name FROM "Domain" WHERE id = ${domainRequest.domainId}`)[0]
      : null;
    const subdomain = domainRequest.subdomainId
      ? (await sql`SELECT "fullDomain" FROM "Subdomain" WHERE id = ${domainRequest.subdomainId}`)[0]
      : null;

    return NextResponse.json(
      {
        ...domainRequest,
        domain: domain ? { name: domain.name } : null,
        subdomain: subdomain ? { fullDomain: subdomain.fullDomain } : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/requests error:", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
