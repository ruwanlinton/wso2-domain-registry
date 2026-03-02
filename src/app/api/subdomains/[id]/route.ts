import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subdomain = await prisma.subdomain.findUnique({
      where: { id: params.id },
      include: {
        domain: true,
        requests: { orderBy: { requestedAt: "desc" }, take: 10 },
      },
    });

    if (!subdomain) {
      return NextResponse.json({ error: "Subdomain not found" }, { status: 404 });
    }

    return NextResponse.json(subdomain);
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
    const subdomain = await prisma.subdomain.update({
      where: { id: params.id },
      data: body,
    });
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
    await prisma.subdomain.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/subdomains/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete subdomain" }, { status: 500 });
  }
}
