import { Loader } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { fetchFileContent } from '@/packages/deagent-api'
import Markdown from '@/components/Markdown'

interface TextPreviewProps {
  sessionId: string
  filePath: string
  isMarkdown: boolean
}

export default function TextPreview({ sessionId, filePath, isMarkdown }: TextPreviewProps) {
  const { data: textContent, isLoading } = useQuery({
    queryKey: ['file-content', sessionId, filePath],
    queryFn: () => fetchFileContent(sessionId, filePath),
    staleTime: 30_000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader size="sm" />
      </div>
    )
  }

  if (isMarkdown) {
    return (
      <div className="p-3 prose prose-sm dark:prose-invert max-w-none">
        <Markdown>{textContent || ''}</Markdown>
      </div>
    )
  }

  return (
    <div className="p-2">
      <pre className="text-xs font-mono whitespace-pre-wrap break-all text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded p-2 overflow-auto">
        {textContent || ''}
      </pre>
    </div>
  )
}
