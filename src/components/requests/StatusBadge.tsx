import { Badge, statusVariant, priorityVariant } from "@/components/ui/Badge";

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusVariant(status)}>{status.replace(/_/g, " ")}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge variant={priorityVariant(priority)}>{priority}</Badge>;
}

export function RequestTypeBadge({ type }: { type: string }) {
  const label = type.replace(/_/g, " ");
  return <Badge variant="info">{label}</Badge>;
}
