/**
 * fileTypes.ts — centralised file-type detection for the preview system.
 *
 * Each helper returns true/false based on the file extension.
 * Adding a new previewable type only requires updating this file
 * and creating a matching renderer in `previews/`.
 */

function getExtension(name: string): string {
  const parts = name.toLowerCase().split('.')
  return parts.length > 1 ? parts[parts.length - 1] : ''
}

// ── Extension sets ──────────────────────────────────────────────────

const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'py', 'go', 'js', 'jsx', 'ts', 'tsx', 'json', 'yaml', 'yml',
  'toml', 'xml', 'html', 'htm', 'css', 'scss', 'less', 'sql', 'sh', 'bash',
  'bat', 'cmd', 'ps1', 'rb', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'rs',
  'swift', 'kt', 'php', 'r', 'lua', 'pl', 'csv', 'log', 'ini', 'cfg',
  'conf', 'env', 'gitignore', 'dockerfile', 'makefile',
])

const IMAGE_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico',
])

const PDF_EXTENSIONS = new Set(['pdf'])

// Special filenames that should be treated as text regardless of extension
const TEXT_FILENAMES = new Set(['makefile', 'dockerfile'])

// ── Public API ──────────────────────────────────────────────────────

export type FilePreviewType = 'image' | 'pdf' | 'markdown' | 'text' | 'unknown'

/**
 * Determine the preview type for a given filename.
 */
export function detectFileType(filename: string): FilePreviewType {
  const ext = getExtension(filename)
  const lowerName = filename.toLowerCase()

  if (IMAGE_EXTENSIONS.has(ext)) return 'image'
  if (PDF_EXTENSIONS.has(ext)) return 'pdf'
  if (ext === 'md') return 'markdown'
  if (TEXT_EXTENSIONS.has(ext) || TEXT_FILENAMES.has(lowerName)) return 'text'
  return 'unknown'
}
