import { Routes, Route, Navigate } from "react-router-dom"
import AgentsPage from "./pages/AgentsPage"
import WorkflowsPage from "./pages/WorkflowsPage"
import RunsPage from "./pages/RunsPage"
import ChannelsPage from "./pages/ChannelsPage"

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<Navigate to="/agents" replace />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/runs" element={<RunsPage />} />
        <Route path="/channels" element={<ChannelsPage />} />
      </Routes>
    </div>
  )
}

export default App
