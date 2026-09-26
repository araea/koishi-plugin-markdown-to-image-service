export interface ThemeSettings { pageTheme: 'light' | 'dark'; codeTheme: string; mermaidTheme: string }
const light: ThemeSettings = { pageTheme:'light',codeTheme:'m3',mermaidTheme:'base' }
const dark: ThemeSettings = { pageTheme:'dark',codeTheme:'m3',mermaidTheme:'base' }
export const themePresets: Record<string, ThemeSettings> = { 'm3-light':light, 'm3-dark':dark }
export type ThemePreset = keyof typeof themePresets
export type ThemeConfig = { mode:'preset'; preset:ThemePreset } | { mode:'custom'; custom:ThemeSettings }
export function resolveTheme(config: ThemeConfig): ThemeSettings {
 if(config.mode === 'custom') return config.custom.pageTheme === 'dark' ? dark : light
 return themePresets[config.preset] ?? (/dark|monokai|vs2015|tokyo/.test(config.preset) ? dark : light)
}
