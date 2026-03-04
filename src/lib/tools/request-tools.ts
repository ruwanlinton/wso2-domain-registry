import sql from "@/lib/db";
import { UserRole } from "@/lib/types";

export async function getRequest(params: { requestId: string }) {
  const [row] = await sql`
    SELECT
      dr.*,
      d.name AS domain_name,
      s."fullDomain" AS subdomain_full_domain
    FROM "DomainRequest" dr
    LEFT JOIN "Domain" d ON d.id = dr."domainId"
    LEFT JOIN "Subdomain" s ON s.id = dr."subdomainId"
    WHERE dr.id = ${params.requestId}
  `;

  if (!row) {
    return { error: `Request ${params.requestId} not found` };
  }

  const [approvals, comments, auditLogs] = await Promise.all([
    sql`SELECT * FROM "Approval" WHERE "requestId" = ${params.requestId} ORDER BY "createdAt" ASC`,
    sql`SELECT * FROM "Comment" WHERE "requestId" = ${params.requestId} ORDER BY "createdAt" ASC`,
    sql`SELECT * FROM "AuditLog" WHERE "requestId" = ${params.requestId} ORDER BY "createdAt" ASC`,
  ]);

  return {
    ...row,
    domain: row.domain_name ? { name: row.domain_name } : null,
    subdomain: row.subdomain_full_domain ? { fullDomain: row.subdomain_full_domain } : null,
    approvals,
    comments,
    auditLogs,
    domain_name: undefined,
    subdomain_full_domain: undefined,
  };
}

export async function listRequests(params: {
  status?: string;
  type?: string;
  requestedBy?: string;
  priority?: string;
}) {
  const rows = await sql`
    SELECT
      dr.*,
      d.name AS domain_name,
      s."fullDomain" AS subdomain_full_domain,
      (SELECT COUNT(*)::int FROM "Approval" a WHERE a."requestId" = dr.id) AS approval_count,
      (SELECT COUNT(*)::int FROM "Comment" c WHERE c."requestId" = dr.id) AS comment_count
    FROM "DomainRequest" dr
    LEFT JOIN "Domain" d ON d.id = dr."domainId"
    LEFT JOIN "Subdomain" s ON s.id = dr."subdomainId"
    WHERE TRUE
      ${params.status ? sql`AND dr.status = ${params.status}` : sql``}
      ${params.type ? sql`AND dr.type = ${params.type}` : sql``}
      ${params.requestedBy ? sql`AND dr."requestedBy" ILIKE ${"%" + params.requestedBy + "%"}` : sql``}
      ${params.priority ? sql`AND dr.priority = ${params.priority}` : sql``}
    ORDER BY dr."requestedAt" DESC
  `;

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    priority: r.priority,
    title: r.title,
    description: r.description,
    requestedBy: r.requestedBy,
    requestedAt: r.requestedAt,
    domainName: r.domain_name,
    subdomainFullDomain: r.subdomain_full_domain,
    approvalCount: r.approval_count,
    commentCount: r.comment_count,
  }));
}

export async function createDomainRequest(
  params: {
    title: string;
    description: string;
    justification?: string;
    proposedName: string;
    proposedEnvironment: string;
    proposedDescription?: string;
    priority?: string;
  },
  requestedBy: string
) {
  const id = crypto.randomUUID();
  const now = new Date();

  const [request] = await sql`
    INSERT INTO "DomainRequest" ${sql({
      id,
      type: "CREATE_DOMAIN",
      status: "PENDING",
      priority: params.priority || "MEDIUM",
      title: params.title,
      description: params.description,
      justification: params.justification ?? null,
      requestedBy,
      proposedName: params.proposedName,
      proposedEnvironment: params.proposedEnvironment,
      proposedDescription: params.proposedDescription ?? null,
      requestedAt: now,
      updatedAt: now,
    })} RETURNING *
  `;

  await sql`
    INSERT INTO "AuditLog" ${sql({
      id: crypto.randomUUID(),
      action: "REQUEST_CREATED",
      entityType: "request",
      entityId: id,
      performedBy: requestedBy,
      details: `Created domain request: ${params.title}`,
      requestId: id,
      createdAt: now,
      updatedAt: now,
    })}
  `;

  return {
    success: true,
    requestId: id,
    message: `Domain request "${params.title}" submitted successfully. Request ID: ${id}`,
    request,
  };
}

export async function createSubdomainRequest(
  params: {
    domainName: string;
    title: string;
    description: string;
    justification?: string;
    proposedName: string;
    proposedPurpose: string;
    proposedEnvironment?: string;
    proposedDescription?: string;
    priority?: string;
  },
  requestedBy: string
) {
  const [domain] = await sql`
    SELECT * FROM "Domain" WHERE name ILIKE ${"%" + params.domainName + "%"} LIMIT 1
  `;

  if (!domain) {
    return {
      error: `Domain "${params.domainName}" not found. Use list_domains to see available domains.`,
    };
  }

  const id = crypto.randomUUID();
  const now = new Date();

  const [request] = await sql`
    INSERT INTO "DomainRequest" ${sql({
      id,
      type: "CREATE_SUBDOMAIN",
      status: "PENDING",
      priority: params.priority || "MEDIUM",
      title: params.title,
      description: params.description,
      justification: params.justification ?? null,
      requestedBy,
      proposedName: params.proposedName,
      proposedEnvironment: params.proposedEnvironment || domain.environment,
      proposedPurpose: params.proposedPurpose,
      proposedDescription: params.proposedDescription ?? null,
      domainId: domain.id,
      requestedAt: now,
      updatedAt: now,
    })} RETURNING *
  `;

  await sql`
    INSERT INTO "AuditLog" ${sql({
      id: crypto.randomUUID(),
      action: "REQUEST_CREATED",
      entityType: "request",
      entityId: id,
      performedBy: requestedBy,
      details: `Created subdomain request: ${params.proposedName}.${domain.name}`,
      requestId: id,
      domainId: domain.id,
      createdAt: now,
      updatedAt: now,
    })}
  `;

  return {
    success: true,
    requestId: id,
    message: `Subdomain request for "${params.proposedName}.${domain.name}" submitted successfully. Request ID: ${id}`,
    proposedFullDomain: `${params.proposedName}.${domain.name}`,
    request,
  };
}

export async function modifyEntryRequest(
  params: {
    entityType: "domain" | "subdomain";
    entityName: string;
    title: string;
    description: string;
    justification?: string;
    currentValue: string;
    proposedValue: string;
    priority?: string;
  },
  requestedBy: string
) {
  let domainId: string | undefined;
  let subdomainId: string | undefined;

  if (params.entityType === "domain") {
    const [domain] = await sql`
      SELECT id FROM "Domain" WHERE name ILIKE ${"%" + params.entityName + "%"} LIMIT 1
    `;
    if (!domain) return { error: `Domain "${params.entityName}" not found` };
    domainId = domain.id;
  } else {
    const [subdomain] = await sql`
      SELECT id, "domainId" FROM "Subdomain" WHERE "fullDomain" ILIKE ${"%" + params.entityName + "%"} LIMIT 1
    `;
    if (!subdomain) return { error: `Subdomain "${params.entityName}" not found` };
    subdomainId = subdomain.id;
    domainId = subdomain.domainId;
  }

  const type = params.entityType === "domain" ? "MODIFY_DOMAIN" : "MODIFY_SUBDOMAIN";
  const id = crypto.randomUUID();
  const now = new Date();

  const [request] = await sql`
    INSERT INTO "DomainRequest" ${sql({
      id,
      type,
      status: "PENDING",
      priority: params.priority || "MEDIUM",
      title: params.title,
      description: params.description,
      justification: params.justification ?? null,
      requestedBy,
      currentValue: params.currentValue,
      proposedValue: params.proposedValue,
      domainId: domainId ?? null,
      subdomainId: subdomainId ?? null,
      requestedAt: now,
      updatedAt: now,
    })} RETURNING *
  `;

  await sql`
    INSERT INTO "AuditLog" ${sql({
      id: crypto.randomUUID(),
      action: "REQUEST_CREATED",
      entityType: "request",
      entityId: id,
      performedBy: requestedBy,
      details: `Created modification request for ${params.entityType}: ${params.entityName}`,
      requestId: id,
      createdAt: now,
      updatedAt: now,
    })}
  `;

  return {
    success: true,
    requestId: id,
    message: `Modification request submitted. Request ID: ${id}`,
    request,
  };
}

export async function deleteEntryRequest(
  params: {
    entityType: "domain" | "subdomain";
    entityName: string;
    title: string;
    description: string;
    justification?: string;
    priority?: string;
  },
  requestedBy: string
) {
  let domainId: string | undefined;
  let subdomainId: string | undefined;

  if (params.entityType === "domain") {
    const [domain] = await sql`
      SELECT id FROM "Domain" WHERE name ILIKE ${"%" + params.entityName + "%"} LIMIT 1
    `;
    if (!domain) return { error: `Domain "${params.entityName}" not found` };
    domainId = domain.id;
  } else {
    const [subdomain] = await sql`
      SELECT id, "domainId" FROM "Subdomain" WHERE "fullDomain" ILIKE ${"%" + params.entityName + "%"} LIMIT 1
    `;
    if (!subdomain) return { error: `Subdomain "${params.entityName}" not found` };
    subdomainId = subdomain.id;
    domainId = subdomain.domainId;
  }

  const type = params.entityType === "domain" ? "DELETE_DOMAIN" : "DELETE_SUBDOMAIN";
  const id = crypto.randomUUID();
  const now = new Date();

  const [request] = await sql`
    INSERT INTO "DomainRequest" ${sql({
      id,
      type,
      status: "PENDING",
      priority: params.priority || "MEDIUM",
      title: params.title,
      description: params.description,
      justification: params.justification ?? null,
      requestedBy,
      domainId: domainId ?? null,
      subdomainId: subdomainId ?? null,
      requestedAt: now,
      updatedAt: now,
    })} RETURNING *
  `;

  await sql`
    INSERT INTO "AuditLog" ${sql({
      id: crypto.randomUUID(),
      action: "REQUEST_CREATED",
      entityType: "request",
      entityId: id,
      performedBy: requestedBy,
      details: `Created deletion request for ${params.entityType}: ${params.entityName}`,
      requestId: id,
      createdAt: now,
      updatedAt: now,
    })}
  `;

  return {
    success: true,
    requestId: id,
    message: `Deletion request submitted. Request ID: ${id}`,
    request,
  };
}

export async function approveRequest(
  params: { requestId: string; comment?: string },
  approvedBy: string,
  userRole: UserRole
) {
  if (userRole !== "APPROVER" && userRole !== "ADMIN") {
    return {
      error: `Permission denied. Only Approvers and Admins can approve requests. Your role is: ${userRole}`,
    };
  }

  const [request] = await sql`SELECT * FROM "DomainRequest" WHERE id = ${params.requestId}`;

  if (!request) {
    return { error: `Request ${params.requestId} not found` };
  }

  if (request.status !== "PENDING" && request.status !== "UNDER_REVIEW") {
    return {
      error: `Cannot approve request with status ${request.status}. Only PENDING or UNDER_REVIEW requests can be approved.`,
    };
  }

  const now = new Date();
  const approvalId = crypto.randomUUID();

  const [updatedRequest] = await sql`
    UPDATE "DomainRequest" SET status = 'APPROVED', "updatedAt" = ${now} WHERE id = ${params.requestId} RETURNING *
  `;

  const [approval] = await sql`
    INSERT INTO "Approval" ${sql({
      id: approvalId,
      requestId: params.requestId,
      approvedBy,
      status: "APPROVED",
      comment: params.comment ?? null,
      createdAt: now,
      updatedAt: now,
    })} RETURNING *
  `;

  await sql`
    INSERT INTO "AuditLog" ${sql({
      id: crypto.randomUUID(),
      action: "REQUEST_APPROVED",
      entityType: "request",
      entityId: params.requestId,
      performedBy: approvedBy,
      details: params.comment || "Approved",
      requestId: params.requestId,
      createdAt: now,
      updatedAt: now,
    })}
  `;

  return {
    success: true,
    message: `Request "${request.title}" has been approved.`,
    requestId: params.requestId,
    approvalId: approval.id,
    request: updatedRequest,
  };
}

export async function rejectRequest(
  params: { requestId: string; reason: string },
  rejectedBy: string,
  userRole: UserRole
) {
  if (userRole !== "APPROVER" && userRole !== "ADMIN") {
    return {
      error: `Permission denied. Only Approvers and Admins can reject requests. Your role is: ${userRole}`,
    };
  }

  const [request] = await sql`SELECT * FROM "DomainRequest" WHERE id = ${params.requestId}`;

  if (!request) {
    return { error: `Request ${params.requestId} not found` };
  }

  if (request.status !== "PENDING" && request.status !== "UNDER_REVIEW") {
    return {
      error: `Cannot reject request with status ${request.status}. Only PENDING or UNDER_REVIEW requests can be rejected.`,
    };
  }

  const now = new Date();
  const approvalId = crypto.randomUUID();

  const [updatedRequest] = await sql`
    UPDATE "DomainRequest" SET status = 'REJECTED', "updatedAt" = ${now} WHERE id = ${params.requestId} RETURNING *
  `;

  const [approval] = await sql`
    INSERT INTO "Approval" ${sql({
      id: approvalId,
      requestId: params.requestId,
      approvedBy: rejectedBy,
      status: "REJECTED",
      comment: params.reason,
      createdAt: now,
      updatedAt: now,
    })} RETURNING *
  `;

  await sql`
    INSERT INTO "AuditLog" ${sql({
      id: crypto.randomUUID(),
      action: "REQUEST_REJECTED",
      entityType: "request",
      entityId: params.requestId,
      performedBy: rejectedBy,
      details: params.reason,
      requestId: params.requestId,
      createdAt: now,
      updatedAt: now,
    })}
  `;

  return {
    success: true,
    message: `Request "${request.title}" has been rejected.`,
    requestId: params.requestId,
    rejectionId: approval.id,
    request: updatedRequest,
  };
}
