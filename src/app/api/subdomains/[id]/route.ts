export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [subdomain] = await sql`
      SELECT s.*, d.id AS "domain_id", d.name AS "domain_name", d.description AS "domain_description",
        d.status AS "domain_status", d.environment AS "domain_environment",
        d.owner AS "domain_owner", d.team AS "domain_team",
        d."createdAt" AS "domain_createdAt", d."updatedAt" AS "domain_updatedAt"
      FROM "Subdomain" s
      JOIN "Domain" d ON d.id = s."domainId"
      WHERE s.id = ${params.id}
    `;

    if (!subdomain) {
      return NextResponse.json({ error: "Subdomain not found" }, { status: 404 });
    }

    const requests = await sql`
      SELECT * FROM "DomainRequest" WHERE "subdomainId" = ${params.id} ORDER BY "requestedAt" DESC LIMIT 10
    `;

    const result = {
      id: subdomain.id,
      name: subdomain.name,
      fullDomain: subdomain.fullDomain,
      description: subdomain.description,
      purpose: subdomain.purpose,
      status: subdomain.status,
      environment: subdomain.environment,
      targetIP: subdomain.targetIP,
      sslEnabled: subdomain.sslEnabled,
      domainId: subdomain.domainId,
      createdAt: subdomain.createdAt,
      updatedAt: subdomain.updatedAt,
      domain: {
        id: subdomain.domain_id,
        name: subdomain.domain_name,
        description: subdomain.domain_description,
        status: subdomain.domain_status,
        environment: subdomain.domain_environment,
        owner: subdomain.domain_owner,
        team: subdomain.domain_team,
        createdAt: subdomain.domain_createdAt,
        updatedAt: subdomain.domain_updatedAt,
      },
      requests,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/subdomains/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch subdomain" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = { ...body, updatedAt: new Date() };
    const [subdomain] = await sql`
      UPDATE "Subdomain" SET ${sql(data)} WHERE id = ${params.id} RETURNING *
    `;
    return NextResponse.json(subdomain);
  } catch (error) {
    console.error("PUT /api/subdomains/[id] error:", error);
    return NextResponse.json({ error: "Failed to update subdomain" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await sql`DELETE FROM "Subdomain" WHERE id = ${params.id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/subdomains/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete subdomain" }, { status: 500 });
  }
}
