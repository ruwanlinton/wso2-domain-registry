import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const environment = searchParams.get("environment");
    const status = searchParams.get("status");

    const where: Record<string, string> = {};
    if (environment) where.environment = environment;
    if (status) where.status = status;

    const domains = await prisma.domain.findMany({
      where,
      include: {
        _count: { select: { subdomains: true, requests: true } },
        subdomains: { orderBy: { name: "asc" } },
      },
      orderBy: [{ environment: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(domains);
  } catch (error) {
    console.error("GET /api/domains error:", error);
    return NextResponse.json({ error: "Failed to fetch domains" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const domain = await prisma.domain.create({ data: body });
    return NextResponse.json(domain, { status: 201 });
  } catch (error) {
    console.error("POST /api/domains error:", error);
    return NextResponse.json({ error: "Failed to create domain" }, { status: 500 });
  }
}
