import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/types";

export async function getRequest(params: { requestId: string }) {
  const request = await prisma.domainRequest.findUnique({
    where: { id: params.requestId },
    include: {
      domain: true,
      subdomain: true,
      approvals: { orderBy: { createdAt: "asc" } },
      comments: { orderBy: { createdAt: "asc" } },
      auditLogs: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!request) {
    return { error: `Request ${params.requestId} not found` };
  }

  return request;
}

export async function listRequests(params: {
  status?: string;
  type?: string;
  requestedBy?: string;
  priority?: string;
}) {
  const where: Record<string, unknown> = {};
  if (params.status) where.status = params.status;
  if (params.type) where.type = params.type;
  if (params.requestedBy) where.requestedBy = { contains: params.requestedBy };
  if (params.priority) where.priority = params.priority;

  const requests = await prisma.domainRequest.findMany({
    where,
    include: {
      domain: { select: { name: true } },
      subdomain: { select: { fullDomain: true } },
      _count: { select: { approvals: true, comments: true } },
    },
    orderBy: { requestedAt: "desc" },
  });

  return requests.map((r) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    priority: r.priority,
    title: r.title,
    description: r.description,
    requestedBy: r.requestedBy,
    requestedAt: r.requestedAt,
    domainName: r.domain?.name,
    subdomainFullDomain: r.subdomain?.fullDomain,
    approvalCount: r._count.approvals,
    commentCount: r._count.comments,
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
  const request = await prisma.domainRequest.create({
    data: {
      type: "CREATE_DOMAIN",
      status: "PENDING",
      priority: (params.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") || "MEDIUM",
      title: params.title,
      description: params.description,
      justification: params.justification,
      requestedBy,
      proposedName: params.proposedName,
      proposedEnvironment: params.proposedEnvironment as
        | "PRODUCTION"
        | "STAGING"
        | "DEVELOPMENT"
        | "ALL",
      proposedDescription: params.proposedDescription,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "REQUEST_CREATED",
      entityType: "request",
      entityId: request.id,
      performedBy: requestedBy,
      details: `Created domain request: ${params.title}`,
      requestId: request.id,
    },
  });

  return {
    success: true,
    requestId: request.id,
    message: `Domain request "${params.title}" submitted successfully. Request ID: ${request.id}`,
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
  const domain = await prisma.domain.findFirst({
    where: { name: { contains: params.domainName } },
  });

  if (!domain) {
    return {
      error: `Domain "${params.domainName}" not found. Use list_domains to see available domains.`,
    };
  }

  const request = await prisma.domainRequest.create({
    data: {
      type: "CREATE_SUBDOMAIN",
      status: "PENDING",
      priority: (params.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") || "MEDIUM",
      title: params.title,
      description: params.description,
      justification: params.justification,
      requestedBy,
      proposedName: params.proposedName,
      proposedEnvironment: (params.proposedEnvironment as
        | "PRODUCTION"
        | "STAGING"
        | "DEVELOPMENT"
        | "ALL") || domain.environment,
      proposedPurpose: params.proposedPurpose as
        | "API"
        | "WEB_APP"
        | "INTERNAL"
        | "DOCS"
        | "CDN"
        | "MAIL"
        | "MONITORING"
        | "ANALYTICS"
        | "OTHER",
      proposedDescription: params.proposedDescription,
      domainId: domain.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "REQUEST_CREATED",
      entityType: "request",
      entityId: request.id,
      performedBy: requestedBy,
      details: `Created subdomain request: ${params.proposedName}.${domain.name}`,
      requestId: request.id,
      domainId: domain.id,
    },
  });

  return {
    success: true,
    requestId: request.id,
    message: `Subdomain request for "${params.proposedName}.${domain.name}" submitted successfully. Request ID: ${request.id}`,
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
    const domain = await prisma.domain.findFirst({
      where: { name: { contains: params.entityName } },
    });
    if (!domain) return { error: `Domain "${params.entityName}" not found` };
    domainId = domain.id;
  } else {
    const subdomain = await prisma.subdomain.findFirst({
      where: { fullDomain: { contains: params.entityName } },
    });
    if (!subdomain) return { error: `Subdomain "${params.entityName}" not found` };
    subdomainId = subdomain.id;
    domainId = subdomain.domainId;
  }

  const type =
    params.entityType === "domain" ? "MODIFY_DOMAIN" : "MODIFY_SUBDOMAIN";

  const request = await prisma.domainRequest.create({
    data: {
      type: type as "MODIFY_DOMAIN" | "MODIFY_SUBDOMAIN",
      status: "PENDING",
      priority: (params.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") || "MEDIUM",
      title: params.title,
      description: params.description,
      justification: params.justification,
      requestedBy,
      currentValue: params.currentValue,
      proposedValue: params.proposedValue,
      domainId,
      subdomainId,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "REQUEST_CREATED",
      entityType: "request",
      entityId: request.id,
      performedBy: requestedBy,
      details: `Created modification request for ${params.entityType}: ${params.entityName}`,
      requestId: request.id,
    },
  });

  return {
    success: true,
    requestId: request.id,
    message: `Modification request submitted. Request ID: ${request.id}`,
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
    const domain = await prisma.domain.findFirst({
      where: { name: { contains: params.entityName } },
    });
    if (!domain) return { error: `Domain "${params.entityName}" not found` };
    domainId = domain.id;
  } else {
    const subdomain = await prisma.subdomain.findFirst({
      where: { fullDomain: { contains: params.entityName } },
    });
    if (!subdomain) return { error: `Subdomain "${params.entityName}" not found` };
    subdomainId = subdomain.id;
    domainId = subdomain.domainId;
  }

  const type =
    params.entityType === "domain" ? "DELETE_DOMAIN" : "DELETE_SUBDOMAIN";

  const request = await prisma.domainRequest.create({
    data: {
      type: type as "DELETE_DOMAIN" | "DELETE_SUBDOMAIN",
      status: "PENDING",
      priority: (params.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") || "MEDIUM",
      title: params.title,
      description: params.description,
      justification: params.justification,
      requestedBy,
      domainId,
      subdomainId,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "REQUEST_CREATED",
      entityType: "request",
      entityId: request.id,
      performedBy: requestedBy,
      details: `Created deletion request for ${params.entityType}: ${params.entityName}`,
      requestId: request.id,
    },
  });

  return {
    success: true,
    requestId: request.id,
    message: `Deletion request submitted. Request ID: ${request.id}`,
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

  const request = await prisma.domainRequest.findUnique({
    where: { id: params.requestId },
  });

  if (!request) {
    return { error: `Request ${params.requestId} not found` };
  }

  if (request.status !== "PENDING" && request.status !== "UNDER_REVIEW") {
    return {
      error: `Cannot approve request with status ${request.status}. Only PENDING or UNDER_REVIEW requests can be approved.`,
    };
  }

  const [updatedRequest, approval] = await Promise.all([
    prisma.domainRequest.update({
      where: { id: params.requestId },
      data: { status: "APPROVED" },
    }),
    prisma.approval.create({
      data: {
        requestId: params.requestId,
        approvedBy,
        status: "APPROVED",
        comment: params.comment,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: "REQUEST_APPROVED",
        entityType: "request",
        entityId: params.requestId,
        performedBy: approvedBy,
        details: params.comment || "Approved",
        requestId: params.requestId,
      },
    }),
  ]);

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

  const request = await prisma.domainRequest.findUnique({
    where: { id: params.requestId },
  });

  if (!request) {
    return { error: `Request ${params.requestId} not found` };
  }

  if (request.status !== "PENDING" && request.status !== "UNDER_REVIEW") {
    return {
      error: `Cannot reject request with status ${request.status}. Only PENDING or UNDER_REVIEW requests can be rejected.`,
    };
  }

  const [updatedRequest, approval] = await Promise.all([
    prisma.domainRequest.update({
      where: { id: params.requestId },
      data: { status: "REJECTED" },
    }),
    prisma.approval.create({
      data: {
        requestId: params.requestId,
        approvedBy: rejectedBy,
        status: "REJECTED",
        comment: params.reason,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: "REQUEST_REJECTED",
        entityType: "request",
        entityId: params.requestId,
        performedBy: rejectedBy,
        details: params.reason,
        requestId: params.requestId,
      },
    }),
  ]);

  return {
    success: true,
    message: `Request "${request.title}" has been rejected.`,
    requestId: params.requestId,
    rejectionId: approval.id,
    request: updatedRequest,
  };
}
