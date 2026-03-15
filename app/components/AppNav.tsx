// App navbar — 3-section layout: logo | nav links | user avatar circle with dropdown.
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useEffect, useRef, useState } from "react";

export default function AppNav() {
  const [name, setName]             = useState<string | null>(null);
  const [email, setEmail]           = useState<string | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [theme, setTheme]           = useState<"light" | "dark">("light");
  const avatarRef                   = useRef<HTMLDivElement>(null);
  const agentsRef                   = useRef<HTMLDivElement>(null);
  const router                      = useRouter();
  const pathname                    = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      setName(user?.user_metadata?.name ?? null);
      setEmail(user?.email ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      const user = session?.user;
      setName(user?.user_metadata?.name ?? null);
      setEmail(user?.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [pathname]);

  // Persist + apply theme
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) setTheme(saved);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const initial = name ? name.trim()[0].toUpperCase() : email ? email[0].toUpperCase() : "?";
  const display = name ?? email ?? "User";

  const isAgentsActive = pathname === "/agents" || pathname === "/create";

  return (
    <nav
      className="sticky top-0 z-20 h-14 border-b"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderColor: "rgba(0,0,0,0.07)",
      }}
    >
      <div className="max-w-5xl mx-auto px-5 h-full grid grid-cols-3 items-center">

        {/* LEFT — brand */}
        <div className="flex items-center">
          <Link href="/dashboard" className="text-sm font-semibold text-black tracking-tight">
            AutoBlog
          </Link>
        </div>

        {/* CENTER — nav links */}
        <div className="flex items-center justify-center gap-1">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`text-sm px-4 py-1.5 rounded-md transition-colors font-medium ${
              pathname === "/dashboard"
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:text-black hover:bg-gray-100"
            }`}
          >
            Dashboard
          </Link>

          {/* Agents — hover dropdown */}
          <div
            ref={agentsRef}
            className="relative"
            onMouseEnter={() => setAgentsOpen(true)}
            onMouseLeave={() => setAgentsOpen(false)}
          >
            <button
              className={`text-sm px-4 py-1.5 rounded-md transition-colors font-medium flex items-center gap-1 ${
                isAgentsActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:text-black hover:bg-gray-100"
              }`}
            >
              Agents
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-60">
                <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {agentsOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50">
                <Link
                  href="/agents"
                  onClick={() => setAgentsOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                    pathname === "/agents" ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-gray-400 text-xs">⊞</span> View agents
                </Link>
                <Link
                  href="/create"
                  onClick={() => setAgentsOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                    pathname === "/create" ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-gray-400 text-xs">+</span> New agent
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — avatar with dropdown */}
        <div
          className="flex items-center justify-end relative"
          ref={avatarRef}
          onMouseEnter={() => setAvatarOpen(true)}
          onMouseLeave={() => setAvatarOpen(false)}
        >
          <button
            className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 hover:bg-blue-700 transition-colors focus:outline-none"
            title={display}
          >
            <span className="text-xs font-semibold text-white leading-none">{initial}</span>
          </button>

          {avatarOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50">

              {/* User info */}
              <div className="px-4 py-3.5 border-b border-gray-100">
                <p className="text-sm font-semibold text-black truncate">{display}</p>
                {email && name && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{email}</p>
                )}
                <span className="inline-block mt-1.5 text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Member
                </span>
              </div>

              {/* Theme toggle */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Theme</span>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                  {(["light", "dark"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`text-xs px-2.5 py-1 rounded-md transition-all capitalize font-medium ${
                        theme === t
                          ? "bg-white text-black shadow-sm"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      {t === "light" ? "Light" : "Dark"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div className="py-1">
                <Link href="/settings" onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-black transition-colors">
                  <span className="text-gray-400 text-xs">⚙</span> Settings
                </Link>
                <Link href="/dashboard" onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-black transition-colors">
                  <span className="text-gray-400 text-xs">⊞</span> Dashboard
                </Link>
              </div>

              {/* Sign out */}
              <div className="border-t border-gray-100 py-1">
                <button onClick={logout}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                  <span>→</span> Sign out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}

