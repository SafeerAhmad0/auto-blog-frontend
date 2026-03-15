"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";

type Mode = "signup" | "login";

export default function RegisterPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) router.replace("/dashboard");
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
        if (error) throw error;
        setMessage("Check your email for a confirmation link, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-black px-14 py-12">
        <Link href="/" className="text-sm font-semibold text-white tracking-tight">
          AutoBlog
        </Link>

        <div>
          <p className="text-xs font-medium text-blue-400 uppercase tracking-widest mb-4">
            Blog automation
          </p>
          <h2 className="text-4xl font-bold text-white leading-snug max-w-xs">
            One endpoint.<br />Daily fresh content.
          </h2>
          <p className="mt-5 text-sm text-gray-400 leading-relaxed max-w-xs">
            Set up an agent once. Call the API from your site every day. A fully written, SEO-ready post comes back automatically.
          </p>

          <div className="mt-12 space-y-3">
            {[
              "Up to 3 blog agents per account",
              "AI-written posts, cached daily",
              "Themed, website, e-commerce & more",
            ].map((t) => (
              <div key={t} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <p className="text-sm text-gray-400">{t}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-700">Powered by Gemini + Supabase</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col">

        {/* Top bar (mobile only shows logo) */}
        <div className="flex items-center justify-between px-8 py-5 lg:justify-end">
          <Link href="/" className="text-sm font-semibold text-black lg:hidden">AutoBlog</Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-black transition-colors hidden lg:block">
            ← Back to home
          </Link>
        </div>

        {/* Form centred */}
        <div className="flex-1 flex items-center justify-center px-8 pb-16">
          <div className="w-full max-w-sm">

            {/* Tab toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-8">
              {(["signup", "login"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(""); setMessage(""); }}
                  className={`flex-1 text-sm py-2 rounded-md transition-all font-medium ${
                    mode === m
                      ? "bg-white text-black shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {m === "signup" ? "Create account" : "Sign in"}
                </button>
              ))}
            </div>

            <h1 className="text-2xl font-bold text-black">
              {mode === "signup" ? "Get started" : "Welcome back"}
            </h1>
            <p className="mt-1.5 text-sm text-gray-400">
              {mode === "signup"
                ? "Create your free AutoBlog account."
                : "Sign in to continue."}
            </p>

            <form onSubmit={submit} className="mt-7 space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              {message && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3.5 py-2.5">
                  <p className="text-sm text-blue-600">{message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 mt-2"
              >
                {loading
                  ? "Please wait..."
                  : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
              <button
                onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); setMessage(""); }}
                className="text-blue-600 hover:underline font-medium"
              >
                {mode === "signup" ? "Sign in" : "Create account"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
