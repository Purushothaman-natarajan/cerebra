const features = [
  {
    title: "Multi‑LLM Runtime",
    desc: "OpenAI, Gemini, Anthropic, Ollama, OpenRouter — assign any provider+model per agent node.",
    icon: "🧠",
  },
  {
    title: "Visual Canvas",
    desc: "Drag‑and‑drop ReactFlow canvas with Agent, Router, Human Gate, Output, and Note nodes.",
    icon: "🔀",
  },
  {
    title: "Agent Builder",
    desc: "System prompt, tools, conversation memory, guardrails, and configurable max iterations.",
    icon: "🤖",
  },
  {
    title: "13 Built‑in Tools",
    desc: "Web search, crawler, calculator, code execution, CVE lookup, JSON/CSV/XML parsing, and more.",
    icon: "🔧",
  },
  {
    title: "Telegram Integration",
    desc: "Connect Telegram bots to trigger workflows via webhook with inline keyboard support.",
    icon: "📡",
  },
  {
    title: "Pre‑built Templates",
    desc: "10 agent presets + 4 workflow blueprints to jump‑start your automation.",
    icon: "📋",
  },
]

export default function Features() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need to build AI agents
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            A full‑stack platform designed for production multi‑agent systems.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-brand-200 hover:shadow-lg hover:shadow-brand-100/30"
            >
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-3 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
