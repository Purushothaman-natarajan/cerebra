import { Routes, Route, Navigate } from "react-router-dom"
import Layout from "@/components/Layout"
import Home from "@/pages/Home"
import DocsIndex from "@/pages/DocsIndex"
import DocPage from "@/pages/DocPage"

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/docs" element={<DocsIndex />} />
        <Route path="/docs/:slug" element={<DocPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
