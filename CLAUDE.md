# WSO2 Domain Registry

A Next.js 14 full-stack app for governed domain and subdomain management within WSO2, with an AI-powered assistant using Claude.

## Tech Stack

- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **Database:** PostgreSQL (Neon) + postgres.js (direct SQL, no ORM)
- **Styling:** Tailwind CSS (custom WSO2 orange theme: `#FF7300`)
- **AI:** Anthropic Claude API (`claude-sonnet-4-6`)
- **Icons:** Lucide React

## Development Commands

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # Run linter
```

## Environment Variables

Required in `.env.local`:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME"
ANTHROPIC_API_KEY="sk-ant-..."
NEXT_PUBLIC_APP_NAME="WSO2 Domain Registry"
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with Sidebar
│   ├── page.tsx                # Dashboard
│   ├── domains/page.tsx        # Domain registry (tree/table view)
│   ├── requests/page.tsx       # Request list
│   ├── requests/[id]/page.tsx  # Request detail + timeline
│   ├── approvals/page.tsx      # Approval queue (role-gated)
│   ├── agent/page.tsx          # AI assistant chat
│   └── api/
│       ├── agent/route.ts      # SSE streaming AI endpoint
│       ├── domains/            # Domain CRUD
│       ├── subdomains/         # Subdomain CRUD
│       └── requests/           # Request workflow + approve/reject
├── components/
│   ├── layout/                 # Sidebar, Header, UserSwitcher
│   ├── agent/                  # AgentChat, ChatMessage, ToolCallCard
│   ├── domains/                # DomainTree, DomainTable
│   ├── requests/               # RequestCard, RequestForm, RequestTimeline, StatusBadge
│   └── ui/                     # Badge, Button, Card
└── lib/
    ├── db.ts                   # postgres.js connection (export default sql)
    ├── types.ts                # UserRole, MOCK_USERS, ROLE_PERMISSIONS
    ├── claude.ts               # Anthropic client, AGENT_TOOLS, buildSystemPrompt()
    ├── badge-variants.ts       # statusVariant(), envVariant(), priorityVariant()
    └── tools/
        ├── domain-tools.ts     # listDomains, listSubdomains, searchRegistry, getDomainTree
        └── request-tools.ts    # createDomainRequest, approveRequest, rejectRequest, etc.
```

## Database Tables

6 tables: `Domain` → `Subdomain`, `DomainRequest` → `Approval`, `Comment`, `AuditLog`

Table names are quoted (e.g. `"Domain"`) because they were created with uppercase names.
IDs are generated with `crypto.randomUUID()`. Every write operation creates an `AuditLog` entry.

## SQL Patterns (postgres.js)

```ts
import sql from "@/lib/db";

// Query
const rows = await sql`SELECT * FROM "Domain" WHERE status = ${status}`;

// Conditional fragment
const filter = env ? sql`AND environment = ${env}` : sql``;
const rows = await sql`SELECT * FROM "Domain" WHERE TRUE ${filter}`;

// Insert
const [row] = await sql`INSERT INTO "Domain" ${sql(data)} RETURNING *`;

// Update
const [row] = await sql`UPDATE "Domain" SET ${sql(data)} WHERE id = ${id} RETURNING *`;
```

## User Roles & Permissions

Defined in `src/lib/types.ts`. 5 roles:

| Role | Submit | Approve | Implement | Admin |
|------|--------|---------|-----------|-------|
| VIEWER | ✗ | ✗ | ✗ | ✗ |
| DEVELOPER | ✓ | ✗ | ✗ | ✗ |
| DOMAIN_OWNER | ✓ | ✗ | ✗ | ✗ |
| APPROVER | ✓ | ✓ | ✗ | ✗ |
| ADMIN | ✓ | ✓ | ✓ | ✓ |

Mock users are stored in `MOCK_USERS` (no real auth). Current user is persisted in `localStorage` under key `wso2-domain-registry-user` and switched via `UserSwitcher` component (dispatches `userchange` event).

## AI Agent

- **Endpoint:** `POST /api/agent` — streams SSE responses
- **Tools:** 12 tools defined in `src/lib/claude.ts` (6 read, 6 write)
- **System prompt:** Built dynamically with user role + domain list context via `buildSystemPrompt()`
- Role-gated tools (approve/reject) check permissions server-side in `request-tools.ts`

## Request Lifecycle

`PENDING` → `UNDER_REVIEW` → `APPROVED` / `REJECTED` → `IMPLEMENTED` / `CANCELLED`

## Patterns & Conventions

- All pages and interactive components use `"use client"`
- API routes return consistent JSON error responses with appropriate HTTP status codes
- `sql` client imported from `@/lib/db` (default export)
- Path alias `@/*` maps to `src/*`
- All components use Tailwind for styling — no CSS modules

## Deployment

- **Production:** Choreo (see `.choreo/component.yaml`)
- Dockerfile: `CMD ["npm", "start"]` — no migration step needed (tables exist in Neon DB)
