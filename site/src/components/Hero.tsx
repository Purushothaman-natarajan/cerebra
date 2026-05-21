import { Link } from "react-router-dom"

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.08),transparent_50%)]" />
      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1 text-xs font-medium text-brand-300">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
            Open Source · MIT License
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            AI Agent{" "}
            <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
              Orchestration
            </span>{" "}
            Platform
          </h1>
          <p className="mt-6 text-lg text-slate-400 sm:text-xl max-w-2xl mx-auto">
            Build multi-agent workflows with a visual canvas. Connect any LLM —
            OpenAI, Gemini, Anthropic. Add tools, set guardrails, deploy via
            Telegram or API.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-brand-500/40"
            >
              Read the Docs
            </Link>
            <a
              href="https://github.com/Purushothaman-natarajan/cerebra"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/50 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:bg-slate-700 hover:text-white"
            >
              View on GitHub
            </a>
          </div>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "LLMs Supported", value: "5+" },
            { label: "Built-in Tools", value: "13" },
            { label: "Node Types", value: "5" },
            { label: "Template Blueprints", value: "14" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-brand-400">{stat.value}</div>
              <div className="mt-0.5 text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
