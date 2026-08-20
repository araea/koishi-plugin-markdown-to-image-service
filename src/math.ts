import katex from 'katex'

type MarkdownItInstance = import('markdown-it').MarkdownIt

export interface MathOptions {
  /** KaTeX 渲染出错时是否抛出异常（默认 false，出错时回退显示源码）。 */
  throwOnError?: boolean
  /** KaTeX 报错文字颜色。 */
  errorColor?: string
  /** KaTeX strict 模式，用于放宽语法限制。 */
  strict?: boolean | string
  /** 自定义宏。 */
  macros?: Record<string, string>
}

const escapeHtml = (str: string) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

function render(tex: string, displayMode: boolean, opts: MathOptions): string {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: opts.throwOnError ?? false,
      errorColor: opts.errorColor ?? '#cc0000',
      strict: (opts.strict ?? false) as any,
      macros: (opts.macros ?? {}) as any,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return `<span class="katex-error" data-error="${escapeHtml(msg)}">${escapeHtml(tex)}</span>`
  }
}

/**
 * 判断 `$` 是否可作为合法的开/闭分隔符。
 * 参考 markdown-it-katex 的判定逻辑：开分隔符后不能紧跟空白，
 * 闭分隔符前不能是空白、后不能紧跟数字，避免误伤货币符号。
 */
function isValidDollar(state: any, pos: number) {
  const max = state.posMax
  let canOpen = true
  let canClose = true

  const prev = pos > 0 ? state.src.charCodeAt(pos - 1) : -1
  const next = pos + 1 <= max ? state.src.charCodeAt(pos + 1) : -1

  if (prev === 0x20 || prev === 0x09 || (next >= 0x30 && next <= 0x39)) {
    canClose = false
  }
  if (next === 0x20 || next === 0x09) {
    canOpen = false
  }
  return { canOpen, canClose }
}

/** 行内公式 `$...$` */
function mathInline(state: any, silent: boolean): boolean {
  if (state.src.charCodeAt(state.pos) !== 0x24 /* $ */) return false
  // `$$` 交由块级规则处理
  if (state.src.charCodeAt(state.pos + 1) === 0x24) return false

  const res = isValidDollar(state, state.pos)
  if (!res.canOpen) {
    if (!silent) state.pending += '$'
    state.pos += 1
    return true
  }

  const start = state.pos + 1
  let match = start
  // 找到第一个未被反斜杠转义的 `$`
  while ((match = state.src.indexOf('$', match)) !== -1) {
    let pos = match - 1
    while (state.src[pos] === '\\') pos -= 1
    if ((match - pos) % 2 === 1) break
    match += 1
  }

  if (match === -1) {
    if (!silent) state.pending += '$'
    state.pos = start
    return true
  }

  if (match - start === 0) {
    // 空内容（`$$` 或相邻 `$`），不作为公式
    if (!silent) state.pending += '$$'
    state.pos = start + 1
    return true
  }

  const close = isValidDollar(state, match)
  if (!close.canClose) {
    if (!silent) state.pending += '$'
    state.pos = start
    return true
  }

  if (!silent) {
    const token = state.push('math_inline', 'math', 0)
    token.markup = '$'
    token.content = state.src.slice(start, match)
  }
  state.pos = match + 1
  return true
}

/** 行内公式 `\(...\)` */
function mathInlineParen(state: any, silent: boolean): boolean {
  if (state.src.charCodeAt(state.pos) !== 0x5c /* \ */) return false
  if (state.src.charCodeAt(state.pos + 1) !== 0x28 /* ( */) return false

  const start = state.pos + 2
  const end = state.src.indexOf('\\)', start)
  if (end === -1) return false

  const content = state.src.slice(start, end)
  if (!content.trim()) return false

  if (!silent) {
    const token = state.push('math_inline', 'math', 0)
    token.markup = '\\('
    token.content = content
  }
  state.pos = end + 2
  return true
}

/** 块级公式 `$$...$$` 与 `\[...\]` */
function mathBlock(state: any, startLine: number, endLine: number, silent: boolean): boolean {
  let pos = state.bMarks[startLine] + state.tShift[startLine]
  const max = state.eMarks[startLine]
  const lineStart = state.src.slice(pos, max)

  // 行首必须是 `$$` 或 `\[`，且不能是更深的缩进（列表嵌套时跳过）
  if (state.tShift[startLine] > state.blkIndent) return false

  // --- `$$...$$` ---
  if (lineStart.startsWith('$$')) {
    if (silent) return true

    pos += 2
    let firstLine = state.src.slice(pos, max)
    let found = false
    if (firstLine.trim().endsWith('$$')) {
      firstLine = firstLine.trim().slice(0, -2)
      found = true
    }

    let lastLine = ''
    let next = startLine
    while (!found) {
      next += 1
      if (next >= endLine) break
      pos = state.bMarks[next] + state.tShift[next]
      const nMax = state.eMarks[next]
      if (pos < nMax && state.tShift[next] < state.blkIndent) break
      const lineText = state.src.slice(pos, nMax)
      if (lineText.trim().endsWith('$$')) {
        const lastPos = state.src.slice(0, nMax).lastIndexOf('$$')
        lastLine = state.src.slice(pos, lastPos)
        found = true
      }
    }

    state.line = next + 1
    const token = state.push('math_block', 'math', 0)
    token.block = true
    token.content =
      (firstLine && firstLine.trim() ? firstLine + '\n' : '') +
      state.getLines(startLine + 1, next, state.tShift[startLine], true) +
      (lastLine && lastLine.trim() ? lastLine : '')
    token.map = [startLine, state.line]
    token.markup = '$$'
    return true
  }

  // --- `\[...\]` ---
  if (lineStart.startsWith('\\[')) {
    const openPos = state.bMarks[startLine] + state.tShift[startLine]
    const closePos = state.src.indexOf('\\]', openPos + 2)
    if (closePos === -1) return false
    if (silent) return true

    // 计算闭合 `\]` 所在的行号
    let closeLine = startLine
    for (let l = startLine; l < endLine; l++) {
      if (state.bMarks[l] <= closePos && closePos <= state.eMarks[l]) {
        closeLine = l
        break
      }
    }

    const content = state.src.slice(openPos + 2, closePos)
    state.line = closeLine + 1
    const token = state.push('math_block', 'math', 0)
    token.block = true
    token.content = content.trim()
    token.map = [startLine, state.line]
    token.markup = '\\['
    return true
  }

  return false
}

/**
 * 基于现代 KaTeX 的 markdown-it 数学插件。
 *
 * 相比 markdown-it-katex（依赖陈旧的 katex@0.6），本插件：
 * - 使用 katex@0.16，公式渲染与对齐更完善；
 * - 块级公式不再被错误地包裹进 `<p>`，直接输出 `katex-display`；
 * - 额外支持 `\(...\)` 与 `\[...\]` 分隔符；
 * - 渲染失败时回退显示公式源码，而不是输出破碎的 HTML。
 */
export function mathPlugin(md: MarkdownItInstance, opts: MathOptions = {}): void {
  md.inline.ruler.after('escape', 'math_inline', mathInline)
  md.inline.ruler.after('math_inline', 'math_inline_paren', mathInlineParen)
  md.block.ruler.after('blockquote', 'math_block', mathBlock, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })

  md.renderer.rules.math_inline = (tokens, idx) =>
    render(tokens[idx].content, false, opts)
  md.renderer.rules.math_block = (tokens, idx) =>
    render(tokens[idx].content, true, opts)
}
