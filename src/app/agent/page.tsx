import { Header } from "@/components/layout/Header";
import { AgentChat } from "@/components/agent/AgentChat";

export default function AgentPage() {
  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="AI Assistant"
        subtitle="Natural language interface powered by Claude"
      />
      <div className="flex-1 p-6 overflow-hidden">
        <AgentChat />
      </div>
    </div>
  );
}
