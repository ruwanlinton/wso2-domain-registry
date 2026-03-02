import { NextRequest } from "next/server";
import { anthropic, AGENT_TOOLS, buildSystemPrompt } from "@/lib/claude";
import { prisma } from "@/lib/db";
import { MOCK_USERS, UserRole } from "@/lib/types";
import {
  listDomains,
  listSubdomains,
  searchRegistry,
  getDomainTree,
} from "@/lib/tools/domain-tools";
import {
  getRequest,
  listRequests,
  createDomainRequest,
  createSubdomainRequest,
  modifyEntryRequest,
  deleteEntryRequest,
  approveRequest,
  rejectRequest,
} from "@/lib/tools/request-tools";

export const runtime = "nodejs";
export const maxDuration = 60;

async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  userName: string,
  userRole: UserRole
): Promise<unknown> {
  switch (toolName) {
    case "list_domains":
      return listDomains(toolInput as { environment?: string; status?: string });
    case "list_subdomains":
      return listSubdomains(
        toolInput as {
          domainId?: string;
          domainName?: string;
          environment?: string;
          status?: string;
          purpose?: string;
        }
      );
    case "search_registry":
      return searchRegistry(toolInput as { query: string });
    case "get_domain_tree":
      return getDomainTree();
    case "get_request":
      return getRequest(toolInput as { requestId: string });
    case "list_requests":
      return listRequests(
        toolInput as {
          status?: string;
          type?: string;
          requestedBy?: string;
          priority?: string;
        }
      );
    case "create_domain_request":
      return createDomainRequest(
        toolInput as {
          title: string;
          description: string;
          justification?: string;
          proposedName: string;
          proposedEnvironment: string;
          proposedDescription?: string;
          priority?: string;
        },
        userName
      );
    case "create_subdomain_request":
      return createSubdomainRequest(
        toolInput as {
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
        userName
      );
    case "modify_entry_request":
      return modifyEntryRequest(
        toolInput as {
          entityType: "domain" | "subdomain";
          entityName: string;
          title: string;
          description: string;
          justification?: string;
          currentValue: string;
          proposedValue: string;
          priority?: string;
        },
        userName
      );
    case "delete_entry_request":
      return deleteEntryRequest(
        toolInput as {
          entityType: "domain" | "subdomain";
          entityName: string;
          title: string;
          description: string;
          justification?: string;
          priority?: string;
        },
        userName
      );
    case "approve_request":
      return approveRequest(
        toolInput as { requestId: string; comment?: string },
        userName,
        userRole
      );
    case "reject_request":
      return rejectRequest(
        toolInput as { requestId: string; reason: string },
        userName,
        userRole
      );
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, userId } = body;

    const user = MOCK_USERS.find((u) => u.id === userId) || MOCK_USERS[1];
    const userRole = user.role as UserRole;

    // Fetch domain list for system prompt
    const domains = await prisma.domain.findMany({
      select: { name: true, environment: true, status: true },
      orderBy: { name: "asc" },
    });

    const systemPrompt = buildSystemPrompt(user.name, userRole, domains);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: unknown) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          let currentMessages = [...messages];

          // Agentic loop
          while (true) {
            const response = await anthropic.messages.create({
              model: "claude-sonnet-4-6",
              max_tokens: 4096,
              system: systemPrompt,
              tools: AGENT_TOOLS,
              messages: currentMessages,
            });

            // Stream the response content
            for (const block of response.content) {
              if (block.type === "text") {
                send({ type: "text", content: block.text });
              } else if (block.type === "tool_use") {
                send({
                  type: "tool_start",
                  toolName: block.name,
                  toolInput: block.input,
                  toolUseId: block.id,
                });
              }
            }

            if (response.stop_reason === "end_turn") {
              send({ type: "done" });
              break;
            }

            if (response.stop_reason === "tool_use") {
              const toolResults: Array<{
                type: "tool_result";
                tool_use_id: string;
                content: string;
              }> = [];

              for (const block of response.content) {
                if (block.type === "tool_use") {
                  const result = await executeTool(
                    block.name,
                    block.input as Record<string, unknown>,
                    user.email.split("@")[0],
                    userRole
                  );

                  send({
                    type: "tool_result",
                    toolName: block.name,
                    toolUseId: block.id,
                    result,
                  });

                  toolResults.push({
                    type: "tool_result",
                    tool_use_id: block.id,
                    content: JSON.stringify(result),
                  });
                }
              }

              // Add assistant message + tool results to conversation
              currentMessages = [
                ...currentMessages,
                { role: "assistant", content: response.content },
                { role: "user", content: toolResults },
              ];
            } else {
              send({ type: "done" });
              break;
            }
          }
        } catch (error) {
          console.error("Agent loop error:", error);
          send({
            type: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("POST /api/agent error:", error);
    return new Response(JSON.stringify({ error: "Failed to start agent" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
