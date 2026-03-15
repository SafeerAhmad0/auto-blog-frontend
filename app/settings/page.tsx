"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "../components/AppNav";
import { supabase } from "../lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [role]              = useState("Member");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push("/register"); return; }
      const user = data.session.user;
      setName(user.user_metadata?.name ?? "");
      setEmail(user.email ?? "");
    });
  }, [router]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const { error } = await supabase.auth.updateUser({ data: { name } });
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <div className="max-w-2xl mx-auto px-5 py-12">

        <div className="mb-8">
          <h1 className="text-xl font-bold text-black">Settings</h1>
          <p className="mt-1 text-sm text-gray-400">Manage your account details.</p>
        </div>

        {/* Profile card */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-4">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-black">Profile</h2>
          </div>

          {/* Avatar row */}
          <div className="px-6 py-5 flex items-center gap-4 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white">
                {name ? name[0].toUpperCase() : email ? email[0].toUpperCase() : "?"}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-black">{name || "—"}</p>
              <p className="text-xs text-gray-400 mt-0.5">{email}</p>
              <span className="inline-block mt-1 text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                {role}
              </span>
            </div>
          </div>

          {/* Edit form */}
          <form onSubmit={saveProfile} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Display name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full border border-gray-100 rounded-lg px-3.5 py-2.5 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-300">Email cannot be changed here.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              {saved && <span className="text-xs text-green-600 font-medium">Saved!</span>}
            </div>
          </form>
        </div>

        {/* Account info card */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-black">Account</h2>
          </div>
          <div className="px-6 py-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Plan</span>
              <span className="text-sm font-medium text-black">Free</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Role</span>
              <span className="text-sm font-medium text-black">{role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Max agents</span>
              <span className="text-sm font-medium text-black">3</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
