"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "../../../components/AppNav";
import { getAgent, deleteAgent, getGeneratedBlogs, Agent, ScheduleEntry, BlogSummary } from "../../../lib/api";
import { supabase } from "../../../lib/supabase";

type Tab = "schedule" | "generated";

export default function AgentPage() {
  const { userId, agentId } = useParams<{ userId: string; agentId: string }>();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [generatedBlogs, setGeneratedBlogs] = useState<BlogSummary[]>([]);
  const [published, setPublished] = useState(0);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState<Tab>("schedule");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push("/register"); return; }
      Promise.all([
        getAgent(userId, agentId),
        getGeneratedBlogs(userId, agentId),
      ]).then(([agentRes, blogsRes]) => {
        setAgent(agentRes.agent);
        setSchedule(agentRes.schedule);
        setPublished(agentRes.published);
        setPending(agentRes.pending);
        setGeneratedBlogs(blogsRes.blogs);
      }).catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    });
  }, [userId, agentId, router]);

  function copyEndpoint() {
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/${userId}/${agentId}/blog/today`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    if (!confirm(`Delete agent "${agent?.name}"? All schedule and blog data will be removed.`)) return;
    setDeleting(true);
    try {
      await deleteAgent(userId, agentId);
      router.push("/dashboard");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-white"><AppNav />
      <div className="max-w-4xl mx-auto px-4 py-12 text-sm text-zinc-400">Loading agent...</div>
    </div>
  );

  if (error || !agent) return (
    <div className="min-h-screen bg-white"><AppNav />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/dashboard" className="text-xs text-zinc-400 hover:text-zinc-600 mb-4 inline-block">&larr; Dashboard</Link>
        <p className="text-sm text-red-400">{error || "Agent not found"}</p>
      </div>
    </div>
  );

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-white">
      <AppNav />
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <Link href="/dashboard" className="text-xs text-zinc-400 hover:text-zinc-600 mb-2 inline-block">
              &larr; Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-zinc-900">{agent.name}</h1>
            <p className="text-sm text-zinc-500 mt-1 capitalize">
              {agent.scenario.replace(/_/g, " ")} &middot; {agent.frequency} &middot; {agent.duration_months} month{agent.duration_months !== 1 ? "s" : ""}
              {agent.audience && <> &middot; {agent.audience}</>}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/blog/${userId}/${agentId}`}
              className="text-sm border border-zinc-200 text-zinc-700 px-3 py-2 rounded-md hover:bg-zinc-50 transition-colors">
              Today&apos;s blog
            </Link>
            <button onClick={handleDelete} disabled={deleting}
              className="text-sm text-red-400 hover:text-red-600 transition-colors disabled:opacity-50">
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="border border-zinc-200 rounded-lg p-4">
            <p className="text-xs text-zinc-400">Scheduled</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{schedule.length}</p>
          </div>
          <div className="border border-zinc-200 rounded-lg p-4">
            <p className="text-xs text-zinc-400">Generated</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{generatedBlogs.length}</p>
          </div>
          <div className="border border-zinc-200 rounded-lg p-4">
            <p className="text-xs text-zinc-400">Published</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{published}</p>
          </div>
          <div className="border border-zinc-200 rounded-lg p-4">
            <p className="text-xs text-zinc-400">Pending</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{pending}</p>
          </div>
        </div>

        {/* API Endpoint */}
        <div className="border border-zinc-200 rounded-lg p-4 mb-8">
          <p className="text-xs text-zinc-400 mb-2">Daily endpoint — embed this in your project</p>
          <div className="flex items-center justify-between gap-3">
            <code className="text-xs text-zinc-700 font-mono truncate">
              GET /api/{userId}/{agentId}/blog/today
            </code>
            <button onClick={copyEndpoint}
              className="text-xs border border-zinc-200 text-zinc-600 px-3 py-1.5 rounded hover:bg-zinc-50 transition-colors shrink-0">
              {copied ? "Copied" : "Copy URL"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-zinc-200 mb-6">
          <button
            onClick={() => setTab("schedule")}
            className={`text-sm px-4 py-2 border-b-2 transition-colors ${tab === "schedule" ? "border-zinc-900 text-zinc-900 font-medium" : "border-transparent text-zinc-400 hover:text-zinc-600"}`}>
            Schedule ({schedule.length})
          </button>
          <button
            onClick={() => setTab("generated")}
            className={`text-sm px-4 py-2 border-b-2 transition-colors ${tab === "generated" ? "border-zinc-900 text-zinc-900 font-medium" : "border-transparent text-zinc-400 hover:text-zinc-600"}`}>
            Generated blogs ({generatedBlogs.length})
          </button>
        </div>

        {/* Schedule tab */}
        {tab === "schedule" && (
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden sm:table-cell">Words</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {schedule.map((entry) => {
                  const isToday = entry.scheduled_date === today;
                  const isPast = entry.scheduled_date < today;
                  return (
                    <tr key={entry.id} className={isToday ? "bg-zinc-50" : ""}>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        <span className={isPast && !isToday ? "text-zinc-400" : "text-zinc-600"}>
                          {entry.scheduled_date}
                        </span>
                        {isToday && <span className="ml-2 text-xs bg-zinc-900 text-white px-1.5 py-0.5 rounded">Today</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-700 max-w-xs">
                        <span className="line-clamp-1">{entry.title}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400 hidden sm:table-cell">{entry.word_count}w</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          entry.status === "published" ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-500"
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Generated blogs tab */}
        {tab === "generated" && (
          generatedBlogs.length === 0 ? (
            <div className="border border-dashed border-zinc-200 rounded-lg py-16 text-center">
              <p className="text-sm text-zinc-400">No blogs generated yet</p>
              <p className="text-xs text-zinc-300 mt-1">Call the daily endpoint to generate your first post</p>
              <Link href={`/blog/${userId}/${agentId}`}
                className="mt-4 inline-block text-sm bg-zinc-900 text-white px-4 py-2 rounded-md hover:bg-zinc-700 transition-colors">
                Generate today&apos;s blog
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {generatedBlogs.map((blog) => (
                <div key={blog.id} className="border border-zinc-200 rounded-lg p-4 hover:border-zinc-300 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-zinc-400 mb-1">{blog.scheduled_date} &middot; {blog.reading_time_minutes} min read</p>
                      <p className="text-sm font-semibold text-zinc-900">{blog.title}</p>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{blog.meta_description}</p>
                      {blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {blog.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="text-xs bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/blog/${userId}/${agentId}?date=${blog.scheduled_date}`}
                      className="text-xs border border-zinc-200 text-zinc-600 px-3 py-1.5 rounded hover:bg-zinc-50 transition-colors shrink-0">
                      Read
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

      </div>
    </div>
  );
}
