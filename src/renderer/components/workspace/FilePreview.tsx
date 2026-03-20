import { ActionIcon, ScrollArea, Text, Tooltip } from '@mantine/core'
import { IconDownload, IconX } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { getFileUrl } from '@/packages/deagent-api'
import type { FileTreeNode } from '@shared/types/workspace'
import {
  detectFileType,
  ImagePreview,
  PdfPreview,
  TextPreview,
  UnknownPreview,
} from './previews'

interface FilePreviewProps {
  sessionId: string
  file: FileTreeNode
  onClose: () => void
}

export default function FilePreview({ sessionId, file, onClose }: FilePreviewProps) {
  const { t } = useTranslation()
  const fileUrl = getFileUrl(sessionId, file.path)
  const fileType = detectFileType(file.name)

  // PDF and images manage their own scrolling / sizing — no ScrollArea wrapper
  const needsScrollArea = fileType !== 'pdf' && fileType !== 'image'

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
      {needsScrollArea ? (
        <ScrollArea className="flex-1" type="auto">
          <PreviewContent
            fileType={fileType}
            fileUrl={fileUrl}
            file={file}
            sessionId={sessionId}
          />
        </ScrollArea>
      ) : (
        <div className="flex-1 min-h-0">
          <PreviewContent
            fileType={fileType}
            fileUrl={fileUrl}
            file={file}
            sessionId={sessionId}
          />
        </div>
      )}
    </div>
  )
}

/**
 * PreviewContent dispatches to the appropriate renderer based on file type.
 */
function PreviewContent({
  fileType,
  fileUrl,
  file,
  sessionId,
}: {
  fileType: ReturnType<typeof detectFileType>
  fileUrl: string
  file: FileTreeNode
  sessionId: string
}) {
  switch (fileType) {
    case 'image':
      return <ImagePreview fileUrl={fileUrl} file={file} />
    case 'pdf':
      return <PdfPreview fileUrl={fileUrl} />
    case 'markdown':
      return <TextPreview sessionId={sessionId} filePath={file.path} isMarkdown />
    case 'text':
      return <TextPreview sessionId={sessionId} filePath={file.path} isMarkdown={false} />
    case 'unknown':
    default:
      return <UnknownPreview fileUrl={fileUrl} fileName={file.name} />
  }
}
