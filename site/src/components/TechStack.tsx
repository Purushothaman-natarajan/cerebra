const tech = [
  { name: "Python 3.13", role: "Backend runtime", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { name: "FastAPI", role: "REST API framework", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { name: "SQLAlchemy 2.0", role: "ORM", color: "bg-red-50 text-red-700 border-red-200" },
  { name: "LangGraph", role: "Agent runtime", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { name: "React 19", role: "Frontend UI", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { name: "TypeScript", role: "Type-safe frontend", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { name: "ReactFlow", role: "Visual canvas", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { name: "Tailwind CSS", role: "Styling", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { name: "PostgreSQL 16", role: "Production DB", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { name: "Redis 7", role: "Pub/sub + cache", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { name: "Docker", role: "Containerization", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { name: "SQLite", role: "Dev database", color: "bg-slate-50 text-slate-700 border-slate-200" },
]

export default function TechStack() {
  return (
    <section className="border-t border-slate-100 bg-slate-50/50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Built with modern tools
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            Production‑grade stack for performance and developer experience.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {tech.map((t) => (
            <div
              key={t.name}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium ${t.color}`}
            >
              <span>{t.name}</span>
              <span className="text-xs opacity-60 hidden sm:inline">· {t.role}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
