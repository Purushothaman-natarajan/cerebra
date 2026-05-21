const capabilities = [
  {
    title: "Intelligent Workflows",
    desc: "Design multi-agent systems with AI orchestration, routing, and human-in-the-loop gates on a visual canvas.",
    icon: "⚡",
  },
  {
    title: "RAG & Vector Search",
    desc: "Retrieve relevant context using vector search and retrieval-augmented generation pipelines for accurate answers.",
    icon: "🔍",
  },
  {
    title: "Explainable AI",
    desc: "Every decision is traceable — inspect agent reasoning, tool calls, and token usage at each step.",
    icon: "📊",
  },
  {
    title: "Generative AI Runtime",
    desc: "Run any LLM — OpenAI, Gemini, Anthropic, Ollama, OpenRouter — with configurable guardrails and memory.",
    icon: "🧠",
  },
  {
    title: "AI Research Platform",
    desc: "Experiment with agent architectures, LangGraph runtimes, and custom tool integration in a production environment.",
    icon: "🔬",
  },
  {
    title: "Production Automation",
    desc: "Deploy automated research systems, support triage, web research agents, and custom orchestration pipelines.",
    icon: "🚀",
  },
]

export default function WhatCerebraDoes() {
  return (
    <section className="border-t border-slate-100 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            What Cerebra Does
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            An AI-powered platform for research, automation, and intelligent systems engineering.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((c) => (
            <div
              key={c.title}
              className="group rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-brand-200 hover:shadow-lg hover:shadow-brand-100/30"
            >
              <span className="text-2xl">{c.icon}</span>
              <h3 className="mt-3 font-semibold text-slate-900">{c.title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
