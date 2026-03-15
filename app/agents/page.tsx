"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "../components/AppNav";
import { listAgents, deleteAgent, Agent } from "../lib/api";
import { supabase } from "../lib/supabase";

const SCENARIO_LABELS: Record<string, string> = {
  themed: "Themed", website: "Website", ecommerce: "E-commerce",
  news: "News & Trends", tutorial: "Tutorials", personal_brand: "Personal Brand",
  seo_blitz: "SEO Blitz", affiliate: "Affiliate",
};

function AgentCard({
  agent, userId, onDelete,
}: {
  agent: Agent & { blogs_generated?: number };
  userId: string;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [copied, setCopied] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const endpoint = `${API}/api/${userId}/${agent.id}/blog/today`;

  async function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return; }
    setDeleting(true);
    try {
      await deleteAgent(userId, agent.id);
      onDelete(agent.id);
    } catch {
      setDeleting(false);
    }
  }

  function copyEndpoint() {
    navigator.clipboard.writeText(endpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border border-gray-100 rounded-xl p-5 bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-black truncate">{agent.name}</h3>
            <span className="text-[10px] font-medium uppercase tracking-wide text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
              {SCENARIO_LABELS[agent.scenario] ?? agent.scenario}
            </span>
            <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full ${
              agent.status === "active"
                ? "text-green-600 bg-green-50 border border-green-100"
                : "text-gray-400 bg-gray-50 border border-gray-100"
            }`}>
              {agent.status}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {agent.frequency?.replace(/-/g, " ")} · {agent.duration_months}mo · {agent.tone} · {agent.language}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Blogs", value: agent.blogs_generated ?? 0 },
          { label: "Tone", value: agent.tone },
          { label: "Length", value: agent.content_length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-semibold text-black mt-0.5 capitalize">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 min-w-0 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 flex items-center gap-2">
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded font-mono shrink-0">GET</span>
          <span className="text-xs text-gray-500 font-mono truncate">{endpoint}</span>
        </div>
        <button onClick={copyEndpoint}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${
            copied ? "bg-green-50 border-green-200 text-green-600" : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-black"
          }`}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Link href={`/plan/${userId}/${agent.id}`}
          className="flex-1 text-center text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-black transition-colors">
          Schedule
        </Link>
        <Link href={`/blog/${userId}/${agent.id}`}
          className="flex-1 text-center text-xs font-medium px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          Today's blog
        </Link>
        <button onClick={handleDelete} disabled={deleting}
          className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
            confirmDel
              ? "border-red-300 text-red-500 bg-red-50 hover:bg-red-100"
              : "border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500"
          }`}>
          {deleting ? "..." : confirmDel ? "Sure?" : "Delete"}
        </button>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [agents, setAgents] = useState<(Agent & { blogs_generated?: number })[]>([]);
  const [agentCount, setAgentCount] = useState(0);
  const [agentLimit, setAgentLimit] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) { router.push("/register"); return; }
      setUserId(user.id);
      try {
        const res = await listAgents(user.id);
        setAgents(res.agents ?? []);
        setAgentCount(res.agent_count ?? 0);
        setAgentLimit(res.agent_limit ?? 3);
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  function removeAgent(id: string) {
    setAgents((prev) => prev.filter((a) => a.id !== id));
    setAgentCount((c) => c - 1);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />
      <div className="max-w-5xl mx-auto px-5 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-black">Agents</h1>
            <p className="text-sm text-gray-400 mt-1">{agentCount} of {agentLimit} agents used</p>
          </div>
          {agentCount < agentLimit && (
            <Link href="/create"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              + New agent
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-24">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-24 bg-white border border-gray-100 rounded-2xl">
            <p className="text-sm font-medium text-black mb-1">No agents yet</p>
            <p className="text-xs text-gray-400 mb-5">Create your first blog agent to get started.</p>
            <Link href="/create"
              className="inline-block text-sm font-medium px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              Create agent
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>Agent usage</span>
                <span>{agentCount} / {agentLimit}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${(agentCount / agentLimit) * 100}%` }} />
              </div>
              {agentCount >= agentLimit && (
                <p className="text-xs text-red-500 mt-2">Agent limit reached. Delete an agent to create a new one.</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} userId={userId} onDelete={removeAgent} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
