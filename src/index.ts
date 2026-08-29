import { Context, h, Schema, Service } from 'koishi'
import {} from 'koishi-plugin-puppeteer'

import { createMarkdown, renderMarkdown } from './markdown'

type MarkdownItInstance = import('markdown-it').MarkdownIt
import { katexCss, highlightCss, mermaidJs } from './assets'
import { baseCss } from './styles'
import { resolveTheme, ThemeConfig, ThemeSettings, themePresets } from './theme'

export const inject = ['puppeteer']

export const name = 'markdown-to-image-service'

export const usage = `## 命令

### \`markdownToImage [markdownText:text]\`

将 Markdown 文本转换为图片。

- **用法 1**：\`markdownToImage # Hello World\`
- **用法 2**：直接输入 \`markdownToImage\`，根据提示输入 Markdown 内容。

支持：LaTeX 公式（行内 \`$...$\` 与块级 \`$$...$$\`、\`\\(...\\)\`、\`\\[...\\]\`）、Mermaid 图表、代码高亮、表格、任务列表、脚注、上下标、定义列表、emoji、自定义容器（\`:::note / :::tip / :::warning / :::danger\`）等。

所有样式与字体均已本地化内联，**无需任何 CDN / 网络**，彻底避免因资源加载失败导致的公式错位、样式丢失等问题。

## 服务

本插件提供 \`markdownToImage\` 服务，供其他插件调用。

\`\`\`typescript
ctx.markdownToImage.convertToImage(markdownText: string): Promise<Buffer>
\`\`\`

### 示例

\`\`\`typescript
import { Context, h } from 'koishi'
import {} from 'koishi-plugin-markdown-to-image-service'

export const inject = {
  required: ['markdownToImage'],
}

export function apply(ctx: Context) {
  ctx.command('test-md', '测试 Markdown 图片转换')
    .action(async () => {
      const markdown = \`
# Hello, Koishi

行内公式 $E=mc^2$，块级公式：

$$\\int_{-\\\\infty}^{\\\\infty} e^{-x^2} dx = \\\\sqrt{\\\\pi}$$

- 代码：
  \\\`\\\`\\\`typescript
  console.log('Hello, world!')
  \\\`\\\`\\\`
- 表格：

| 名称 | 值 |
| ---- | -- |
| 甲   | 1  |
| 乙   | 2  |

\\\`\\\`\\\`mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
\\\`\\\`\\\`
\`
      const imageBuffer = await ctx.markdownToImage.convertToImage(markdown)
      return h.image(imageBuffer, 'image/png')
    })
}
\`\`\`
`

export interface RenderingConfig {
  /** 初始视口宽度（图片内容宽度）。 */
  width: number
  /** 内容过宽时的最大宽度上限。 */
  maxWidth: number
  /** 设备缩放比率，建议 2 以获得高清图片。 */
  deviceScaleFactor: number
  /** 图片输出格式。 */
  imageFormat: 'png' | 'jpeg' | 'webp'
  /** jpeg/webp 质量（1-100）。 */
  imageQuality: number
  /** 内容内边距（像素）。 */
  padding: number
}

export interface Config {
  rendering: RenderingConfig
  theme: ThemeConfig
}

const MERMAID_THEMES = ['default', 'base', 'forest', 'dark', 'neutral']

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    rendering: Schema.object({
      width: Schema.number()
        .min(200)
        .max(4000)
        .default(800)
        .description('图片内容宽度（像素）。'),
      maxWidth: Schema.number()
        .min(200)
        .max(6000)
        .default(2000)
        .description('内容过宽时（如超宽表格/代码）图片宽度的上限。'),
      deviceScaleFactor: Schema.number()
        .min(1)
        .max(4)
        .default(2)
        .description('设备缩放比率，建议 2 以获得更清晰的图片。'),
      imageFormat: Schema.union(['png', 'jpeg', 'webp'])
        .default('png')
        .description('图片输出格式。'),
      imageQuality: Schema.number()
        .min(1)
        .max(100)
        .default(90)
        .description('jpeg/webp 图片质量（1-100，png 忽略此项）。'),
      padding: Schema.number()
        .min(0)
        .max(200)
        .default(32)
        .description('内容四周的内边距（像素）。'),
    }).description('渲染设置'),
  }),
  Schema.object({
    theme: Schema.union([
      Schema.object({
        mode: Schema.const('preset').default('preset'),
        preset: Schema.union(Object.keys(themePresets))
          .default('github-dark')
          .description('选择一个开箱即用的主题预设。'),
      }).description('预设主题'),
      Schema.object({
        mode: Schema.const('custom'),
        custom: Schema.object({
          pageTheme: Schema.union(['light', 'dark'])
            .default('dark')
            .description('整体页面主题。'),
          codeTheme: Schema.string()
            .default('github-dark')
            .description(
              '代码高亮主题，请使用 highlight.js 主题名（如 github、github-dark、atom-one-dark、monokai）。'
            ),
          mermaidTheme: Schema.union(MERMAID_THEMES)
            .default('dark')
            .description('Mermaid 图表主题。'),
        }),
      }).description('自定义主题'),
    ])
      .description('主题配置')
      .default({ mode: 'preset', preset: 'github-dark' }),
  }),
]) satisfies Schema<Config>

declare module 'koishi' {
  interface Context {
    markdownToImage: MarkdownToImageService
  }
}

class MarkdownToImageService extends Service {
  override readonly config: Config = {} as Config
  private md: MarkdownItInstance

  constructor(ctx: Context, config: Config) {
    super(ctx, 'markdownToImage', true)
    this.config = config
    this.md = createMarkdown()
  }

  private getTheme(): ThemeSettings {
    return resolveTheme(this.config.theme)
  }

  /** 生成自包含、可离线渲染的完整 HTML。 */
  buildHtml(body: string, hasMermaid: boolean): string {
    const theme = this.getTheme()
    const padding = this.config.rendering.padding

    const styles = [
      `<style>${katexCss()}</style>`,
      `<style>${highlightCss(theme.codeTheme)}</style>`,
      `<style>${baseCss()}</style>`,
    ].join('\n')

    const mermaidBlock = hasMermaid
      ? `<script>${mermaidJs()}</script>
<script>
window.mermaid.initialize({
  startOnLoad: false,
  theme: ${JSON.stringify(theme.mermaidTheme)},
  securityLevel: 'loose',
  flowchart: { useMaxWidth: true },
});
</script>`
      : ''

    return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="${theme.pageTheme}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Markdown Render</title>
${styles}
</head>
<body>
<div class="markdown-body" style="padding:${padding}px;">
${body}
</div>
${mermaidBlock}
</body>
</html>`
  }

  /** 将 Markdown 文本渲染为完整 HTML（供调试或二次处理）。 */
  render(markdownText: string): string {
    const { html, hasMermaid } = renderMarkdown(this.md, markdownText)
    return this.buildHtml(html, hasMermaid)
  }

  async convertToImage(
    markdownText: string,
    options?: Partial<RenderingConfig>
  ): Promise<Buffer> {
    const cfg = { ...this.config.rendering, ...options }
    const theme = this.getTheme()

    const { html, hasMermaid } = renderMarkdown(this.md, markdownText)
    const fullHtml = this.buildHtml(html, hasMermaid)

    const page = await this.ctx.puppeteer.page()
    try {
      const viewport = { width: cfg.width, height: 800, deviceScaleFactor: cfg.deviceScaleFactor }
      await page.setViewport(viewport)
      await page.emulateMediaFeatures([
        { name: 'prefers-color-scheme', value: theme.pageTheme },
      ])

      await page.setContent(fullHtml, { waitUntil: 'load' })

      // 等待字体（内联 KaTeX 字体）加载完成，避免公式错位
      await page.evaluate(async () => {
        try {
          await (document as any).fonts?.ready
        } catch {
          /* ignore */
        }
      })

      // 渲染 mermaid 图表并等待完成
      if (hasMermaid) {
        await this.runMermaid(page)
        await page.evaluate(() => new Promise((r) => setTimeout(r, 30)))
      }

      // 自适应宽度：内容比视口宽时扩展视口，避免横向裁剪
      let currentWidth = cfg.width
      const maxWidth = Math.max(cfg.width, cfg.maxWidth)
      for (let i = 0; i < 6; i++) {
        const scrollWidth = await page.evaluate(() =>
          Math.max(
            document.documentElement.scrollWidth,
            document.body ? document.body.scrollWidth : 0
          )
        )
        if (scrollWidth <= currentWidth + 1 || currentWidth >= maxWidth) break
        currentWidth = Math.min(scrollWidth, maxWidth)
        await page.setViewport({
          width: currentWidth,
          height: 800,
          deviceScaleFactor: cfg.deviceScaleFactor,
        })
        await page.evaluate(() => new Promise((r) => setTimeout(r, 20)))
      }

      const imageBuffer = await page.screenshot({
        fullPage: true,
        type: cfg.imageFormat,
        quality: cfg.imageFormat === 'png' ? undefined : cfg.imageQuality,
        omitBackground: false,
      })
      return imageBuffer
    } catch (error) {
      this.logger.error('Markdown 转图片失败:', error)
      throw error
    } finally {
      await page.close()
    }
  }

  private async runMermaid(page: any): Promise<void> {
    await page.evaluate(() => {
      const mermaid = (window as any).mermaid
      if (!mermaid) return
      const nodes = Array.from(document.querySelectorAll('.mermaid'))
      return Promise.all(
        nodes.map(async (node: Element) => {
          try {
            const { svg } = await mermaid.render(
              `mmd-${Math.random().toString(36).slice(2)}`,
              node.textContent || ''
            )
            node.innerHTML = svg
          } catch (err: any) {
            node.innerHTML = `<pre class="katex-error">Mermaid 渲染失败: ${String(
              err?.message ?? err
            ).replace(/</g, '&lt;')}</pre>`
          }
        })
      )
    })
  }
}

export async function apply(ctx: Context, config: Config) {
  ctx.plugin(MarkdownToImageService, config)

  ctx
    .command('markdownToImage [markdownText:text]', '将 Markdown 文本转换为图片')
    .action(async ({ session }, markdownText) => {
      if (!markdownText) {
        await session.send('⚠️ 请输入要转换的 Markdown 文本：')
        markdownText = await session.prompt()
        if (!markdownText) return '⚠️ 输入超时。'
      }

      try {
        const imageBuffer = await ctx.markdownToImage.convertToImage(markdownText)
        return h.image(imageBuffer, `image/${config.rendering.imageFormat}`)
      } catch (e) {
        ctx.logger('markdown-to-image').warn(e)
        return '❌ 图片生成失败，请检查日志。'
      }
    })

  ctx
    .command('test-md', '测试 Markdown 图片转换')
    .action(async () => {
      const markdown = [
        '# Markdown 渲染测试',
        '',
        '这是一段**加粗**、*斜体*、~~删除线~~、`行内代码` 与 [链接](https://koishi.chat) 的文本。',
        '',
        '## 公式',
        '',
        '行内公式 $E=mc^2$ 与 $\\int_0^1 x^2 dx$。',
        '',
        '块级公式：',
        '',
        '$$\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}$$',
        '',
        '对齐方程组：',
        '',
        '$$\\begin{aligned}',
        'a &= b + c \\\\',
        'd &= e - f',
        '\\end{aligned}$$',
        '',
        '## 代码',
        '',
        '```typescript',
        "function greet(name: string): string {",
        "  return `Hello, ${name}!`",
        '}',
        '```',
        '',
        '## 表格',
        '',
        '| 名称 | 值 | 说明 |',
        '| ---- | -- | ---- |',
        '| 甲   | 1  | 第一 |',
        '| 乙   | 2  | 第二 |',
        '',
        '## 列表',
        '',
        '- [x] 已完成事项',
        '- [ ] 待办事项',
        '',
        '## 引用与容器',
        '',
        '> 这是一段引用。',
        '',
        ':::tip 提示',
        '这是一个提示容器。',
        ':::',
        '',
        '## Mermaid',
        '',
        '```mermaid',
        'graph TD;',
        '    A-->B;',
        '    A-->C;',
        '    B-->D;',
        '    C-->D;',
        '```',
        '',
      ].join('\n')

      const imageBuffer = await ctx.markdownToImage.convertToImage(markdown)
      return h.image(imageBuffer, `image/${config.rendering.imageFormat}`)
    })
}
