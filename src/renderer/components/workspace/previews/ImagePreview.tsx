import type { FileTreeNode } from '@shared/types/workspace'

interface ImagePreviewProps {
  fileUrl: string
  file: FileTreeNode
}

export default function ImagePreview({ fileUrl, file }: ImagePreviewProps) {
  return (
    <div className="p-2 flex items-center justify-center h-full">
      <img
        src={fileUrl}
        alt={file.name}
        className="max-w-full max-h-full object-contain rounded"
      />
    </div>
  )
}
