export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [domain] = await sql`SELECT * FROM "Domain" WHERE id = ${params.id}`;

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const [subdomains, requests, auditLogs] = await Promise.all([
      sql`SELECT * FROM "Subdomain" WHERE "domainId" = ${params.id} ORDER BY name ASC`,
      sql`SELECT * FROM "DomainRequest" WHERE "domainId" = ${params.id} ORDER BY "requestedAt" DESC LIMIT 10`,
      sql`SELECT * FROM "AuditLog" WHERE "domainId" = ${params.id} ORDER BY "createdAt" DESC LIMIT 20`,
    ]);

    return NextResponse.json({ ...domain, subdomains, requests, auditLogs });
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
    const data = { ...body, updatedAt: new Date() };
    const [domain] = await sql`
      UPDATE "Domain" SET ${sql(data)} WHERE id = ${params.id} RETURNING *
    `;
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
    await sql`DELETE FROM "Domain" WHERE id = ${params.id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/domains/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete domain" }, { status: 500 });
  }
}
