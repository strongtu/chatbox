interface PdfPreviewProps {
  fileUrl: string
}

export default function PdfPreview({ fileUrl }: PdfPreviewProps) {
  return (
    <iframe
      src={fileUrl}
      className="w-full h-full border-0"
      title="PDF preview"
    />
  )
}
