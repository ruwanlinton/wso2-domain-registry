import sql from "@/lib/db";

export async function listDomains(params: {
  environment?: string;
  status?: string;
}) {
  const domains = await sql`
    SELECT d.*,
      (SELECT COUNT(*)::int FROM "Subdomain" s WHERE s."domainId" = d.id) AS subdomain_count,
      (SELECT COUNT(*)::int FROM "DomainRequest" r WHERE r."domainId" = d.id) AS request_count
    FROM "Domain" d
    WHERE TRUE
      ${params.environment ? sql`AND d.environment = ${params.environment}` : sql``}
      ${params.status ? sql`AND d.status = ${params.status}` : sql``}
    ORDER BY d.name ASC
  `;

  return domains.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    status: d.status,
    environment: d.environment,
    owner: d.owner,
    team: d.team,
    subdomainCount: d.subdomain_count,
    requestCount: d.request_count,
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
  const subdomains = await sql`
    SELECT s.*, d.name AS domain_name
    FROM "Subdomain" s
    JOIN "Domain" d ON d.id = s."domainId"
    WHERE TRUE
      ${params.domainId ? sql`AND s."domainId" = ${params.domainId}` : sql``}
      ${params.domainName ? sql`AND d.name ILIKE ${"%" + params.domainName + "%"}` : sql``}
      ${params.environment ? sql`AND s.environment = ${params.environment}` : sql``}
      ${params.status ? sql`AND s.status = ${params.status}` : sql``}
      ${params.purpose ? sql`AND s.purpose = ${params.purpose}` : sql``}
    ORDER BY d.name ASC, s.name ASC
  `;

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
    domainName: s.domain_name,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));
}

export async function searchRegistry(params: { query: string }) {
  const q = "%" + params.query + "%";

  const [domains, subdomains] = await Promise.all([
    sql`
      SELECT d.*,
        (SELECT COUNT(*)::int FROM "Subdomain" s WHERE s."domainId" = d.id) AS subdomain_count
      FROM "Domain" d
      WHERE d.name ILIKE ${q}
        OR d.description ILIKE ${q}
        OR d.owner ILIKE ${q}
        OR d.team ILIKE ${q}
    `,
    sql`
      SELECT s.*, d.name AS domain_name
      FROM "Subdomain" s
      JOIN "Domain" d ON d.id = s."domainId"
      WHERE s.name ILIKE ${q}
        OR s."fullDomain" ILIKE ${q}
        OR s.description ILIKE ${q}
        OR s."targetIP" ILIKE ${q}
    `,
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
      subdomainCount: d.subdomain_count,
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
      domainName: s.domain_name,
    })),
    totalResults: domains.length + subdomains.length,
  };
}

export async function getDomainTree() {
  const domains = await sql`
    SELECT * FROM "Domain" ORDER BY environment ASC, name ASC
  `;

  const domainIds = domains.map((d) => d.id);
  const subdomains =
    domainIds.length > 0
      ? await sql`SELECT * FROM "Subdomain" WHERE "domainId" = ANY(${domainIds}) ORDER BY name ASC`
      : [];

  return domains.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    status: d.status,
    environment: d.environment,
    owner: d.owner,
    team: d.team,
    subdomains: subdomains
      .filter((s) => s.domainId === d.id)
      .map((s) => ({
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
