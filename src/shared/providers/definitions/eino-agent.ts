import { ModelProviderEnum, ModelProviderType } from '../../types'
import { defineProvider } from '../registry'
import CustomOpenAIResponses from './models/custom-openai-responses'

/** EinoAgent: eino_agent backend, OpenAI chat/completions API with session_id for stateful conversation. */
export const einoAgentProvider = defineProvider({
  id: ModelProviderEnum.EinoAgent,
  name: 'EinoAgent',
  type: ModelProviderType.OpenAI,
  description: 'eino-agent',
  defaultSettings: {
    apiKey: '123',
    apiHost: 'http://21.6.137.176:8080',
    models: [
      { modelId: 'master' },
      { modelId: 'market' },
    ],
  },
  createModel: (config) => {
    return new CustomOpenAIResponses(
      {
        apiKey: config.providerSetting.apiKey || '',
        apiHost: config.formattedApiHost,
        apiPath:
          config.providerSetting.apiPath ||
          config.globalSettings.providers?.[config.settings.provider!]?.apiPath ||
          '',
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
