import Anthropic from "@anthropic-ai/sdk";
import { UserRole } from "./types";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: "list_domains",
    description:
      "List all domains in the registry with optional filtering by environment or status.",
    input_schema: {
      type: "object",
      properties: {
        environment: {
          type: "string",
          enum: ["PRODUCTION", "STAGING", "DEVELOPMENT", "ALL"],
          description: "Filter by environment",
        },
        status: {
          type: "string",
          enum: ["ACTIVE", "INACTIVE", "DEPRECATED", "PENDING"],
          description: "Filter by domain status",
        },
      },
    },
  },
  {
    name: "list_subdomains",
    description:
      "List subdomains, optionally filtered by parent domain name, environment, status, or purpose.",
    input_schema: {
      type: "object",
      properties: {
        domainName: {
          type: "string",
          description: "Filter by parent domain name (e.g. 'wso2.com')",
        },
        environment: {
          type: "string",
          enum: ["PRODUCTION", "STAGING", "DEVELOPMENT", "ALL"],
          description: "Filter by environment",
        },
        status: {
          type: "string",
          enum: ["ACTIVE", "INACTIVE", "DEPRECATED", "PENDING"],
          description: "Filter by status",
        },
        purpose: {
          type: "string",
          enum: [
            "API",
            "WEB_APP",
            "INTERNAL",
            "DOCS",
            "CDN",
            "MAIL",
            "MONITORING",
            "ANALYTICS",
            "OTHER",
          ],
          description: "Filter by subdomain purpose",
        },
      },
    },
  },
  {
    name: "search_registry",
    description:
      "Full-text search across all domains and subdomains by name, description, owner, team, or IP.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query string",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_domain_tree",
    description:
      "Get a hierarchical JSON tree of all domains and their subdomains. Useful for overview queries.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_request",
    description: "Get the full details and timeline of a specific domain request by ID.",
    input_schema: {
      type: "object",
      properties: {
        requestId: {
          type: "string",
          description: "The unique ID of the request",
        },
      },
      required: ["requestId"],
    },
  },
  {
    name: "list_requests",
    description:
      "List domain requests with optional filters for status, type, requester, or priority.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: [
            "PENDING",
            "UNDER_REVIEW",
            "APPROVED",
            "REJECTED",
            "IMPLEMENTED",
            "CANCELLED",
          ],
          description: "Filter by request status",
        },
        type: {
          type: "string",
          enum: [
            "CREATE_DOMAIN",
            "CREATE_SUBDOMAIN",
            "MODIFY_DOMAIN",
            "MODIFY_SUBDOMAIN",
            "DELETE_DOMAIN",
            "DELETE_SUBDOMAIN",
          ],
          description: "Filter by request type",
        },
        requestedBy: {
          type: "string",
          description: "Filter by requester username",
        },
        priority: {
          type: "string",
          enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
          description: "Filter by priority",
        },
      },
    },
  },
  {
    name: "create_domain_request",
    description:
      "Submit a request to register a new top-level domain in the registry.",
    input_schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Short descriptive title for the request",
        },
        description: {
          type: "string",
          description: "Detailed description of the domain and its intended use",
        },
        justification: {
          type: "string",
          description: "Business justification for why this domain is needed",
        },
        proposedName: {
          type: "string",
          description: "The proposed domain name (e.g. 'example.com')",
        },
        proposedEnvironment: {
          type: "string",
          enum: ["PRODUCTION", "STAGING", "DEVELOPMENT", "ALL"],
          description: "The target environment for this domain",
        },
        proposedDescription: {
          type: "string",
          description: "Description for the new domain entry",
        },
        priority: {
          type: "string",
          enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
          description: "Request priority (default: MEDIUM)",
        },
      },
      required: ["title", "description", "proposedName", "proposedEnvironment"],
    },
  },
  {
    name: "create_subdomain_request",
    description:
      "Submit a request to create a new subdomain under an existing domain.",
    input_schema: {
      type: "object",
      properties: {
        domainName: {
          type: "string",
          description: "The parent domain name (e.g. 'choreo.dev')",
        },
        title: {
          type: "string",
          description: "Short descriptive title for the request",
        },
        description: {
          type: "string",
          description: "Detailed description of the subdomain and its use",
        },
        justification: {
          type: "string",
          description: "Business justification",
        },
        proposedName: {
          type: "string",
          description: "The subdomain prefix (e.g. 'staging-api')",
        },
        proposedPurpose: {
          type: "string",
          enum: [
            "API",
            "WEB_APP",
            "INTERNAL",
            "DOCS",
            "CDN",
            "MAIL",
            "MONITORING",
            "ANALYTICS",
            "OTHER",
          ],
          description: "The purpose/type of this subdomain",
        },
        proposedEnvironment: {
          type: "string",
          enum: ["PRODUCTION", "STAGING", "DEVELOPMENT", "ALL"],
          description: "The target environment (defaults to parent domain environment)",
        },
        proposedDescription: {
          type: "string",
          description: "Description for the subdomain entry",
        },
        priority: {
          type: "string",
          enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
          description: "Request priority (default: MEDIUM)",
        },
      },
      required: ["domainName", "title", "description", "proposedName", "proposedPurpose"],
    },
  },
  {
    name: "modify_entry_request",
    description:
      "Submit a request to modify an existing domain or subdomain (e.g. update IP, description, status).",
    input_schema: {
      type: "object",
      properties: {
        entityType: {
          type: "string",
          enum: ["domain", "subdomain"],
          description: "Whether modifying a domain or subdomain",
        },
        entityName: {
          type: "string",
          description: "The name of the domain or full subdomain to modify",
        },
        title: {
          type: "string",
          description: "Short descriptive title for the request",
        },
        description: {
          type: "string",
          description: "What change is being requested and why",
        },
        justification: {
          type: "string",
          description: "Business justification",
        },
        currentValue: {
          type: "string",
          description: "The current value of the field being changed",
        },
        proposedValue: {
          type: "string",
          description: "The proposed new value",
        },
        priority: {
          type: "string",
          enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
          description: "Request priority",
        },
      },
      required: [
        "entityType",
        "entityName",
        "title",
        "description",
        "currentValue",
        "proposedValue",
      ],
    },
  },
  {
    name: "delete_entry_request",
    description:
      "Submit a request to delete a domain or subdomain from the registry.",
    input_schema: {
      type: "object",
      properties: {
        entityType: {
          type: "string",
          enum: ["domain", "subdomain"],
          description: "Whether deleting a domain or subdomain",
        },
        entityName: {
          type: "string",
          description: "The domain name or full subdomain to delete",
        },
        title: {
          type: "string",
          description: "Short descriptive title for the deletion request",
        },
        description: {
          type: "string",
          description: "Reason for deletion",
        },
        justification: {
          type: "string",
          description: "Business justification",
        },
        priority: {
          type: "string",
          enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
          description: "Request priority",
        },
      },
      required: ["entityType", "entityName", "title", "description"],
    },
  },
  {
    name: "approve_request",
    description:
      "Approve a pending domain request. Only available to Approver and Admin roles.",
    input_schema: {
      type: "object",
      properties: {
        requestId: {
          type: "string",
          description: "The ID of the request to approve",
        },
        comment: {
          type: "string",
          description: "Optional approval comment or notes",
        },
      },
      required: ["requestId"],
    },
  },
  {
    name: "reject_request",
    description:
      "Reject a pending domain request with a reason. Only available to Approver and Admin roles.",
    input_schema: {
      type: "object",
      properties: {
        requestId: {
          type: "string",
          description: "The ID of the request to reject",
        },
        reason: {
          type: "string",
          description: "The reason for rejection (required)",
        },
      },
      required: ["requestId", "reason"],
    },
  },
];

export function buildSystemPrompt(
  userName: string,
  userRole: UserRole,
  domains: Array<{ name: string; environment: string; status: string }>
): string {
  const domainList = domains
    .map((d) => `  - ${d.name} (${d.environment}, ${d.status})`)
    .join("\n");

  const permissions = {
    VIEWER: "Read-only access. Cannot submit requests or approve anything.",
    DEVELOPER:
      "Can browse the registry and submit domain/subdomain requests. Cannot approve.",
    DOMAIN_OWNER:
      "Can browse, submit requests for their domains. Cannot approve.",
    APPROVER:
      "Can browse, submit requests, AND approve or reject pending requests.",
    ADMIN: "Full access — can browse, submit, approve/reject, and implement requests.",
  };

  return `You are the WSO2 Domain Registry Assistant — an intelligent agent that helps WSO2 engineers manage the organization's domain and subdomain namespace.

## Current User
- Name: ${userName}
- Role: ${userRole}
- Permissions: ${permissions[userRole]}

## Today's Date
${new Date().toISOString().split("T")[0]}

## Registered Domains (summary)
${domainList}

## Your Capabilities
You have access to 12 tools to query the registry, submit requests, and manage approvals. Always use tools to fetch live data rather than making assumptions.

## Behavior Guidelines
- When asked about domains or subdomains, always call the appropriate tool to get current data.
- When submitting requests on behalf of the user, confirm the key details in your response.
- Enforce role permissions: if the user's role doesn't allow an action, explain why and what role is needed.
- For CREATE requests, remind the user the request must be approved before implementation.
- Be concise but thorough. Format responses with markdown when showing lists or tables.
- If a tool returns an error, explain it clearly and suggest alternatives.
- When showing domain/subdomain lists, format them as organized tables or grouped lists.
- Always cite request IDs when creating or referencing requests.`;
}
