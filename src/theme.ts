export interface ThemeSettings {
  /** 页面明暗主题。 */
  pageTheme: 'light' | 'dark'
  /** highlight.js 主题名（对应 styles/<name>.css）。 */
  codeTheme: string
  /** mermaid 图表主题。 */
  mermaidTheme: string
}

export const themePresets: Record<string, ThemeSettings> = {
  'github-light': {
    pageTheme: 'light',
    codeTheme: 'github',
    mermaidTheme: 'default',
  },
  'github-dark': {
    pageTheme: 'dark',
    codeTheme: 'github-dark',
    mermaidTheme: 'dark',
  },
  'atom-one-light': {
    pageTheme: 'light',
    codeTheme: 'atom-one-light',
    mermaidTheme: 'default',
  },
  'atom-one-dark': {
    pageTheme: 'dark',
    codeTheme: 'atom-one-dark',
    mermaidTheme: 'dark',
  },
  monokai: {
    pageTheme: 'dark',
    codeTheme: 'monokai',
    mermaidTheme: 'dark',
  },
  vs2015: {
    pageTheme: 'dark',
    codeTheme: 'vs2015',
    mermaidTheme: 'dark',
  },
  'tokyo-night': {
    pageTheme: 'dark',
    codeTheme: 'tokyo-night-dark',
    mermaidTheme: 'dark',
  },
} as const

export type ThemePreset = keyof typeof themePresets

export type ThemeConfig =
  | { mode: 'preset'; preset: ThemePreset }
  | { mode: 'custom'; custom: ThemeSettings }

export function resolveTheme(config: ThemeConfig): ThemeSettings {
  if (config.mode === 'custom') return config.custom
  return themePresets[config.preset] ?? themePresets['github-light']
}
