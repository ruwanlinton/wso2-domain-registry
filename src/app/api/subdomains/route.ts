export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get("domainId");
    const environment = searchParams.get("environment");
    const status = searchParams.get("status");
    const purpose = searchParams.get("purpose");

    const subdomains = await sql`
      SELECT s.*, d.name AS "domainName"
      FROM "Subdomain" s
      JOIN "Domain" d ON d.id = s."domainId"
      WHERE TRUE
        ${domainId ? sql`AND s."domainId" = ${domainId}` : sql``}
        ${environment ? sql`AND s.environment = ${environment}` : sql``}
        ${status ? sql`AND s.status = ${status}` : sql``}
        ${purpose ? sql`AND s.purpose = ${purpose}` : sql``}
      ORDER BY d.name ASC, s.name ASC
    `;

    const result = subdomains.map((s) => ({
      ...s,
      domain: { name: s.domainName },
      domainName: undefined,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/subdomains error:", error);
    return NextResponse.json({ error: "Failed to fetch subdomains" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = crypto.randomUUID();
    const now = new Date();
    const data = { id, ...body, createdAt: now, updatedAt: now };
    const [subdomain] = await sql`INSERT INTO "Subdomain" ${sql(data)} RETURNING *`;
    const [domain] = await sql`SELECT name FROM "Domain" WHERE id = ${subdomain.domainId}`;
    return NextResponse.json({ ...subdomain, domain: { name: domain?.name } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/subdomains error:", error);
    return NextResponse.json({ error: "Failed to create subdomain" }, { status: 500 });
  }
}
