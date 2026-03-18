import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { fetchWorkspaceFiles } from '@/packages/deagent-api'
import type { WorkspaceFileEntry, FileTreeNode } from '@shared/types/workspace'

/**
 * React Query hook for workspace files.
 * Auto-refetches on window focus; provides manual refetch.
 */
export function useWorkspaceFiles(sessionId: string | undefined) {
  const queryClient = useQueryClient()

  const { data: files = [], isLoading, error, refetch } = useQuery({
    queryKey: ['workspace-files', sessionId],
    queryFn: () => fetchWorkspaceFiles(sessionId!),
    enabled: !!sessionId,
    refetchOnWindowFocus: true,
    staleTime: 10_000,  // 10s
  })

  const refresh = useCallback(() => {
    if (sessionId) {
      queryClient.invalidateQueries({ queryKey: ['workspace-files', sessionId] })
    }
  }, [queryClient, sessionId])

  return { files, isLoading, error, refetch, refresh }
}

/**
 * Build a tree structure from a flat file list.
 */
export function buildFileTree(files: WorkspaceFileEntry[]): FileTreeNode[] {
  const root: FileTreeNode[] = []

  // Group by path segments
  for (const file of files) {
    // Extract relative path after /sandbox/ prefix
    const relativePath = file.path.replace(/^\/sandbox\//, '')
    const parts = relativePath.split('/')

    let current = root
    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i]
      let dirNode = current.find((n) => n.name === dirName && n.is_dir)
      if (!dirNode) {
        dirNode = {
          name: dirName,
          path: '/sandbox/' + parts.slice(0, i + 1).join('/'),
          is_dir: true,
          size: 0,
          modified_at: file.modified_at,
          is_artifact: false,
          children: [],
        }
        current.push(dirNode)
      }
      current = dirNode.children
    }

    // Add file/dir node
    const existing = current.find((n) => n.name === file.name)
    if (existing) {
      // Update existing directory node with real data
      Object.assign(existing, { ...file, children: existing.children })
    } else {
      current.push({
        ...file,
        children: [],
      })
    }
  }

  // Sort: directories first, then alphabetically
  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    for (const n of nodes) {
      if (n.children.length > 0) sortNodes(n.children)
    }
  }
  sortNodes(root)

  return root
}
