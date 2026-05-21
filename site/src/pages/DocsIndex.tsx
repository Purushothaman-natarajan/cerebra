import { Link } from "react-router-dom"
import { allDocs } from "@/docs"

const docIcons: Record<string, string> = {
  quickstart: "⚡",
  architecture: "🏗️",
  "api-reference": "📡",
  deployment: "🚀",
  "developer-guide": "🛠️",
  contributing: "🤝",
  security: "🔒",
  changelog: "📋",
}

const sortedDocs = [...allDocs].sort((a, b) => {
  if (a.slug === "quickstart") return -1
  if (b.slug === "quickstart") return 1
  return a.title.localeCompare(b.title)
})

export default function DocsIndex() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Documentation
        </h1>
        <p className="mt-4 text-lg text-slate-500">
          Everything you need to get started with Cerebra.
        </p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {sortedDocs.map((doc) => (
          <Link
            key={doc.slug}
            to={`/docs/${doc.slug}`}
            className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-brand-200 hover:shadow-lg hover:shadow-brand-100/20"
          >
            <span className="text-2xl">{docIcons[doc.slug] ?? "📄"}</span>
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                {doc.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {doc.content.slice(0, 120).replace(/[#*\[\]`>|]/g, "").trim()}…
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
