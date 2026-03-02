import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get("domainId");
    const environment = searchParams.get("environment");
    const status = searchParams.get("status");
    const purpose = searchParams.get("purpose");

    const where: Record<string, unknown> = {};
    if (domainId) where.domainId = domainId;
    if (environment) where.environment = environment;
    if (status) where.status = status;
    if (purpose) where.purpose = purpose;

    const subdomains = await prisma.subdomain.findMany({
      where,
      include: { domain: { select: { name: true } } },
      orderBy: [{ domain: { name: "asc" } }, { name: "asc" }],
    });

    return NextResponse.json(subdomains);
  } catch (error) {
    console.error("GET /api/subdomains error:", error);
    return NextResponse.json({ error: "Failed to fetch subdomains" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subdomain = await prisma.subdomain.create({
      data: body,
      include: { domain: { select: { name: true } } },
    });
    return NextResponse.json(subdomain, { status: 201 });
  } catch (error) {
    console.error("POST /api/subdomains error:", error);
    return NextResponse.json({ error: "Failed to create subdomain" }, { status: 500 });
  }
}
