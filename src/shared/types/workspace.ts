// Types for the eino_agent workspace API

export interface WorkspaceFileEntry {
  path: string // Virtual path, e.g. /sandbox/workspace/report.md
  name: string // Base filename
  size: number // File size in bytes
  is_dir: boolean
  mime_type?: string
  modified_at: string // RFC3339 timestamp
  is_artifact: boolean
}

export interface WorkspaceResponse {
  files: WorkspaceFileEntry[]
  truncated?: boolean
}

// Tree node representation built from flat file list
export interface FileTreeNode {
  name: string
  path: string
  is_dir: boolean
  size: number
  mime_type?: string
  modified_at: string
  is_artifact: boolean
  children: FileTreeNode[]
}
