// Floating translucent pill navbar — landing page only.
// Redirects logged-in users straight to dashboard.
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function LandingNav() {
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        router.replace("/dashboard");
      } else {
        setChecked(true);
      }
    });
  }, [router]);

  if (!checked) return null;

  return (
    <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav
        className="pointer-events-auto flex items-center gap-10 h-12 px-7 rounded-full"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        {/* Logo */}
        <Link href="/" className="text-sm font-semibold text-black tracking-tight shrink-0">
          AutoBlog
        </Link>

        {/* Center links */}
        <div className="hidden sm:flex items-center gap-6">
          <Link href="#how" className="text-sm text-gray-500 hover:text-black transition-colors">
            How it works
          </Link>
          <Link href="#types" className="text-sm text-gray-500 hover:text-black transition-colors">
            Blog types
          </Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          <Link href="/register" className="text-sm text-gray-500 hover:text-black transition-colors">
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-500 transition-colors font-medium"
          >
            Get started
          </Link>
        </div>
      </nav>
    </div>
  );
}
