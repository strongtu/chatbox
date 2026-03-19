import platform from '@/platform'

export const featureFlags = {
  chatboxAI: false,
  webSearch: false,
  documentParser: false,
  createImage: false,
  copilots: false,
  mcp: platform.type === 'desktop',
  knowledgeBase: platform.type === 'desktop',
}
