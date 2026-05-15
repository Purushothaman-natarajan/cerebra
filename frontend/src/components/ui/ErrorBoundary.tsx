/** Reusable error boundary with retry support and optional fallback UI. */

import { Component, type ErrorInfo, type ReactNode } from "react"
import Button from "./Button"
import { logToServer, makeLogEntry } from "@/api/logger"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  componentName?: string
}

interface State {
  error: Error | null
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { error, hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Report to the logging endpoint (best-effort)
    logToServer(makeLogEntry({
      level: "error",
      component: this.props.componentName || "ErrorBoundary",
      action: "componentDidCatch",
      message: error.message,
      details: { stack: error.stack, componentStack: info.componentStack },
    }))
  }

  handleRetry = () => {
    this.setState({ error: null, hasError: false })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex items-center justify-center min-h-[200px] p-8">
          <div className="text-center max-w-md">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <span className="text-rose-500 text-xl font-bold">!</span>
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">
              {this.props.componentName || "Something went wrong"}
            </p>
            <p className="text-xs text-muted mb-4">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <Button size="sm" onClick={this.handleRetry}>Retry</Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
