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
    <div className="mb-1.5">
      <p className="text-sm font-medium text-gray-800">{children}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={4}
      {...props}
      className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
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
        scenario: mode === "website" ? "website" : "themed",
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
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <div className="max-w-xl mx-auto px-5 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-black">New blog agent</h1>
            <p className="text-sm text-gray-400 mt-0.5">AI generates your full content calendar.</p>
          </div>
          {agentsRemaining !== null && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
              agentsRemaining === 0
                ? "text-red-500 bg-red-50 border-red-200"
                : "text-gray-500 bg-white border-gray-200"
            }`}>
              {agentsRemaining} slot{agentsRemaining !== 1 ? "s" : ""} left
            </span>
          )}
        </div>

        {agentsRemaining === 0 ? (
          <div className="bg-white border border-red-200 rounded-xl p-6 text-center">
            <p className="text-sm font-semibold text-red-600 mb-1">Agent limit reached</p>
            <p className="text-xs text-gray-400 mb-4">You have 3 / 3 agents. Delete one to create a new agent.</p>
            <a href="/agents" className="text-sm font-medium text-blue-600 hover:underline">Manage agents →</a>
          </div>
        ) : (
          <>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-7">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <button type="button" onClick={() => i < step && setStep(i)}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                      i === step ? "text-blue-600" : i < step ? "text-gray-400 hover:text-gray-600 cursor-pointer" : "text-gray-300"
                    }`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                      i === step ? "bg-blue-600 border-blue-600 text-white"
                      : i < step ? "bg-gray-100 border-gray-200 text-gray-500"
                      : "border-gray-200 text-gray-300"
                    }`}>{i + 1}</span>
                    {s}
                  </button>
                  {i < STEPS.length - 1 && <div className={`h-px w-6 ${i < step ? "bg-gray-300" : "bg-gray-100"}`} />}
                </div>
              ))}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">

              {/* ── STEP 0: Setup ── */}
              {step === 0 && (
                <>
                  <div>
                    <Label hint="A name to identify this agent">Agent name</Label>
                    <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="e.g. Tech Blog Agent" />
                  </div>

                  {/* Mode picker — just 2 */}
                  <div>
                    <Label>How should AI get content ideas?</Label>
                    <div className="grid grid-cols-2 gap-3 mt-1">
                      {([
                        { key: "website" as const, label: "Website", desc: "Paste your URL — AI reads your site and builds a tailored content calendar", icon: "🌐" },
                        { key: "data"    as const, label: "Your data", desc: "Paste topics, keywords, or notes — AI plans around what you give it", icon: "📝" },
                      ] as const).map((m) => (
                        <button key={m.key} type="button" onClick={() => setMode(m.key)}
                          className={`text-left p-4 border rounded-xl transition-all ${
                            mode === m.key ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:border-gray-300"
                          }`}>
                          <span className="text-xl block mb-1">{m.icon}</span>
                          <p className={`text-sm font-semibold ${mode === m.key ? "text-blue-700" : "text-gray-800"}`}>{m.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5 leading-snug">{m.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {mode === "website" && (
                    <div>
                      <Label hint="AI will scrape and analyse your site">Website URL</Label>
                      <div className="flex gap-2">
                        <Input
                          type="url"
                          value={websiteUrl}
                          onChange={(e) => { setWebsiteUrl(e.target.value); setScrapeInfo(null); setScrapeError(""); }}
                          placeholder="https://yoursite.com"
                          className="flex-1"
                        />
                        <button type="button" onClick={handleScrape} disabled={scraping || !websiteUrl.trim()}
                          className="px-3.5 py-2.5 text-sm font-medium border border-gray-200 rounded-lg hover:border-gray-400 transition-colors disabled:opacity-40 whitespace-nowrap">
                          {scraping ? "Scanning…" : "Test"}
                        </button>
                      </div>
                      {scrapeInfo && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-lg text-xs text-gray-600">
                          <p className="font-medium text-green-700 mb-0.5">✓ Site detected</p>
                          <p className="font-semibold">{scrapeInfo.title}</p>
                          {scrapeInfo.description && <p className="text-gray-400 mt-0.5">{scrapeInfo.description}</p>}
                        </div>
                      )}
                      {scrapeError && (
                        <p className="mt-2 text-xs text-red-500">{scrapeError}</p>
                      )}
                    </div>
                  )}

                  {mode === "data" && (
                    <div>
                      <Label hint="Topics, keywords, audience notes — anything that helps AI plan your content">Your topics / data</Label>
                      <Textarea
                        value={dataText}
                        onChange={(e) => setDataText(e.target.value)}
                        placeholder={"e.g.\nAI tools for small businesses\nProductivity tips for remote teams\nStartup growth strategies"}
                      />
                    </div>
                  )}

                  <button type="button" onClick={() => setStep(1)}
                    className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
                    Continue
                  </button>
                </>
              )}

              {/* ── STEP 1: Content ── */}
              {step === 1 && (
                <>
                  <div>
                    <Label>Duration — <span className="font-normal text-gray-500">{durationLabel}</span></Label>
                    <input type="range" min={0.5} max={12} step={0.5} value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full accent-blue-600 mt-1" />
                    <div className="flex justify-between text-xs text-gray-400 mt-1"><span>2 weeks</span><span>12 months</span></div>
                  </div>

                  <div>
                    <Label>Posting frequency</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {frequencies.map((f) => (
                        <button key={f.value} type="button" onClick={() => setFrequency(f.value)}
                          className={`text-left px-3 py-2.5 border rounded-xl transition-all ${
                            frequency === f.value ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:border-gray-300"
                          }`}>
                          <p className={`text-xs font-semibold ${frequency === f.value ? "text-blue-700" : "text-gray-800"}`}>{f.label}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{f.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Content length</Label>
                    <div className="grid grid-cols-4 gap-2 mt-1">
                      {lengths.map((l) => (
                        <button key={l.value} type="button" onClick={() => setLength(l.value)}
                          className={`text-center px-2 py-2.5 border rounded-xl transition-all ${
                            length === l.value ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:border-gray-300"
                          }`}>
                          <p className={`text-xs font-semibold ${length === l.value ? "text-blue-700" : "text-gray-800"}`}>{l.label}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{l.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Tone</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {tones.map((t) => (
                        <button key={t} type="button" onClick={() => setTone(t)}
                          className={`text-xs px-3.5 py-1.5 rounded-full border capitalize transition-all ${
                            tone === t ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-500 hover:border-gray-400"
                          }`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label hint="Who are you writing for?">Target audience</Label>
                      <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. startup founders" />
                    </div>
                    <div>
                      <Label>Language</Label>
                      <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="English" />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(0)}
                      className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:border-gray-400 transition-colors">
                      Back
                    </button>
                    <button type="button" onClick={() => setStep(2)}
                      className="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
                      Continue
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP 2: Brand + Create ── */}
              {step === 2 && (
                <>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Brand — optional</p>
                    <div className="space-y-4">
                      <div>
                        <Label hint="AI will mention your brand naturally in content">Brand name</Label>
                        <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Acme Inc." />
                      </div>
                      <div>
                        <Label>Brand description</Label>
                        <Input value={brandDesc} onChange={(e) => setBrandDesc(e.target.value)} placeholder="What your brand does" />
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-xl p-4 text-xs space-y-1.5">
                    <p className="font-semibold text-gray-700 text-sm mb-2">Summary</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      <span className="text-gray-400">Name</span>
                      <span className="text-gray-700 font-medium">{agentName || "My Blog Agent"}</span>
                      <span className="text-gray-400">Mode</span>
                      <span className="text-gray-700 font-medium">{mode === "website" ? "Website" : "Your data"}</span>
                      <span className="text-gray-400">Duration</span>
                      <span className="text-gray-700 font-medium">{durationLabel}</span>
                      <span className="text-gray-400">Frequency</span>
                      <span className="text-gray-700 font-medium">{frequency.replace(/-/g, " ")}</span>
                      <span className="text-gray-400">Length</span>
                      <span className="text-gray-700 font-medium capitalize">{length}</span>
                      <span className="text-gray-400">Tone</span>
                      <span className="text-gray-700 font-medium capitalize">{tone}</span>
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)}
                      className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:border-gray-400 transition-colors">
                      Back
                    </button>
                    <button type="button" onClick={submit} disabled={loading}
                      className="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60">
                      {loading ? "Generating schedule…" : "Create agent"}
                    </button>
                  </div>

                  {loading && (
                    <p className="text-center text-xs text-gray-400 -mt-2">This takes ~30 seconds. Please wait.</p>
                  )}
                </>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}

