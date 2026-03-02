export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "purple"
  | "orange"
  | "gray";

export function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "PENDING":
      return "warning";
    case "UNDER_REVIEW":
      return "info";
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "error";
    case "IMPLEMENTED":
      return "purple";
    case "CANCELLED":
      return "gray";
    case "INACTIVE":
      return "gray";
    case "DEPRECATED":
      return "error";
    default:
      return "default";
  }
}

export function envVariant(env: string): BadgeVariant {
  switch (env) {
    case "PRODUCTION":
      return "success";
    case "STAGING":
      return "warning";
    case "DEVELOPMENT":
      return "info";
    default:
      return "default";
  }
}

export function priorityVariant(priority: string): BadgeVariant {
  switch (priority) {
    case "CRITICAL":
      return "error";
    case "HIGH":
      return "orange";
    case "MEDIUM":
      return "info";
    case "LOW":
      return "gray";
    default:
      return "default";
  }
}
