import { prisma } from "@/lib/db";

export async function listDomains(params: {
  environment?: string;
  status?: string;
}) {
  const where: Record<string, string> = {};
  if (params.environment) where.environment = params.environment;
  if (params.status) where.status = params.status;

  const domains = await prisma.domain.findMany({
    where,
    include: {
      _count: { select: { subdomains: true, requests: true } },
    },
    orderBy: { name: "asc" },
  });

  return domains.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    status: d.status,
    environment: d.environment,
    owner: d.owner,
    team: d.team,
    subdomainCount: d._count.subdomains,
    requestCount: d._count.requests,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));
}

export async function listSubdomains(params: {
  domainId?: string;
  domainName?: string;
  environment?: string;
  status?: string;
  purpose?: string;
}) {
  const where: Record<string, unknown> = {};

  if (params.domainId) {
    where.domainId = params.domainId;
  } else if (params.domainName) {
    where.domain = { name: { contains: params.domainName } };
  }

  if (params.environment) where.environment = params.environment;
  if (params.status) where.status = params.status;
  if (params.purpose) where.purpose = params.purpose;

  const subdomains = await prisma.subdomain.findMany({
    where,
    include: { domain: { select: { name: true } } },
    orderBy: [{ domain: { name: "asc" } }, { name: "asc" }],
  });

  return subdomains.map((s) => ({
    id: s.id,
    name: s.name,
    fullDomain: s.fullDomain,
    description: s.description,
    purpose: s.purpose,
    status: s.status,
    environment: s.environment,
    targetIP: s.targetIP,
    sslEnabled: s.sslEnabled,
    domainId: s.domainId,
    domainName: s.domain.name,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));
}

export async function searchRegistry(params: { query: string }) {
  const q = params.query.toLowerCase();

  const [domains, subdomains] = await Promise.all([
    prisma.domain.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
          { owner: { contains: q } },
          { team: { contains: q } },
        ],
      },
      include: { _count: { select: { subdomains: true } } },
    }),
    prisma.subdomain.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { fullDomain: { contains: q } },
          { description: { contains: q } },
          { targetIP: { contains: q } },
        ],
      },
      include: { domain: { select: { name: true } } },
    }),
  ]);

  return {
    query: params.query,
    domains: domains.map((d) => ({
      type: "domain",
      id: d.id,
      name: d.name,
      description: d.description,
      status: d.status,
      environment: d.environment,
      subdomainCount: d._count.subdomains,
    })),
    subdomains: subdomains.map((s) => ({
      type: "subdomain",
      id: s.id,
      name: s.name,
      fullDomain: s.fullDomain,
      description: s.description,
      status: s.status,
      environment: s.environment,
      purpose: s.purpose,
      domainName: s.domain.name,
    })),
    totalResults: domains.length + subdomains.length,
  };
}

export async function getDomainTree() {
  const domains = await prisma.domain.findMany({
    include: {
      subdomains: {
        orderBy: { name: "asc" },
      },
    },
    orderBy: [{ environment: "asc" }, { name: "asc" }],
  });

  return domains.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    status: d.status,
    environment: d.environment,
    owner: d.owner,
    team: d.team,
    subdomains: d.subdomains.map((s) => ({
      id: s.id,
      name: s.name,
      fullDomain: s.fullDomain,
      description: s.description,
      purpose: s.purpose,
      status: s.status,
      environment: s.environment,
      targetIP: s.targetIP,
      sslEnabled: s.sslEnabled,
    })),
  }));
}
