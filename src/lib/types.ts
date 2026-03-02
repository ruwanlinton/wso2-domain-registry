export type UserRole = "VIEWER" | "DEVELOPER" | "DOMAIN_OWNER" | "APPROVER" | "ADMIN";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: "viewer-1",
    name: "Alex Reader",
    email: "alex.reader@wso2.com",
    role: "VIEWER",
    avatar: "AR",
  },
  {
    id: "dev-1",
    name: "Sarah Chen",
    email: "sarah.chen@wso2.com",
    role: "DEVELOPER",
    avatar: "SC",
  },
  {
    id: "owner-1",
    name: "James Wilson",
    email: "james.wilson@wso2.com",
    role: "DOMAIN_OWNER",
    avatar: "JW",
  },
  {
    id: "approver-1",
    name: "Mike Johnson",
    email: "mike.johnson@wso2.com",
    role: "APPROVER",
    avatar: "MJ",
  },
  {
    id: "admin-1",
    name: "Priya Sharma",
    email: "priya.sharma@wso2.com",
    role: "ADMIN",
    avatar: "PS",
  },
];

export const ROLE_PERMISSIONS: Record<
  UserRole,
  {
    canSubmitRequests: boolean;
    canApprove: boolean;
    canImplement: boolean;
    canManageAll: boolean;
    label: string;
    color: string;
  }
> = {
  VIEWER: {
    canSubmitRequests: false,
    canApprove: false,
    canImplement: false,
    canManageAll: false,
    label: "Viewer",
    color: "gray",
  },
  DEVELOPER: {
    canSubmitRequests: true,
    canApprove: false,
    canImplement: false,
    canManageAll: false,
    label: "Developer",
    color: "blue",
  },
  DOMAIN_OWNER: {
    canSubmitRequests: true,
    canApprove: false,
    canImplement: false,
    canManageAll: false,
    label: "Domain Owner",
    color: "purple",
  },
  APPROVER: {
    canSubmitRequests: true,
    canApprove: true,
    canImplement: false,
    canManageAll: false,
    label: "Approver",
    color: "orange",
  },
  ADMIN: {
    canSubmitRequests: true,
    canApprove: true,
    canImplement: true,
    canManageAll: true,
    label: "Admin",
    color: "red",
  },
};
