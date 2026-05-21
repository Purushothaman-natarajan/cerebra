export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-brand-400 to-brand-600 text-white text-xs font-bold">C</span>
            Cerebra — MIT License
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <a
              href="https://github.com/Purushothaman-natarajan/cerebra"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-700 transition-colors"
            >
              GitHub
            </a>
            <span className="text-slate-300">·</span>
            <span>Built with React + FastAPI</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
