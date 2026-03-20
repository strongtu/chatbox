import { Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'

interface UnknownPreviewProps {
  fileUrl: string
  fileName: string
}

export default function UnknownPreview({ fileUrl, fileName }: UnknownPreviewProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <Text size="sm" c="dimmed">{t('Preview not available')}</Text>
      <a
        href={fileUrl}
        download={fileName}
        className="text-sm text-blue-500 hover:text-blue-600 underline"
      >
        {t('Download')}
      </a>
    </div>
  )
}
