/** Application entry point with ErrorBoundary, routing, query caching, and toasts. */

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ToastProvider } from "@/components/ui/Toast"
import ErrorBoundary from "@/components/ui/ErrorBoundary"
import App from "./App"
import "./index.css"
import { logToServer, makeLogEntry } from "./api/logger"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary componentName="Application">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ToastProvider>
            <App />
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
)

// Global error handlers — report to backend logging endpoint (best-effort).
window.addEventListener("error", (ev) => {
  try {
    logToServer(makeLogEntry({
      level: "error", component: "window.onerror",
      message: String(ev.message),
      details: { filename: (ev as ErrorEvent).filename, lineno: (ev as ErrorEvent).lineno, colno: (ev as ErrorEvent).colno },
    }))
  } catch { /* ignore */ }
})

window.addEventListener("unhandledrejection", (ev) => {
  try {
    logToServer(makeLogEntry({
      level: "error", component: "unhandledrejection",
      message: String((ev as PromiseRejectionEvent).reason),
    }))
  } catch { /* ignore */ }
})
