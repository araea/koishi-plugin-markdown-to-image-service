import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const nodeRequire = createRequire(__filename)

const FONT_MIME: Record<string, string> = {
  woff2: 'font/woff2',
  woff: 'font/woff',
  ttf: 'font/ttf',
  otf: 'font/otf',
}

/**
 * 定位某个 npm 包在磁盘上的根目录。
 * 优先解析 `pkg/package.json`，失败时回退到解析主入口后向上查找。
 */
export function pkgRoot(pkg: string): string {
  try {
    return dirname(nodeRequire.resolve(`${pkg}/package.json`))
  } catch {
    /* fall through */
  }
  try {
    let dir = dirname(nodeRequire.resolve(pkg))
    for (let i = 0; i < 6; i++) {
      if (existsSync(join(dir, 'package.json'))) return dir
      dir = dirname(dir)
    }
  } catch {
    /* fall through */
  }
  throw new Error(`[markdown-to-image] 无法定位依赖包 "${pkg}"，请确认已正确安装。`)
}

function readCached(cache: Map<string, string>, key: string, loader: () => string): string {
  if (cache.has(key)) return cache.get(key)!
  const value = loader()
  cache.set(key, value)
  return value
}

const katexCssCache = new Map<string, string>()

/**
 * 读取 KaTeX 样式，并将引用的字体以 base64 内联，实现完全离线、无 CDN 依赖。
 * KaTeX 的 CSS 通过 `url(fonts/...)` 引用字体，这里逐一替换为 data URI。
 */
export function katexCss(): string {
  return readCached(katexCssCache, 'katex', () => {
    const root = pkgRoot('katex')
    const cssPath = join(root, 'dist', 'katex.min.css')
    let css = readFileSync(cssPath, 'utf8')
    const fontsDir = join(root, 'dist', 'fonts')
    css = css.replace(/url\(fonts\/([^)]+)\)/g, (_: string, file: string) => {
      const fontPath = join(fontsDir, file)
      if (!existsSync(fontPath)) return `url(fonts/${file})`
      const ext = file.split('.').pop()!.toLowerCase()
      const mime = FONT_MIME[ext] ?? 'application/octet-stream'
      const data = readFileSync(fontPath)
      return `url(data:${mime};base64,${data.toString('base64')})`
    })
    return css
  })
}

const hljsCssCache = new Map<string, string>()

/** 读取 highlight.js 主题样式（找不到时回退到 github.css）。 */
export function highlightCss(theme: string): string {
  return readCached(hljsCssCache, theme, () => {
    const root = pkgRoot('highlight.js')
    const stylesDir = join(root, 'styles')
    const candidates = [
      `${theme}.min.css`,
      `${theme}.css`,
      'github.min.css',
      'github.css',
    ]
    for (const name of candidates) {
      const p = join(stylesDir, name)
      if (existsSync(p)) return readFileSync(p, 'utf8')
    }
    throw new Error(`[markdown-to-image] 找不到 highlight.js 主题 "${theme}"`)
  })
}

const mermaidCache = new Map<string, string>()

/**
 * 读取 mermaid 的 UMD 构建产物，用于在页面内离线渲染 mermaid 图表。
 * 仅当 markdown 中存在 mermaid 代码块时才调用。
 */
export function mermaidJs(): string {
  return readCached(mermaidCache, 'mermaid', () => {
    const root = pkgRoot('mermaid')
    const candidates = [
      join(root, 'dist', 'mermaid.min.js'),
      join(root, 'dist', 'mermaid.js'),
    ]
    for (const p of candidates) {
      if (existsSync(p)) return readFileSync(p, 'utf8')
    }
    throw new Error('[markdown-to-image] 找不到 mermaid 的 UMD 构建产物 (dist/mermaid.min.js)')
  })
}
