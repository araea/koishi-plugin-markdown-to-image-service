import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

type MarkdownItInstance = import('markdown-it').MarkdownIt
import { full as emoji } from 'markdown-it-emoji'
import sub from 'markdown-it-sub'
import sup from 'markdown-it-sup'
import abbr from 'markdown-it-abbr'
import deflist from 'markdown-it-deflist'
import ins from 'markdown-it-ins'
import mark from 'markdown-it-mark'
import footnote from 'markdown-it-footnote'
import taskLists from 'markdown-it-task-lists'
import container from 'markdown-it-container'
import { mathPlugin, MathOptions } from './math'

export interface MarkdownEnv {
  hasMermaid?: boolean
  [key: string]: any
}

export interface RenderResult {
  html: string
  hasMermaid: boolean
}

const MERMAID_LANGS = new Set(['mermaid', 'mmd'])

/** 注册一个带可选标题的自定义容器（:::note / :::tip / :::warning / :::danger）。 */
function useContainer(md: MarkdownItInstance, name: string): void {
  md.use(container, name, {
    validate: (params: string) => {
      const p = params.trim()
      return p === name || p.startsWith(name + ' ')
    },
    render: (tokens: any[], idx: number) => {
      const info = tokens[idx].info.trim()
      const match = info.match(new RegExp('^' + name + '(?:\\s+(.*))?$'))
      const title = match && match[1] ? match[1].trim() : ''
      if (tokens[idx].nesting === 1) {
        const heading = title
          ? `<div class="md-container-title">${md.utils.escapeHtml(title)}</div>\n`
          : ''
        return `<div class="md-container ${name}">\n${heading}`
      }
      return '</div>\n'
    },
  })
}

export function createMarkdown(opts: { math?: MathOptions } = {}): MarkdownItInstance {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    breaks: true,
    typographer: false,
    langPrefix: 'hljs language-',
    highlight: (str: string, lang: string) => {
      const langName = (lang || '').trim().toLowerCase()
      if (MERMAID_LANGS.has(langName)) return ''
      if (langName && hljs.getLanguage(langName)) {
        try {
          return hljs.highlight(str, { language: langName, ignoreIllegals: true }).value
        } catch {
          /* fall through */
        }
      }
      if (langName) {
        try {
          return hljs.highlightAuto(str).value
        } catch {
          /* fall through */
        }
      }
      // 无语言或高亮失败：交由 markdown-it 自行转义
      return ''
    },
  })

  // 数学公式（现代 KaTeX）
  md.use(mathPlugin, opts.math ?? {})

  // 常见扩展语法
  md.use(emoji)
  md.use(sub)
  md.use(sup)
  md.use(abbr)
  md.use(deflist)
  md.use(ins)
  md.use(mark)
  md.use(footnote)
  md.use(taskLists, { enabled: true, label: true, labelAfter: true })
  useContainer(md, 'note')
  useContainer(md, 'tip')
  useContainer(md, 'warning')
  useContainer(md, 'danger')

  // mermaid 代码块：交给浏览器端 mermaid 渲染
  const defaultFence = md.renderer.rules.fence!
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const langName = (token.info || '').trim().split(/\s+/)[0].toLowerCase()
    if (MERMAID_LANGS.has(langName)) {
      ;(env as MarkdownEnv).hasMermaid = true
      return `<div class="mermaid">${md.utils.escapeHtml(token.content)}</div>\n`
    }
    return defaultFence(tokens, idx, options, env, self)
  }

  return md
}

export function renderMarkdown(md: MarkdownItInstance, src: string): RenderResult {
  const env: any = {}
  const html = md.render(src, env)
  return { html, hasMermaid: !!env.hasMermaid }
}
