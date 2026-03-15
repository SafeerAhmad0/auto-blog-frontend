import Link from "next/link";
import LandingNav from "./components/LandingNav";

const steps = [
  { n: "01", title: "Create account",  body: "Register free. Up to 3 blog agents per account." },
  { n: "02", title: "Build an agent",  body: "Pick a scenario, tone and topics. AI generates your full content calendar." },
  { n: "03", title: "Call one endpoint", body: "Hit the API daily from your site. A fresh, SEO-ready post every time." },
];

const scenarios = [
  { label: "Website",        desc: "Matches your site's voice" },
  { label: "Themed",         desc: "Your topics, your rules" },
  { label: "E-commerce",     desc: "Product guides & reviews" },
  { label: "News",           desc: "Roundups & hot takes" },
  { label: "Tutorial",       desc: "Step-by-step how-tos" },
  { label: "Personal Brand", desc: "Thought leadership" },
  { label: "SEO Blitz",      desc: "Pillar & cluster strategy" },
  { label: "Affiliate",      desc: "Best-of & comparisons" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-black">
      <LandingNav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-36 pb-16 text-center">
        <span className="inline-block text-[11px] font-semibold text-blue-600 uppercase tracking-widest mb-5 border border-blue-100 bg-blue-50 px-3 py-1 rounded-full">
          Blog automation
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-black leading-[1.12] tracking-tight">
          Publish great content,<br className="hidden sm:block" /> automatically.
        </h1>
        <p className="mt-5 text-base text-gray-400 max-w-md mx-auto leading-relaxed">
          Set up once. Call one endpoint daily. Get a fully written, SEO-ready post — no effort required.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/register"
            className="bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="#how"
            className="text-sm text-gray-400 hover:text-black transition-colors px-4 py-2.5"
          >
            How it works →
          </Link>
        </div>
      </section>

      {/* Endpoint pill */}
      <div className="flex justify-center px-6 pb-16">
        <div className="bg-gray-950 rounded-xl px-5 py-3.5 flex items-center gap-3 max-w-full overflow-x-auto">
          <span className="text-[11px] font-mono text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded shrink-0">GET</span>
          <span className="text-sm font-mono text-gray-300 whitespace-nowrap">
            /api/<span className="text-blue-400">{"{user_id}"}</span>/<span className="text-blue-400">{"{agent_id}"}</span>/blog/today
          </span>
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* How it works */}
      <section id="how" className="max-w-4xl mx-auto px-6 py-14">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-8">How it works</p>
        <div className="grid sm:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.n} className="flex gap-4">
              <span className="text-[11px] font-mono text-blue-500 mt-0.5 shrink-0">{s.n}</span>
              <div>
                <h3 className="text-sm font-semibold text-black">{s.title}</h3>
                <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-gray-100" />

      {/* Blog types */}
      <section id="types" className="max-w-4xl mx-auto px-6 py-14">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-8">Blog types</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {scenarios.map((s) => (
            <div
              key={s.label}
              className="border border-gray-100 rounded-lg px-4 py-3.5 hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
            >
              <p className="text-sm font-semibold text-black">{s.label}</p>
              <p className="mt-0.5 text-xs text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-6 mb-12 rounded-2xl border border-blue-100 bg-blue-50">
        <div className="max-w-4xl mx-auto px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-black">Start automating your blog.</h2>
            <p className="mt-1 text-sm text-gray-500">Free to start. Up to 3 agents per account.</p>
          </div>
          <Link
            href="/register"
            className="shrink-0 bg-blue-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-blue-500 transition-colors"
          >
            Create free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <span className="text-xs text-gray-400 font-medium">AutoBlog</span>
        </div>
      </footer>
    </div>
  );
}
