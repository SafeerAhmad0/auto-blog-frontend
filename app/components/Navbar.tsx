"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [name, setName] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      setName(user?.user_metadata?.name ?? user?.email ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setName(user?.user_metadata?.name ?? user?.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [pathname]);

  async function logout() {
    await supabase.auth.signOut();
    setName(null);
    router.push("/");
  }

  return (
    <nav className="sticky top-0 z-20 bg-black border-b border-white/10">
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/" className="text-white font-semibold text-sm tracking-tight">
          AutoBlog
        </Link>

        <div className="flex items-center gap-6">
          {name ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/create"
                className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
              >
                New agent
              </Link>
              <button
                onClick={logout}
                className="text-sm text-white/40 hover:text-white/80 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
