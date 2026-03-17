import { ModelProviderEnum, ModelProviderType } from '../../types'
import { defineProvider } from '../registry'
import OpenAIResponses from './models/openai-responses'

/** EinoAgent: eino_agent backend, OpenAI Responses API compatible. */
export const einoAgentProvider = defineProvider({
  id: ModelProviderEnum.EinoAgent,
  name: 'EinoAgent',
  type: ModelProviderType.OpenAIResponses,
  description: 'eino-agent',
  defaultSettings: {
    apiKey: '123',
    apiHost: 'http://21.6.137.176:8080',
    apiPath: '/responses',
    models: [
      { modelId: 'master' },
      { modelId: 'market' },
    ],
  },
  createModel: (config) => {
    return new OpenAIResponses(
      {
        apiKey: config.providerSetting.apiKey || '',
        apiHost: config.formattedApiHost,
        apiPath:
          config.providerSetting.apiPath ||
          config.globalSettings.providers?.[config.settings.provider!]?.apiPath ||
          '/responses',
        model: config.model,
        temperature: config.settings.temperature,
        topP: config.settings.topP,
        maxOutputTokens: config.settings.maxTokens,
        stream: config.settings.stream,
        useProxy: config.providerSetting.useProxy,
      },
      config.dependencies
    )
  },
  getDisplayName: (modelId, providerSettings) => {
    return `EinoAgent (${providerSettings?.models?.find((m) => m.modelId === modelId)?.nickname || modelId})`
  },
})
