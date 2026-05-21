const docModules = import.meta.glob("../../docs/*.md", { query: "?raw", import: "default", eager: true })

export interface DocEntry {
  slug: string
  title: string
  content: string
}

const titleMap: Record<string, string> = {
  ARCHITECTURE: "Architecture",
  API: "API Reference",
  DEPLOYMENT: "Deployment",
  DEVELOPMENT: "Development Guide",
  PROVIDERS: "Provider Setup",
  TROUBLESHOOTING: "Troubleshooting",
  CONTRIBUTING: "Contributing",
  SECURITY: "Security",
  CHANGELOG: "Changelog",
  INDEX: "Overview",
}

export const allDocs: DocEntry[] = Object.entries(docModules)
  .map(([filePath, content]) => {
    const base = filePath.split("/").pop()?.replace(/\.md$/, "") ?? ""
    return {
      slug: base.toLowerCase().replace(/_/g, "-"),
      title: titleMap[base] ?? base,
      content: content as string,
    }
  })
  .filter((d) => d.slug !== "index" && d.slug !== "index-1")

export function getDoc(slug: string): DocEntry | undefined {
  return allDocs.find((d) => d.slug === slug)
}
