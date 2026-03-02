import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.domainRequest.deleteMany();
  await prisma.subdomain.deleteMany();
  await prisma.domain.deleteMany();

  // --- Domains ---
  const wso2 = await prisma.domain.create({
    data: {
      name: "wso2.com",
      description: "Primary WSO2 corporate and product domain",
      status: "ACTIVE",
      environment: "PRODUCTION",
      owner: "platform-team",
      team: "Platform Engineering",
    },
  });

  const asgardeo = await prisma.domain.create({
    data: {
      name: "asgardeo.io",
      description: "Asgardeo Identity-as-a-Service platform",
      status: "ACTIVE",
      environment: "PRODUCTION",
      owner: "identity-team",
      team: "Identity & Access Management",
    },
  });

  const choreo = await prisma.domain.create({
    data: {
      name: "choreo.dev",
      description: "Choreo internal developer platform",
      status: "ACTIVE",
      environment: "PRODUCTION",
      owner: "choreo-team",
      team: "Choreo Platform",
    },
  });

  const stagingWso2 = await prisma.domain.create({
    data: {
      name: "staging.wso2.com",
      description: "WSO2 staging environment for pre-production testing",
      status: "ACTIVE",
      environment: "STAGING",
      owner: "platform-team",
      team: "Platform Engineering",
    },
  });

  const devWso2 = await prisma.domain.create({
    data: {
      name: "dev.wso2.com",
      description: "WSO2 internal development environment",
      status: "ACTIVE",
      environment: "DEVELOPMENT",
      owner: "devops-team",
      team: "DevOps",
    },
  });

  const ballerina = await prisma.domain.create({
    data: {
      name: "ballerina.io",
      description: "Ballerina programming language platform",
      status: "ACTIVE",
      environment: "PRODUCTION",
      owner: "ballerina-team",
      team: "Ballerina",
    },
  });

  // --- wso2.com Subdomains ---
  await prisma.subdomain.createMany({
    data: [
      {
        name: "api",
        fullDomain: "api.wso2.com",
        description: "WSO2 public API gateway endpoint",
        purpose: "API",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.10",
        sslEnabled: true,
        domainId: wso2.id,
      },
      {
        name: "identity",
        fullDomain: "identity.wso2.com",
        description: "WSO2 Identity Server public endpoint",
        purpose: "API",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.11",
        sslEnabled: true,
        domainId: wso2.id,
      },
      {
        name: "docs",
        fullDomain: "docs.wso2.com",
        description: "WSO2 product documentation site",
        purpose: "DOCS",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.12",
        sslEnabled: true,
        domainId: wso2.id,
      },
      {
        name: "console",
        fullDomain: "console.wso2.com",
        description: "WSO2 management console web app",
        purpose: "WEB_APP",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.13",
        sslEnabled: true,
        domainId: wso2.id,
      },
      {
        name: "cdn",
        fullDomain: "cdn.wso2.com",
        description: "WSO2 content delivery network",
        purpose: "CDN",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.14",
        sslEnabled: true,
        domainId: wso2.id,
      },
      {
        name: "mail",
        fullDomain: "mail.wso2.com",
        description: "WSO2 corporate mail server",
        purpose: "MAIL",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.15",
        sslEnabled: true,
        domainId: wso2.id,
      },
      {
        name: "monitoring",
        fullDomain: "monitoring.wso2.com",
        description: "Internal monitoring and observability dashboard",
        purpose: "MONITORING",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.16",
        sslEnabled: true,
        domainId: wso2.id,
      },
      {
        name: "analytics",
        fullDomain: "analytics.wso2.com",
        description: "WSO2 analytics platform",
        purpose: "ANALYTICS",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.17",
        sslEnabled: true,
        domainId: wso2.id,
      },
      {
        name: "blog",
        fullDomain: "blog.wso2.com",
        description: "WSO2 engineering and corporate blog",
        purpose: "WEB_APP",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.18",
        sslEnabled: true,
        domainId: wso2.id,
      },
    ],
  });

  // --- asgardeo.io Subdomains ---
  await prisma.subdomain.createMany({
    data: [
      {
        name: "accounts",
        fullDomain: "accounts.asgardeo.io",
        description: "Asgardeo user account management portal",
        purpose: "WEB_APP",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.20",
        sslEnabled: true,
        domainId: asgardeo.id,
      },
      {
        name: "api",
        fullDomain: "api.asgardeo.io",
        description: "Asgardeo REST API endpoint",
        purpose: "API",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.21",
        sslEnabled: true,
        domainId: asgardeo.id,
      },
      {
        name: "console",
        fullDomain: "console.asgardeo.io",
        description: "Asgardeo admin console",
        purpose: "WEB_APP",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.22",
        sslEnabled: true,
        domainId: asgardeo.id,
      },
      {
        name: "docs",
        fullDomain: "docs.asgardeo.io",
        description: "Asgardeo product documentation",
        purpose: "DOCS",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.23",
        sslEnabled: true,
        domainId: asgardeo.id,
      },
    ],
  });

  // --- choreo.dev Subdomains ---
  await prisma.subdomain.createMany({
    data: [
      {
        name: "api",
        fullDomain: "api.choreo.dev",
        description: "Choreo platform API endpoint",
        purpose: "API",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.30",
        sslEnabled: true,
        domainId: choreo.id,
      },
      {
        name: "console",
        fullDomain: "console.choreo.dev",
        description: "Choreo developer console",
        purpose: "WEB_APP",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.31",
        sslEnabled: true,
        domainId: choreo.id,
      },
      {
        name: "registry",
        fullDomain: "registry.choreo.dev",
        description: "Choreo component and artifact registry",
        purpose: "INTERNAL",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.32",
        sslEnabled: true,
        domainId: choreo.id,
      },
      {
        name: "docs",
        fullDomain: "docs.choreo.dev",
        description: "Choreo documentation portal",
        purpose: "DOCS",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.33",
        sslEnabled: true,
        domainId: choreo.id,
      },
      {
        name: "monitoring",
        fullDomain: "monitoring.choreo.dev",
        description: "Choreo internal monitoring",
        purpose: "MONITORING",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.34",
        sslEnabled: true,
        domainId: choreo.id,
      },
    ],
  });

  // --- staging.wso2.com Subdomains ---
  await prisma.subdomain.createMany({
    data: [
      {
        name: "api",
        fullDomain: "api.staging.wso2.com",
        description: "API gateway staging endpoint",
        purpose: "API",
        status: "ACTIVE",
        environment: "STAGING",
        targetIP: "10.0.1.10",
        sslEnabled: true,
        domainId: stagingWso2.id,
      },
      {
        name: "identity",
        fullDomain: "identity.staging.wso2.com",
        description: "Identity Server staging endpoint",
        purpose: "API",
        status: "ACTIVE",
        environment: "STAGING",
        targetIP: "10.0.1.11",
        sslEnabled: true,
        domainId: stagingWso2.id,
      },
      {
        name: "console",
        fullDomain: "console.staging.wso2.com",
        description: "Management console staging",
        purpose: "WEB_APP",
        status: "ACTIVE",
        environment: "STAGING",
        targetIP: "10.0.1.12",
        sslEnabled: true,
        domainId: stagingWso2.id,
      },
    ],
  });

  // --- dev.wso2.com Subdomains ---
  await prisma.subdomain.createMany({
    data: [
      {
        name: "api",
        fullDomain: "api.dev.wso2.com",
        description: "API gateway dev endpoint",
        purpose: "API",
        status: "ACTIVE",
        environment: "DEVELOPMENT",
        targetIP: "10.0.2.10",
        sslEnabled: false,
        domainId: devWso2.id,
      },
      {
        name: "internal",
        fullDomain: "internal.dev.wso2.com",
        description: "Internal developer services",
        purpose: "INTERNAL",
        status: "ACTIVE",
        environment: "DEVELOPMENT",
        targetIP: "10.0.2.11",
        sslEnabled: false,
        domainId: devWso2.id,
      },
    ],
  });

  // --- ballerina.io Subdomains ---
  await prisma.subdomain.createMany({
    data: [
      {
        name: "central",
        fullDomain: "central.ballerina.io",
        description: "Ballerina Central package repository",
        purpose: "API",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.40",
        sslEnabled: true,
        domainId: ballerina.id,
      },
      {
        name: "play",
        fullDomain: "play.ballerina.io",
        description: "Ballerina online playground",
        purpose: "WEB_APP",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.41",
        sslEnabled: true,
        domainId: ballerina.id,
      },
      {
        name: "docs",
        fullDomain: "docs.ballerina.io",
        description: "Ballerina language documentation",
        purpose: "DOCS",
        status: "ACTIVE",
        environment: "PRODUCTION",
        targetIP: "203.0.113.42",
        sslEnabled: true,
        domainId: ballerina.id,
      },
    ],
  });

  // --- Demo Requests ---
  const req1 = await prisma.domainRequest.create({
    data: {
      type: "CREATE_SUBDOMAIN",
      status: "PENDING",
      priority: "HIGH",
      title: "Add metrics.choreo.dev for Prometheus metrics endpoint",
      description:
        "We need a dedicated subdomain for exposing Prometheus-compatible metrics from the Choreo platform. This will be used by the SRE team for alerting and dashboards.",
      justification:
        "Current monitoring.choreo.dev serves the UI dashboard. A separate metrics endpoint is needed for machine-readable scraping.",
      requestedBy: "sarah.chen",
      proposedName: "metrics",
      proposedEnvironment: "PRODUCTION",
      proposedPurpose: "MONITORING",
      proposedDescription: "Prometheus metrics scraping endpoint for Choreo",
      domainId: choreo.id,
    },
  });

  const req2 = await prisma.domainRequest.create({
    data: {
      type: "CREATE_SUBDOMAIN",
      status: "UNDER_REVIEW",
      priority: "MEDIUM",
      title: "Add analytics.asgardeo.io for usage analytics dashboard",
      description:
        "The Asgardeo product team requires an analytics subdomain to host usage dashboards for customers to monitor their identity operations.",
      justification:
        "Customer request — enterprise clients need visibility into login events, MFA usage, and audit logs.",
      requestedBy: "james.wilson",
      proposedName: "analytics",
      proposedEnvironment: "PRODUCTION",
      proposedPurpose: "ANALYTICS",
      proposedDescription: "Customer-facing usage analytics for Asgardeo",
      domainId: asgardeo.id,
    },
  });

  await prisma.comment.create({
    data: {
      requestId: req2.id,
      author: "priya.sharma",
      content:
        "Reviewed the architecture. The analytics service uses Clickhouse backend. Need to confirm SSL cert procurement timeline before approval.",
    },
  });

  const req3 = await prisma.domainRequest.create({
    data: {
      type: "MODIFY_SUBDOMAIN",
      status: "APPROVED",
      priority: "CRITICAL",
      title: "Update target IP for api.wso2.com — infrastructure migration",
      description:
        "The WSO2 API gateway is being migrated to a new cloud region. The target IP needs to be updated from 203.0.113.10 to 198.51.100.10.",
      justification:
        "Cloud infrastructure migration to AWS ap-southeast-1 region for latency improvements.",
      requestedBy: "devops-team",
      currentValue: "203.0.113.10",
      proposedValue: "198.51.100.10",
      domainId: wso2.id,
    },
  });

  await prisma.approval.create({
    data: {
      requestId: req3.id,
      approvedBy: "mike.johnson",
      status: "APPROVED",
      comment:
        "Infrastructure migration approved. Coordinate with DNS team for TTL reduction before cutover.",
    },
  });

  const req4 = await prisma.domainRequest.create({
    data: {
      type: "CREATE_SUBDOMAIN",
      status: "IMPLEMENTED",
      priority: "MEDIUM",
      title: "Add play.ballerina.io for online IDE",
      description:
        "New online playground for Ballerina developers to try code in the browser without local installation.",
      justification: "Developer experience initiative — reduce onboarding friction.",
      requestedBy: "ballerina-team",
      proposedName: "play",
      proposedEnvironment: "PRODUCTION",
      proposedPurpose: "WEB_APP",
      proposedDescription: "Browser-based Ballerina IDE",
      domainId: ballerina.id,
    },
  });

  await prisma.approval.create({
    data: {
      requestId: req4.id,
      approvedBy: "mike.johnson",
      status: "APPROVED",
      comment: "Approved. Great initiative for developer onboarding.",
    },
  });

  const req5 = await prisma.domainRequest.create({
    data: {
      type: "CREATE_DOMAIN",
      status: "PENDING",
      priority: "HIGH",
      title: "Register wso2.cloud as new SaaS platform domain",
      description:
        "WSO2 is launching a new cloud-native SaaS offering. We need the wso2.cloud domain registered and managed through this registry.",
      justification:
        "New product initiative — Q2 2026 launch. Marketing has already secured the domain externally.",
      requestedBy: "product-team",
      proposedName: "wso2.cloud",
      proposedEnvironment: "PRODUCTION",
      proposedDescription: "WSO2 cloud-native SaaS platform domain",
    },
  });

  const req6 = await prisma.domainRequest.create({
    data: {
      type: "CREATE_SUBDOMAIN",
      status: "REJECTED",
      priority: "LOW",
      title: "Add test.wso2.com for QA environment",
      description:
        "QA team requesting a public-facing test subdomain for end-to-end testing.",
      justification: "Easier external access for QA tools.",
      requestedBy: "qa-team",
      proposedName: "test",
      proposedEnvironment: "DEVELOPMENT",
      proposedPurpose: "INTERNAL",
      proposedDescription: "QA testing environment",
      domainId: wso2.id,
    },
  });

  await prisma.approval.create({
    data: {
      requestId: req6.id,
      approvedBy: "mike.johnson",
      status: "REJECTED",
      comment:
        "Rejected — use dev.wso2.com for internal testing. Public-facing test subdomains are a security risk and violate DNS policy.",
    },
  });

  // --- Audit Logs ---
  await prisma.auditLog.createMany({
    data: [
      {
        action: "DOMAIN_CREATED",
        entityType: "domain",
        entityId: wso2.id,
        performedBy: "admin",
        details: "Initial domain registration",
        domainId: wso2.id,
      },
      {
        action: "DOMAIN_CREATED",
        entityType: "domain",
        entityId: asgardeo.id,
        performedBy: "admin",
        details: "Initial domain registration",
        domainId: asgardeo.id,
      },
      {
        action: "DOMAIN_CREATED",
        entityType: "domain",
        entityId: choreo.id,
        performedBy: "admin",
        details: "Initial domain registration",
        domainId: choreo.id,
      },
      {
        action: "REQUEST_APPROVED",
        entityType: "request",
        entityId: req3.id,
        performedBy: "mike.johnson",
        details: "Approved IP migration request",
        requestId: req3.id,
      },
      {
        action: "REQUEST_IMPLEMENTED",
        entityType: "request",
        entityId: req4.id,
        performedBy: "admin",
        details: "Implemented play.ballerina.io subdomain",
        requestId: req4.id,
      },
      {
        action: "REQUEST_REJECTED",
        entityType: "request",
        entityId: req6.id,
        performedBy: "mike.johnson",
        details: "Rejected test subdomain request — policy violation",
        requestId: req6.id,
      },
      {
        action: "REQUEST_CREATED",
        entityType: "request",
        entityId: req1.id,
        performedBy: "sarah.chen",
        details: "Submitted metrics.choreo.dev request",
        requestId: req1.id,
      },
      {
        action: "REQUEST_CREATED",
        entityType: "request",
        entityId: req5.id,
        performedBy: "product-team",
        details: "Submitted wso2.cloud domain request",
        requestId: req5.id,
      },
    ],
  });

  console.log("Seed complete!");
  console.log(`  - ${await prisma.domain.count()} domains`);
  console.log(`  - ${await prisma.subdomain.count()} subdomains`);
  console.log(`  - ${await prisma.domainRequest.count()} requests`);
  console.log(`  - ${await prisma.auditLog.count()} audit log entries`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
