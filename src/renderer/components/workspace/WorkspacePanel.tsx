import { ActionIcon, Loader, ScrollArea, Text, Tooltip } from '@mantine/core'
import { IconChevronDown, IconChevronRight, IconFolder, IconFolderOpen, IconRefresh, IconStar, IconX } from '@tabler/icons-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import FileIcon from '@/components/FileIcon'
import { useWorkspaceFiles, buildFileTree } from '@/hooks/useWorkspaceFiles'
import type { FileTreeNode } from '@shared/types/workspace'
import FilePreview from './FilePreview'

interface WorkspacePanelProps {
  sessionId: string
  onClose: () => void
}

export default function WorkspacePanel({ sessionId, onClose }: WorkspacePanelProps) {
  const { t } = useTranslation()
  const { files, isLoading, refresh } = useWorkspaceFiles(sessionId)
  const [selectedFile, setSelectedFile] = useState<FileTreeNode | null>(null)

  // Vertical split: treeRatio is the fraction (0–1) of the content area given to the file tree
  const [treeRatio, setTreeRatio] = useState(0.5)
  const [isResizingSplit, setIsResizingSplit] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const tree = useMemo(() => buildFileTree(files), [files])

  const handleFileClick = useCallback((node: FileTreeNode) => {
    if (!node.is_dir) {
      setSelectedFile(node)
    }
  }, [])

  // --- Vertical splitter drag logic ---
  const handleSplitMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingSplit(true)
  }, [])

  useEffect(() => {
    if (!isResizingSplit) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const y = e.clientY - rect.top
      const ratio = Math.max(0.15, Math.min(0.85, y / rect.height))
      setTreeRatio(ratio)
    }

    const handleMouseUp = () => {
      setIsResizingSplit(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingSplit])

  const showPreview = !!selectedFile

  return (
    <div className="flex flex-col h-full border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <Text size="sm" fw={600} className="text-gray-700 dark:text-gray-300">
          {t('Workspace Files')}
        </Text>
        <div className="flex items-center gap-1">
          <Tooltip label={t('Refresh')} withArrow>
            <ActionIcon variant="subtle" size="sm" onClick={refresh} loading={isLoading}>
              <IconRefresh size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t('Close')} withArrow>
            <ActionIcon variant="subtle" size="sm" onClick={onClose}>
              <IconX size={14} />
            </ActionIcon>
          </Tooltip>
        </div>
      </div>

      {/* Content area: file tree + optional resizable preview */}
      <div
        ref={containerRef}
        className="flex flex-col flex-1 min-h-0 relative"
        style={isResizingSplit ? { userSelect: 'none' } : undefined}
      >
        {/* File tree */}
        <ScrollArea
          className="min-h-0"
          type="auto"
          style={showPreview ? { height: `${treeRatio * 100}%` } : { flex: 1 }}
        >
          {isLoading && files.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader size="sm" />
            </div>
          ) : tree.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Text size="xs" c="dimmed">{t('No files yet')}</Text>
            </div>
          ) : (
            <div className="py-1">
              {tree.map((node) => (
                <TreeNode key={node.path} node={node} depth={0} onFileClick={handleFileClick} selectedPath={selectedFile?.path} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Resizable splitter + File preview */}
        {showPreview && (
          <>
            {/* Drag handle */}
            <div
              onMouseDown={handleSplitMouseDown}
              className="h-1 cursor-row-resize relative z-[1] shrink-0 group"
            >
              <div className="absolute inset-x-0 -top-1 -bottom-1" />
              <div className="h-full bg-gray-200 dark:bg-gray-700 group-hover:bg-blue-400 dark:group-hover:bg-blue-500 transition-colors duration-150" />
            </div>

            {/* File preview */}
            <div
              className="min-h-0 flex flex-col"
              style={{ height: `${(1 - treeRatio) * 100}%` }}
            >
              <FilePreview
                sessionId={sessionId}
                file={selectedFile}
                onClose={() => setSelectedFile(null)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// --- Tree node component ---

function TreeNode({
  node,
  depth,
  onFileClick,
  selectedPath,
}: {
  node: FileTreeNode
  depth: number
  onFileClick: (node: FileTreeNode) => void
  selectedPath?: string
}) {
  const [expanded, setExpanded] = useState(depth < 1) // Auto-expand first level

  const handleClick = () => {
    if (node.is_dir) {
      setExpanded(!expanded)
    } else {
      onFileClick(node)
    }
  }

  const isSelected = selectedPath === node.path

  return (
    <>
      <div
        className={`flex items-center gap-1 px-2 py-0.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-sm ${
          isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {/* Expand/collapse icon for directories */}
        {node.is_dir ? (
          <span className="w-4 h-4 flex items-center justify-center text-gray-400">
            {expanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
          </span>
        ) : (
          <span className="w-4" />
        )}

        {/* File/folder icon */}
        {node.is_dir ? (
          expanded ? <IconFolderOpen size={16} className="text-yellow-500 shrink-0" /> : <IconFolder size={16} className="text-yellow-500 shrink-0" />
        ) : (
          <FileIcon filename={node.name} className="w-4 h-4 shrink-0" />
        )}

        {/* Name */}
        <span className="truncate text-gray-700 dark:text-gray-300">{node.name}</span>

        {/* Artifact star */}
        {node.is_artifact && (
          <IconStar size={12} className="text-yellow-400 shrink-0" fill="currentColor" />
        )}

        {/* File size */}
        {!node.is_dir && (
          <span className="ml-auto text-xs text-gray-400 shrink-0">{formatSize(node.size)}</span>
        )}
      </div>

      {/* Children */}
      {node.is_dir && expanded && node.children.map((child) => (
        <TreeNode key={child.path} node={child} depth={depth + 1} onFileClick={onFileClick} selectedPath={selectedPath} />
      ))}
    </>
  )
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, i)
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`
}
