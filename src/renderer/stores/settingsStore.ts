/** biome-ignore-all lint/suspicious/noExplicitAny: any */
/** biome-ignore-all lint/suspicious/noFallthroughSwitchClause: migrate */

import * as defaults from '@shared/defaults'
import { type ProviderSettings, type Settings, SettingsSchema } from '@shared/types'
import type { DocumentParserConfig } from '@shared/types/settings'
import deepmerge from 'deepmerge'
import type { WritableDraft } from 'immer'
import { createStore, useStore } from 'zustand'
import { createJSONStorage, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { getLogger } from '@/lib/utils'
import platform from '@/platform'
import storage from '@/storage'

const log = getLogger('settings-store')

/**
 * Returns platform-specific default document parser configuration.
 * - Desktop: 'local' (has full Node.js environment for local parsing)
 * - Mobile/Web: 'none' (only basic text file support by default, user can enable chatbox-ai)
 */
export function getPlatformDefaultDocumentParser(): DocumentParserConfig {
  return platform.type === 'desktop' ? { type: 'local' } : { type: 'none' }
}

type Action = {
  setSettings: (nextStateOrUpdater: Partial<Settings> | ((state: WritableDraft<Settings>) => void)) => void
  getSettings: () => Settings
}

export const settingsStore = createStore<Settings & Action>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        ...SettingsSchema.parse(defaults.settings()),
        setSettings: (val) => set(val),
        getSettings: () => {
          const store = get()
          return SettingsSchema.parse(store)
        },
      })),
      {
        name: 'settings',
        storage: createJSONStorage(() => ({
          getItem: async (key) => {
            const res = await storage.getItem<(Settings & { __version?: number }) | null>(key, null)
            if (res) {
              const { __version = 0, ...state } = res
              return JSON.stringify({
                state,
                version: __version,
              })
            }

            return null
          },
          setItem: async (name, value) => {
            const { state, version } = JSON.parse(value) as { state: Settings; version?: number }
            await storage.setItem(name, { ...state, __version: version || 0 })
          },
          removeItem: async (name) => await storage.removeItem(name),
        })),
        version: 3,
        partialize: (state) => {
          try {
            return SettingsSchema.parse(state)
          } catch {
            return state
          }
        },
        migrate: (persisted: any, version) => {
          // merge the newly added fields in defaults.settings() into the persisted values (deep merge).
          const settings: any = deepmerge(defaults.settings(), persisted, {
            arrayMerge: (_target, source) => source,
          })

          switch (version) {
            case 0:
              // fix typo
              settings.shortcuts.inputBoxSendMessage =
                settings.shortcuts.inpubBoxSendMessage || settings.shortcuts.inputBoxSendMessage
              settings.shortcuts.inputBoxSendMessageWithoutResponse =
                settings.shortcuts.inpubBoxSendMessageWithoutResponse ||
                settings.shortcuts.inputBoxSendMessageWithoutResponse
            case 1:
              if (settings.licenseKey && !settings.licenseActivationMethod) {
                settings.licenseActivationMethod = 'manual'
                settings.memorizedManualLicenseKey = settings.licenseKey
              }
            case 2:
            // Initialize EinoAgent as system provider
            default:
              break
          }

          // Apply platform-specific default for documentParser if not set
          if (!settings.extension?.documentParser) {
            settings.extension = {
              ...settings.extension,
              documentParser: getPlatformDefaultDocumentParser(),
            }
          }

          // Migrate EinoAgent from custom provider to system provider (eino-agent)
          const EINO_AGENT_CUSTOM_ID = 'custom-provider-eino-agent'
          const EINO_AGENT_SYSTEM_ID = 'eino-agent'
          if (settings.defaultChatModel?.provider === EINO_AGENT_CUSTOM_ID) {
            settings.defaultChatModel = { ...settings.defaultChatModel, provider: EINO_AGENT_SYSTEM_ID }
          }
          if (Array.isArray(settings.customProviders)) {
            settings.customProviders = settings.customProviders.filter(
              (p: { id: string }) => p.id !== EINO_AGENT_CUSTOM_ID
            )
          }
          if (settings.providers?.[EINO_AGENT_CUSTOM_ID]) {
            settings.providers = { ...settings.providers }
            settings.providers[EINO_AGENT_SYSTEM_ID] = settings.providers[EINO_AGENT_CUSTOM_ID]
            delete settings.providers[EINO_AGENT_CUSTOM_ID]
          }
          const migrateProviderRef = (obj: { provider?: string } | undefined) => {
            if (obj?.provider === EINO_AGENT_CUSTOM_ID) obj.provider = EINO_AGENT_SYSTEM_ID
          }
          migrateProviderRef(settings.threadNamingModel)
          migrateProviderRef(settings.searchTermConstructionModel)
          migrateProviderRef(settings.ocrModel)

          // Initialize EinoAgent default settings if not yet configured
          if (!settings.providers?.[EINO_AGENT_SYSTEM_ID]?.apiKey) {
            settings.providers = {
              ...settings.providers,
              [EINO_AGENT_SYSTEM_ID]: {
                ...settings.providers?.[EINO_AGENT_SYSTEM_ID],
                apiKey: '123',
                apiHost: 'http://21.6.137.176:8080',
                apiPath: '/responses',
                models: [
                  { modelId: 'master' },
                  { modelId: 'market' },
                ],
              },
            }
          }

          // Set EinoAgent master as default chat model if none configured
          if (!settings.defaultChatModel?.provider) {
            settings.defaultChatModel = {
              provider: EINO_AGENT_SYSTEM_ID,
              model: 'master',
            }
          }

          return SettingsSchema.parse(settings)
        },
        skipHydration: true,
      }
    )
  )
)

let _initSettingsStorePromise: Promise<Settings> | undefined
export const initSettingsStore = async () => {
  if (!_initSettingsStorePromise) {
    _initSettingsStorePromise = new Promise<Settings>((resolve) => {
      const unsub = settingsStore.persist.onFinishHydration((val) => {
        const providers = val?.providers
        const providersCount =
          providers && typeof providers === 'object' && !Array.isArray(providers) ? Object.keys(providers).length : 0
        if (providersCount === 0) {
          log.info(`[CONFIG_DEBUG] onFinishHydration: providersCount=0`)
        }
        unsub()
        resolve(val)
      })
      settingsStore.persist.rehydrate()
    })
  }

  return await _initSettingsStorePromise
}

settingsStore.subscribe((state, prevState) => {
  // 如果快捷键配置发生变化，需要重新注册快捷键
  if (state.shortcuts !== prevState.shortcuts) {
    platform.ensureShortcutConfig(state.shortcuts)
  }
  // 如果代理配置发生变化，需要重新注册代理
  if (state.proxy !== prevState.proxy) {
    platform.ensureProxyConfig({ proxy: state.proxy })
  }
  // 如果开机自启动配置发生变化，需要重新设置开机自启动
  if (Boolean(state.autoLaunch) !== Boolean(prevState.autoLaunch)) {
    platform.ensureAutoLaunch(state.autoLaunch)
  }
})

export function useSettingsStore<U>(selector: Parameters<typeof useStore<typeof settingsStore, U>>[1]) {
  return useStore<typeof settingsStore, U>(settingsStore, selector)
}

export const useLanguage = () => useSettingsStore((state) => state.language)
export const useTheme = () => useSettingsStore((state) => state.theme)
export const useMcpSettings = () => useSettingsStore((state) => state.mcp)

export const useProviderSettings = (providerId: string) => {
  const providers = useSettingsStore((state) => state.providers)

  const providerSettings = providers?.[providerId]

  const setProviderSettings = (
    val: Partial<ProviderSettings> | ((prev: ProviderSettings | undefined) => Partial<ProviderSettings>)
  ) => {
    settingsStore.setState((currentSettings) => {
      const currentProviderSettings = currentSettings.providers?.[providerId] || {}
      const newProviderSettings = typeof val === 'function' ? val(currentProviderSettings) : val

      return {
        providers: {
          ...(currentSettings.providers || {}),
          [providerId]: {
            ...currentProviderSettings,
            ...newProviderSettings,
          },
        },
      }
    })
  }

  return {
    providerSettings,
    setProviderSettings,
  }
}
