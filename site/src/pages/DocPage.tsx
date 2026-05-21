import { useParams, Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { getDoc, allDocs } from "@/docs"

export default function DocPage() {
  const { slug } = useParams<{ slug: string }>()
  const doc = slug ? getDoc(slug) : undefined

  if (!doc) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-slate-500">Document not found.</p>
        <Link to="/docs" className="mt-2 inline-block text-brand-600 hover:underline">
          ← Back to docs
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <aside className="hidden w-56 shrink-0 lg:block">
        <nav className="sticky top-20 space-y-1">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Documentation</p>
          {allDocs.map((d) => (
            <Link
              key={d.slug}
              to={`/docs/${d.slug}`}
              className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                d.slug === slug
                  ? "bg-brand-50 font-medium text-brand-700"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              {d.title}
            </Link>
          ))}
        </nav>
      </aside>
      <article className="min-w-0 flex-1 lg:pl-10">
        <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline prose-code:rounded prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-normal prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-img:rounded-xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {doc.content}
          </ReactMarkdown>
        </div>
        <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6">
          <Link to="/docs" className="text-sm text-brand-600 hover:underline">
            ← Back to docs
          </Link>
          <a
            href={`https://github.com/Purushothaman-natarajan/cerebra/blob/main/docs/${slug!.replace(/-/g, "_").toUpperCase()}.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-400 hover:text-slate-700"
          >
            Edit on GitHub →
          </a>
        </div>
      </article>
    </div>
  )
}
