import { ActionIcon, Loader, ScrollArea, Text, Tooltip } from '@mantine/core'
import { IconDownload, IconX } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchFileContent, getFileUrl } from '@/packages/deagent-api'
import Markdown from '@/components/Markdown'
import type { FileTreeNode } from '@shared/types/workspace'

interface FilePreviewProps {
  sessionId: string
  file: FileTreeNode
  onClose: () => void
}

// File extensions that can be previewed as text/code
const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'py', 'go', 'js', 'jsx', 'ts', 'tsx', 'json', 'yaml', 'yml',
  'toml', 'xml', 'html', 'htm', 'css', 'scss', 'less', 'sql', 'sh', 'bash',
  'bat', 'cmd', 'ps1', 'rb', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'rs',
  'swift', 'kt', 'php', 'r', 'lua', 'pl', 'csv', 'log', 'ini', 'cfg',
  'conf', 'env', 'gitignore', 'dockerfile', 'makefile',
])

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'])

function getExtension(name: string): string {
  const parts = name.toLowerCase().split('.')
  return parts.length > 1 ? parts[parts.length - 1] : ''
}

export default function FilePreview({ sessionId, file, onClose }: FilePreviewProps) {
  const { t } = useTranslation()
  const ext = getExtension(file.name)
  const fileUrl = getFileUrl(sessionId, file.path)

  const isImage = IMAGE_EXTENSIONS.has(ext)
  const isText = TEXT_EXTENSIONS.has(ext) || file.name.toLowerCase() === 'makefile' || file.name.toLowerCase() === 'dockerfile'
  const isMarkdown = ext === 'md'

  // Fetch text content for text-based files
  const { data: textContent, isLoading: isLoadingText } = useQuery({
    queryKey: ['file-content', sessionId, file.path],
    queryFn: () => fetchFileContent(sessionId, file.path),
    enabled: isText && !isImage,
    staleTime: 30_000,
  })

  return (
    <div className="flex flex-col h-full">
      {/* Preview header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-700">
        <Text size="xs" fw={500} className="truncate text-gray-600 dark:text-gray-400">
          {file.name}
        </Text>
        <div className="flex items-center gap-1">
          <Tooltip label={t('Download')} withArrow>
            <ActionIcon
              variant="subtle"
              size="xs"
              component="a"
              href={fileUrl}
              download={file.name}
              target="_blank"
            >
              <IconDownload size={12} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t('Close')} withArrow>
            <ActionIcon variant="subtle" size="xs" onClick={onClose}>
              <IconX size={12} />
            </ActionIcon>
          </Tooltip>
        </div>
      </div>

      {/* Content area */}
      <ScrollArea className="flex-1" type="auto">
        {isImage ? (
          <div className="p-2 flex items-center justify-center">
            <img
              src={fileUrl}
              alt={file.name}
              className="max-w-full max-h-[300px] object-contain rounded"
            />
          </div>
        ) : isText ? (
          isLoadingText ? (
            <div className="flex items-center justify-center py-8">
              <Loader size="sm" />
            </div>
          ) : isMarkdown ? (
            <div className="p-3 prose prose-sm dark:prose-invert max-w-none">
              <Markdown>{textContent || ''}</Markdown>
            </div>
          ) : (
            <div className="p-2">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded p-2 overflow-auto">
                {textContent || ''}
              </pre>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Text size="sm" c="dimmed">{t('Preview not available')}</Text>
            <a
              href={fileUrl}
              download={file.name}
              className="text-sm text-blue-500 hover:text-blue-600 underline"
            >
              {t('Download')}
            </a>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
