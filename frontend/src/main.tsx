/** Application entry point with ErrorBoundary, routing, query caching, and toasts. */

import { StrictMode, Component, type ReactNode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ToastProvider } from "@/components/ui/Toast"
import { Button } from "@/components/ui"
import App from "./App"
import "./index.css"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
})

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg-primary)" }}>
          <div className="text-center max-w-md p-8">
            <p className="text-rose-500 mb-3 text-lg font-semibold">Application Error</p>
            <p className="text-sm text-muted mb-6">{this.state.error.message}</p>
            <Button onClick={() => this.setState({ error: null })}>Retry</Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
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
