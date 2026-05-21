import { Link, useLocation } from "react-router-dom"
import Footer from "./Footer"

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/docs", label: "Docs" },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-slate-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white text-sm font-bold">C</span>
            Cerebra
          </Link>
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = link.to === "/" ? pathname === "/" : pathname.startsWith(link.to)
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
            <a
              href="https://github.com/Purushothaman-natarajan/cerebra"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              GitHub →
            </a>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
