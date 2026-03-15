"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AppNav from "../../../components/AppNav";
import BlogContent from "../../../components/BlogContent";
import { getTodaysBlog, Blog } from "../../../lib/api";
import { supabase } from "../../../lib/supabase";

export default function BlogPage() {
  const { userId, agentId } = useParams<{ userId: string; agentId: string }>();
  const searchParams = useSearchParams();
  const targetDate = searchParams.get("date") ?? undefined;
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push("/register"); return; }
      getTodaysBlog(userId, agentId, targetDate)
        .then((b) => setBlog(b))
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    });
  }, [userId, agentId, targetDate, router]);

  if (loading) return (
    <div className="min-h-screen bg-white"><AppNav />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="py-20 text-center">
          <p className="text-sm text-zinc-400">Generating blog post...</p>
          <p className="text-xs text-zinc-300 mt-2">This may take up to 30 seconds</p>
        </div>
      </div>
    </div>
  );

  if (error || !blog) return (
    <div className="min-h-screen bg-white"><AppNav />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/dashboard" className="text-xs text-zinc-400 hover:text-zinc-600 mb-6 inline-block">&larr; Back to dashboard</Link>
        <p className="text-sm text-red-400">{error || "No blog found for this date."}</p>
        <p className="text-xs text-zinc-400 mt-2">This agent may not have a post scheduled for today.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <AppNav />
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Nav */}
        <div className="flex items-center justify-between gap-4 mb-10">
          <Link href="/dashboard" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
            &larr; Back to dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Link href={`/plan/${userId}/${agentId}`} className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
              View schedule
            </Link>
            <span className="text-xs text-zinc-300">·</span>
            <span className="text-xs text-zinc-400">{blog.scheduled_date}</span>
          </div>
        </div>

        {/* Article */}
        <article>
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 leading-snug">{blog.title}</h1>
            <p className="mt-3 text-base text-zinc-500 leading-relaxed">{blog.meta_description}</p>
            <div className="flex items-center flex-wrap gap-3 mt-5 pt-5 border-t border-zinc-100">
              <span className="text-xs text-zinc-400">{blog.reading_time_minutes} min read</span>
              {blog.tags.map((tag) => (
                <span key={tag} className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded">{tag}</span>
              ))}
            </div>
          </header>

          <BlogContent content={blog.content} />
        </article>

      </div>
    </div>
  );
}
