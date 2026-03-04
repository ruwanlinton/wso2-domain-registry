export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const environment = searchParams.get("environment");
    const status = searchParams.get("status");

    const domains = await sql`
      SELECT d.*,
        (SELECT COUNT(*)::int FROM "Subdomain" s WHERE s."domainId" = d.id) AS subdomain_count,
        (SELECT COUNT(*)::int FROM "DomainRequest" r WHERE r."domainId" = d.id) AS request_count
      FROM "Domain" d
      WHERE TRUE
        ${environment ? sql`AND d.environment = ${environment}` : sql``}
        ${status ? sql`AND d.status = ${status}` : sql``}
      ORDER BY d.environment ASC, d.name ASC
    `;

    const domainIds = domains.map((d) => d.id);
    const subdomains =
      domainIds.length > 0
        ? await sql`SELECT * FROM "Subdomain" WHERE "domainId" = ANY(${domainIds}) ORDER BY name ASC`
        : [];

    const result = domains.map((d) => ({
      ...d,
      _count: { subdomains: d.subdomain_count, requests: d.request_count },
      subdomains: subdomains.filter((s) => s.domainId === d.id),
      subdomain_count: undefined,
      request_count: undefined,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/domains error:", error);
    return NextResponse.json({ error: "Failed to fetch domains" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = crypto.randomUUID();
    const now = new Date();
    const data = { id, ...body, createdAt: now, updatedAt: now };
    const [domain] = await sql`INSERT INTO "Domain" ${sql(data)} RETURNING *`;
    return NextResponse.json(domain, { status: 201 });
  } catch (error) {
    console.error("POST /api/domains error:", error);
    return NextResponse.json({ error: "Failed to create domain" }, { status: 500 });
  }
}
