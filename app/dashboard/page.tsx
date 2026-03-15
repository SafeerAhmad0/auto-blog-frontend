"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "../components/AppNav";
import { getDashboard, deleteAgent, DashboardData } from "../lib/api";
import { supabase } from "../lib/supabase";

function BarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const W = 600, H = 80, BAR = W / data.length - 2;
  const labels = data.filter((_, i) => i % 5 === 0 || i === data.length - 1);
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full" style={{ minWidth: 320 }}>
        {data.map((d, i) => {
          const barH = Math.max((d.count / max) * H, d.count > 0 ? 4 : 1);
          const x = i * (W / data.length) + 1;
          const y = H - barH;
          return (
            <g key={d.date}>
              <rect x={x} y={y} width={BAR} height={barH}
                fill={d.count > 0 ? "#2563eb" : "#e2e8f0"} rx={2} />
              {d.count > 0 && <title>{d.date}: {d.count} blog{d.count !== 1 ? "s" : ""}</title>}
            </g>
          );
        })}
        {labels.map((d, i) => {
          const idx = data.indexOf(d);
          const x = idx * (W / data.length) + BAR / 2;
          return <text key={i} x={x} y={H + 14} textAnchor="middle" fontSize={8} fill="#94a3b8">{d.date.slice(5)}</text>;
        })}
      </svg>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl px-5 py-4 border ${accent ? "bg-blue-600 border-blue-600" : "bg-white border-gray-100"}`}>
      <p className={`text-xs uppercase tracking-wide mb-1 ${accent ? "text-blue-200" : "text-gray-400"}`}>{label}</p>
      <p className={`text-2xl font-bold ${accent ? "text-white" : "text-black"}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${accent ? "text-blue-200" : "text-gray-400"}`}>{sub}</p>}
    </div>
  );
}

const SCENARIO_LABEL: Record<string, string> = {
  themed: "Themed", website: "Website", ecommerce: "E-commerce",
  news: "News", tutorial: "Tutorial", personal_brand: "Personal Brand",
  seo_blitz: "SEO Blitz", affiliate: "Affiliate",
};

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: s }) => {
      const user = s.session?.user;
      if (!user) { router.push("/register"); return; }
      setUserId(user.id);
      setUserName(user.user_metadata?.name ?? user.email ?? "");
      try {
        const d = await getDashboard(user.id);
        setData(d);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  async function handleDelete(agentId: string, agentName: string) {
    if (!confirm(`Delete "${agentName}"? This cannot be undone.`)) return;
    setDeletingId(agentId);
    try {
      await deleteAgent(userId, agentId);
      setData((prev) => prev ? {
        ...prev,
        agents: prev.agents.filter((a) => a.id !== agentId),
        stats: { ...prev.stats, agent_count: prev.stats.agent_count - 1, agents_remaining: prev.stats.agents_remaining + 1 },
      } : prev);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  function copyEndpoint(agentId: string) {
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/${userId}/${agentId}/blog/today`;
    navigator.clipboard.writeText(url);
    setCopiedId(agentId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const first = userName.split(" ")[0] || userName;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayFormatted = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <div className="max-w-5xl mx-auto px-5 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-black">
              {first ? `Good morning, ${first}` : "Dashboard"}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{todayFormatted}</p>
          </div>
          {data?.stats.can_create_agent && (
            <Link href="/create"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              + New agent
            </Link>
          )}
        </div>

        {loading ? (
          <div className="py-32 text-center">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-red-500">{error}</div>
        ) : data && (
          <div className="space-y-5">

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Agents" value={`${data.stats.agent_count} / ${data.stats.agent_limit}`} sub={`${data.stats.agents_remaining} remaining`} />
              <StatCard label="Blogs generated" value={data.stats.total_blogs_generated} accent />
              <StatCard label="Posts scheduled" value={data.stats.total_posts_scheduled} />
              <StatCard label="Published today" value={data.recent_blogs.filter(b => b.scheduled_date === todayStr).length} sub="today" />
            </div>

            {/* Chart + Upcoming side by side */}
            <div className="grid md:grid-cols-3 gap-5">
              <div className="md:col-span-2 bg-white border border-gray-100 rounded-xl px-5 py-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-black">Blogs generated</p>
                  <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
                    {data.chart_data.reduce((s, d) => s + d.count, 0)} in 30 days
                  </span>
                </div>
                <BarChart data={data.chart_data} />
              </div>

              <div className="bg-white border border-gray-100 rounded-xl px-5 py-5">
                <p className="text-sm font-semibold text-black mb-4">Coming up</p>
                {data.upcoming_posts.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">No upcoming posts</p>
                ) : (
                  <div className="space-y-3">
                    {data.upcoming_posts.map((post) => (
                      <div key={post.id} className="flex items-start gap-3">
                        <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${post.scheduled_date === todayStr ? "bg-blue-600" : "bg-gray-200"}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-black line-clamp-1 leading-snug">{post.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{post.scheduled_date === todayStr ? "Today" : post.scheduled_date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent blogs */}
            {data.recent_blogs.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-xl px-5 py-5">
                <p className="text-sm font-semibold text-black mb-4">Recent blogs</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {data.recent_blogs.map((blog) => (
                    <div key={blog.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-black line-clamp-1">{blog.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{blog.scheduled_date} · {blog.reading_time_minutes} min read</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agents */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <p className="text-sm font-semibold text-black">Your agents</p>
                <Link href="/agents" className="text-xs text-blue-600 hover:underline">View all</Link>
              </div>

              {data.agents.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-gray-400 mb-4">No agents yet</p>
                  <Link href="/create" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Create your first agent
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.agents.map((agent) => (
                    <div key={agent.id} className="px-5 py-4 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold text-black">{agent.name}</span>
                            <span className="text-[10px] font-medium uppercase tracking-wide text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                              {SCENARIO_LABEL[agent.scenario] ?? agent.scenario}
                            </span>
                            <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full ${
                              agent.status === "active" ? "text-green-600 bg-green-50 border border-green-100" : "text-gray-400 bg-gray-50 border border-gray-100"
                            }`}>{agent.status}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{agent.frequency.replace(/-/g, " ")}</span>
                            <span>·</span>
                            <span>{agent.duration_months}mo</span>
                            <span>·</span>
                            <span>{agent.blogs_generated} blog{agent.blogs_generated !== 1 ? "s" : ""}</span>
                          </div>
                          <button onClick={() => copyEndpoint(agent.id)}
                            className="mt-1 text-[10px] font-mono text-gray-300 hover:text-blue-500 transition-colors">
                            {copiedId === agent.id ? "Copied!" : `GET /api/${userId.slice(0,8)}.../${agent.id.slice(0,8)}.../blog/today`}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link href={`/plan/${userId}/${agent.id}`}
                            className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:border-gray-300 transition-colors">
                            Schedule
                          </Link>
                          <Link href={`/blog/${userId}/${agent.id}`}
                            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                            Today
                          </Link>
                          <button onClick={() => handleDelete(agent.id, agent.name)} disabled={deletingId === agent.id}
                            className="text-xs text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40 px-1 opacity-0 group-hover:opacity-100">
                            {deletingId === agent.id ? "..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}



