/**
 * eino_agent backend API client for workspace file browsing.
 */
import type { WorkspaceFileEntry, WorkspaceResponse } from '@shared/types/workspace'

// Default to localhost for development; can be overridden via environment variable.
const DEAGENT_API_BASE =
  typeof process !== 'undefined' && process.env.DEAGENT_API_BASE
    ? process.env.DEAGENT_API_BASE
    : 'http://localhost:8080'

function getBaseUrl(): string {
  return DEAGENT_API_BASE.replace(/\/+$/, '')
}

/**
 * Fetch all workspace files for a session.
 */
export async function fetchWorkspaceFiles(sessionId: string): Promise<WorkspaceFileEntry[]> {
  const url = `${getBaseUrl()}/v1/sessions/${encodeURIComponent(sessionId)}/workspace`
  const res = await fetch(url)
  if (!res.ok) {
    if (res.status === 404) return []
    throw new Error(`Failed to fetch workspace files: ${res.status}`)
  }
  const data: WorkspaceResponse = await res.json()
  return data.files ?? []
}

/**
 * Construct a direct URL for fetching file content (CDN-like).
 * Can be used as <img src={url}>, fetch(url), or <a href={url} download>.
 *
 * @param virtualPath - e.g. "/sandbox/workspace/report.md"
 */
export function getFileUrl(sessionId: string, virtualPath: string): string {
  // Strip "/sandbox/" prefix to get the relative path for the files endpoint
  const relativePath = virtualPath.replace(/^\/sandbox\//, '')
  return `${getBaseUrl()}/v1/sessions/${encodeURIComponent(sessionId)}/files/${relativePath}`
}

/**
 * Fetch file content as text.
 */
export async function fetchFileContent(sessionId: string, virtualPath: string): Promise<string> {
  const url = getFileUrl(sessionId, virtualPath)
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch file: ${res.status}`)
  }
  return res.text()
}
