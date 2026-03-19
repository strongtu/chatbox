import platform from '@/platform'

export const featureFlags = {
  chatboxAI: false,
  webSearch: false,
  documentParser: false,
  mcp: platform.type === 'desktop',
  knowledgeBase: platform.type === 'desktop',
}
