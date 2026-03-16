"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppNav from "../components/AppNav";
import { createAgent, scrapeWebsite, getUserStats, Frequency, ContentLength, Tone } from "../lib/api";
import { supabase } from "../lib/supabase";

// ── Static option arrays ───────────────────────────────────────────────────────

const frequencies: { value: Frequency; label: string; sub: string }[] = [
  { value: "daily",     label: "Daily",     sub: "7× / week" },
  { value: "3x-week",   label: "3× week",   sub: "3× / week" },
  { value: "2x-week",   label: "2× week",   sub: "2× / week" },
  { value: "weekly",    label: "Weekly",    sub: "1× / week" },
  { value: "bi-weekly", label: "Bi-weekly", sub: "Every 2 weeks" },
  { value: "monthly",   label: "Monthly",   sub: "1× / month" },
];

const lengths: { value: ContentLength; label: string; sub: string }[] = [
  { value: "short",    label: "Short",    sub: "~500 w" },
  { value: "medium",   label: "Medium",   sub: "~800 w" },
  { value: "long",     label: "Long",     sub: "~1500 w" },
  { value: "longform", label: "Longform", sub: "~2500 w" },
];

const tones: Tone[] = ["professional", "casual", "educational", "humorous", "inspirational", "journalistic"];

const STEPS = ["Setup", "Content", "Brand"];

// ── Small reusable bits ────────────────────────────────────────────────────────

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3">
      <p className="text-sm font-semibold" style={{ color: "#0F172A", fontFamily: "Philosopher, system-ui, sans-serif" }}>
        {children}
      </p>
      {hint && <p className="text-xs mt-1" style={{ color: "#64748B" }}>{hint}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border rounded-lg px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all"
      style={{
        borderColor: "#E2E8F0",
        backgroundColor: "#FFFFFF",
        color: "#0F172A",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#3B82F6";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#E2E8F0";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={5}
      {...props}
      className="w-full border rounded-lg px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all resize-none font-family-base"
      style={{
        borderColor: "#E2E8F0",
        backgroundColor: "#FFFFFF",
        color: "#0F172A",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#3B82F6";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#E2E8F0";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CreatePage() {
  const router = useRouter();
  const [userId, setUserId]                   = useState("");
  const [agentsRemaining, setAgentsRemaining] = useState<number | null>(null);
  const [step, setStep]                       = useState(0);

  // Step 0 — Setup
  const [agentName, setAgentName]   = useState("");
  const [mode, setMode]             = useState<"website" | "data">("website");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [dataText, setDataText]     = useState("");
  const [scraping, setScraping]     = useState(false);
  const [scrapeInfo, setScrapeInfo] = useState<{ title: string; description: string } | null>(null);
  const [scrapeError, setScrapeError] = useState("");

  // Step 1 — Content
  const [duration,  setDuration]  = useState(1);
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [length,    setLength]    = useState<ContentLength>("medium");
  const [tone,      setTone]      = useState<Tone>("professional");
  const [audience,  setAudience]  = useState("");
  const [language,  setLanguage]  = useState("English");

  // Step 2 — Brand
  const [brandName, setBrandName] = useState("");
  const [brandDesc, setBrandDesc] = useState("");

  // Submission
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!user) { router.push("/register"); return; }
      setUserId(user.id);
      getUserStats(user.id).then((s) => setAgentsRemaining(s.agents_remaining)).catch(() => {});
    });
  }, [router]);

  // Auto-scrape when URL is entered and mode is website
  async function handleScrape() {
    const url = websiteUrl.trim();
    if (!url) return;
    setScraping(true);
    setScrapeError("");
    setScrapeInfo(null);
    try {
      const res = await scrapeWebsite(url);
      setScrapeInfo({ title: res.title, description: res.description });
    } catch (e: unknown) {
      setScrapeError(e instanceof Error ? e.message : "Could not scrape that URL");
    } finally {
      setScraping(false);
    }
  }

  async function submit() {
    if (!userId) { router.push("/register"); return; }
    if (agentsRemaining !== null && agentsRemaining <= 0) {
      setError("Agent limit reached. Delete an existing agent first."); return;
    }
    if (mode === "website" && !websiteUrl.trim()) {
      setError("Please enter a website URL."); return;
    }
    if (mode === "data" && !dataText.trim()) {
      setError("Please enter your topics or data."); return;
    }

    setLoading(true);
    setError("");
    try {
      const themes = mode === "data"
        ? dataText.split(/[\n,]+/).map((t) => t.trim()).filter(Boolean)
        : undefined;

      const res = await createAgent(userId, {
        name: agentName.trim() || "My Blog Agent",
        scenario: mode === "website" ? "website" : "data",
        website_url: mode === "website" ? websiteUrl.trim() : undefined,
        themes,
        duration_months: duration,
        frequency,
        content_length: length,
        tone,
        audience: audience.trim() || "general audience",
        language: language.trim() || "English",
        brand_name: brandName.trim() || undefined,
        brand_description: brandDesc.trim() || undefined,
      });
      router.push(`/plan/${userId}/${res.agent_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const durationLabel = duration < 1 ? "2 weeks" : `${duration} month${duration !== 1 ? "s" : ""}`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      <AppNav />

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2" style={{ color: "#0F172A", fontFamily: "Philosopher, system-ui, sans-serif" }}>
            Create a blog agent
          </h1>
          <p className="text-lg" style={{ color: "#64748B" }}>
            Let AI build your content calendar. Answer a few questions and we'll generate a 3-month plan.
          </p>
          {agentsRemaining !== null && (
            <div className="mt-4">
              <span className={`inline-block text-xs font-semibold px-3 py-1.5 rounded-full ${
                agentsRemaining === 0
                  ? "text-red-600 bg-red-50"
                  : "text-emerald-600 bg-emerald-50"
              }`}>
                {agentsRemaining === 0 
                  ? "⚠ Limit reached: 3/3" 
                  : `${agentsRemaining} agent${agentsRemaining !== 1 ? "s" : ""} remaining`}
              </span>
            </div>
          )}
        </div>

        {agentsRemaining === 0 ? (
          <div className="bg-white border rounded-xl p-8 text-center" style={{ borderColor: "#E2E8F0" }}>
            <p className="text-lg font-semibold mb-2" style={{ color: "#DC2626" }}>Agent limit reached</p>
            <p className="text-base mb-6" style={{ color: "#64748B" }}>You've created 3 agents. Delete one to create a new agent.</p>
            <a href="/agents" className="inline-block text-base font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}>
              Manage agents
            </a>
          </div>
        ) : (
          <>
            {/* Step indicator - Modern minimalist design */}
            <div className="mb-12">
              <div className="flex items-center justify-between" style={{ maxWidth: "100%" }}>
                {STEPS.map((s, i) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <button 
                        type="button" 
                        onClick={() => i < step && setStep(i)}
                        className="flex flex-col items-center w-full transition-opacity hover:opacity-75"
                        disabled={i > step}
                      >
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all mb-2 flex-shrink-0"
                          style={{
                            backgroundColor: i <= step ? "#3B82F6" : "#E2E8F0",
                            color: i <= step ? "#FFFFFF" : "#94A3B8",
                          }}
                        >
                          {i + 1}
                        </div>
                        <span 
                          className="text-sm font-semibold text-center"
                          style={{ color: i === step ? "#0F172A" : "#64748B" }}
                        >
                          {s}
                        </span>
                      </button>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div 
                        className="h-0.5 flex-1 mx-3 mt-6"
                        style={{ backgroundColor: i < step ? "#3B82F6" : "#E2E8F0" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-8 shadow-sm" style={{ borderColor: "#E2E8F0" }}>
              <div className="space-y-8">

              {/* ── STEP 0: Setup ── */}
              {step === 0 && (
                <>
                  <div>
                    <Label hint="Give your agent a memorable name">Agent name</Label>
                    <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="e.g., Tech Blog Agent" />
                  </div>

                  {/* Mode picker — clean and modern */}
                  <div>
                    <Label>Content source</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {([
                        { key: "website" as const, label: "Website", desc: "Import from your website", icon: "🌐" },
                        { key: "data"    as const, label: "Your topics", desc: "Use topics you provide", icon: "📝" },
                      ] as const).map((m) => (
                        <button 
                          key={m.key} 
                          type="button" 
                          onClick={() => setMode(m.key)}
                          className="text-left p-5 border rounded-xl transition-all duration-200 cursor-pointer"
                          style={{
                            borderColor: mode === m.key ? "#3B82F6" : "#E2E8F0",
                            backgroundColor: mode === m.key ? "rgba(59, 130, 246, 0.05)" : "#FFFFFF",
                          }}
                        >
                          <span className="text-3xl block mb-3">{m.icon}</span>
                          <p className="text-base font-semibold mb-1" style={{ color: mode === m.key ? "#3B82F6" : "#0F172A" }}>
                            {m.label}
                          </p>
                          <p className="text-sm" style={{ color: "#64748B" }}>
                            {m.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {mode === "website" && (
                    <div>
                      <Label hint="We'll analyze your site to understand your content style">Website URL</Label>
                      <div className="flex gap-3">
                        <Input
                          type="url"
                          value={websiteUrl}
                          onChange={(e) => { setWebsiteUrl(e.target.value); setScrapeInfo(null); setScrapeError(""); }}
                          placeholder="https://yoursite.com"
                          className="flex-1"
                        />
                        <button 
                          type="button" 
                          onClick={handleScrape} 
                          disabled={scraping || !websiteUrl.trim()}
                          className="px-6 py-3 text-base font-semibold border rounded-lg transition-all whitespace-nowrap disabled:opacity-50 flex-shrink-0"
                          style={{
                            borderColor: "#E2E8F0",
                            color: scraping ? "#64748B" : "#0F172A",
                            backgroundColor: "#FFFFFF",
                          }}
                        >
                          {scraping ? "Scanning…" : "Test URL"}
                        </button>
                      </div>
                      {scrapeInfo && (
                        <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: "rgba(34, 197, 94, 0.05)", borderLeft: "4px solid #22C55E" }}>
                          <p className="font-semibold text-base mb-2" style={{ color: "#16A34A" }}>✓ Site detected</p>
                          <p className="text-base font-medium" style={{ color: "#0F172A" }}>{scrapeInfo.title}</p>
                          {scrapeInfo.description && (
                            <p className="text-sm mt-2" style={{ color: "#64748B" }}>{scrapeInfo.description}</p>
                          )}
                        </div>
                      )}
                      {scrapeError && (
                        <p className="mt-3 text-sm font-medium" style={{ color: "#DC2626" }}>✗ {scrapeError}</p>
                      )}
                    </div>
                  )}

                  {mode === "data" && (
                    <div>
                      <Label hint="Topics, keywords, or content themes you'd like to cover">Your topics</Label>
                      <Textarea
                        value={dataText}
                        onChange={(e) => setDataText(e.target.value)}
                        placeholder={"e.g.\nAI tools for small businesses\nProductivity tips\nStartup growth strategies"}
                      />
                    </div>
                  )}

                  <div className="pt-4">
                    <button 
                      type="button" 
                      onClick={() => setStep(1)}
                      className="w-full text-white text-base font-semibold py-3 rounded-lg transition-all hover:opacity-90"
                      style={{ backgroundColor: "#3B82F6" }}
                    >
                      Continue to content settings
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP 1: Content ── */}
              {step === 1 && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label>Publishing duration</Label>
                      <span className="text-lg font-semibold" style={{ color: "#3B82F6" }}>{durationLabel}</span>
                    </div>
                    <input 
                      type="range" 
                      min={0.5} 
                      max={12} 
                      step={0.5} 
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((duration - 0.5) / 11.5) * 100}%, #E2E8F0 ${((duration - 0.5) / 11.5) * 100}%, #E2E8F0 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs font-medium mt-3" style={{ color: "#64748B" }}>
                      <span>2 weeks</span>
                      <span>12 months</span>
                    </div>
                  </div>

                  <div>
                    <Label>How often should we post?</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {frequencies.map((f) => (
                        <button 
                          key={f.value} 
                          type="button" 
                          onClick={() => setFrequency(f.value)}
                          className="text-left p-4 border rounded-lg transition-all duration-200"
                          style={{
                            borderColor: frequency === f.value ? "#3B82F6" : "#E2E8F0",
                            backgroundColor: frequency === f.value ? "rgba(59, 130, 246, 0.05)" : "#FFFFFF",
                          }}
                        >
                          <p className="text-sm font-semibold" style={{ color: frequency === f.value ? "#3B82F6" : "#0F172A" }}>
                            {f.label}
                          </p>
                          <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                            {f.sub}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Typical article length</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {lengths.map((l) => (
                        <button 
                          key={l.value} 
                          type="button" 
                          onClick={() => setLength(l.value)}
                          className="text-center p-4 border rounded-lg transition-all duration-200"
                          style={{
                            borderColor: length === l.value ? "#3B82F6" : "#E2E8F0",
                            backgroundColor: length === l.value ? "rgba(59, 130, 246, 0.05)" : "#FFFFFF",
                          }}
                        >
                          <p className="text-sm font-semibold" style={{ color: length === l.value ? "#3B82F6" : "#0F172A" }}>
                            {l.label}
                          </p>
                          <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                            {l.sub}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Writing tone</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tones.map((t) => (
                        <button 
                          key={t} 
                          type="button" 
                          onClick={() => setTone(t)}
                          className="px-4 py-2 text-sm font-semibold rounded-full border transition-all duration-200 capitalize"
                          style={{
                            borderColor: tone === t ? "#3B82F6" : "#E2E8F0",
                            backgroundColor: tone === t ? "#3B82F6" : "#FFFFFF",
                            color: tone === t ? "#FFFFFF" : "#0F172A",
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <Label hint="Who is your target reader?">Target audience</Label>
                      <Input 
                        value={audience} 
                        onChange={(e) => setAudience(e.target.value)} 
                        placeholder="e.g., startup founders, marketers"
                      />
                    </div>
                    <div>
                      <Label>Publishing language</Label>
                      <Input 
                        value={language} 
                        onChange={(e) => setLanguage(e.target.value)} 
                        placeholder="English"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setStep(0)}
                      className="flex-1 text-base font-semibold py-3 rounded-lg border transition-all"
                      style={{
                        borderColor: "#E2E8F0",
                        color: "#0F172A",
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      Back
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setStep(2)}
                      className="flex-1 text-white text-base font-semibold py-3 rounded-lg transition-all hover:opacity-90"
                      style={{ backgroundColor: "#3B82F6" }}
                    >
                      Continue to brand settings
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP 2: Brand + Create ── */}
              {step === 2 && (
                <>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#94A3B8" }}>
                      Brand information (optional)
                    </p>
                    <div className="space-y-6">
                      <div>
                        <Label hint="We'll naturally mention your brand in content">Brand name</Label>
                        <Input 
                          value={brandName} 
                          onChange={(e) => setBrandName(e.target.value)} 
                          placeholder="Acme Inc."
                        />
                      </div>
                      <div>
                        <Label hint="What does your brand do?">Brand description</Label>
                        <Input 
                          value={brandDesc} 
                          onChange={(e) => setBrandDesc(e.target.value)} 
                          placeholder="A brief description of your business"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-6 rounded-xl" style={{ backgroundColor: "#F1F5F9", borderLeft: "4px solid #3B82F6" }}>
                    <p className="text-sm font-semibold mb-4" style={{ color: "#0F172A" }}>Summary of your agent</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                      <div>
                        <p style={{ color: "#64748B" }}>Name</p>
                        <p className="font-semibold mt-1" style={{ color: "#0F172A" }}>
                          {agentName || "My Blog Agent"}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: "#64748B" }}>Mode</p>
                        <p className="font-semibold mt-1" style={{ color: "#0F172A" }}>
                          {mode === "website" ? "Website" : "Your topics"}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: "#64748B" }}>Duration</p>
                        <p className="font-semibold mt-1" style={{ color: "#0F172A" }}>{durationLabel}</p>
                      </div>
                      <div>
                        <p style={{ color: "#64748B" }}>Frequency</p>
                        <p className="font-semibold mt-1" style={{ color: "#0F172A" }}>
                          {frequency.replace(/-/g, " ")}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: "#64748B" }}>Length</p>
                        <p className="font-semibold mt-1 capitalize" style={{ color: "#0F172A" }}>{length}</p>
                      </div>
                      <div>
                        <p style={{ color: "#64748B" }}>Tone</p>
                        <p className="font-semibold mt-1 capitalize" style={{ color: "#0F172A" }}>{tone}</p>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 rounded-lg" style={{ backgroundColor: "rgba(220, 38, 38, 0.05)", borderLeft: "4px solid #DC2626" }}>
                      <p className="text-sm font-medium" style={{ color: "#DC2626" }}>{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setStep(1)}
                      className="flex-1 text-base font-semibold py-3 rounded-lg border transition-all"
                      style={{
                        borderColor: "#E2E8F0",
                        color: "#0F172A",
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      Back
                    </button>
                    <button 
                      type="button" 
                      onClick={submit} 
                      disabled={loading}
                      className="flex-1 text-white text-base font-semibold py-3 rounded-lg transition-all hover:opacity-90 disabled:opacity-60"
                      style={{ backgroundColor: "#3B82F6" }}
                    >
                      {loading ? "Creating your agent…" : "Create agent"}
                    </button>
                  </div>

                  {loading && (
                    <p className="text-center text-sm" style={{ color: "#64748B" }}>
                      Building your content calendar. This takes about 30 seconds.
                    </p>
                  )}
                </>
              )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


