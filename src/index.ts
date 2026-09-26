import { scheme, FONT_STACK } from './m3'
import { usePresentation, promptInput } from './ux'
import { Context, h, Schema, Service } from 'koishi'
import {} from 'koishi-plugin-puppeteer'

import { createMarkdown, renderMarkdown } from './markdown'

type MarkdownItInstance = import('markdown-it').MarkdownIt
import { katexCss, mermaidJs } from './assets'
import { baseCss } from './styles'
import { resolveTheme, ThemeConfig, ThemeSettings, themePresets } from './theme'

export const inject = {
  required: ['puppeteer'],
}

export const name = 'markdown-to-image-service'

export const usage = `## 使用

发送「mdimg」加一段 Markdown，得到一张图片；不带文本时会等你补发。

## 指令

| 指令 | 说明 |
| --- | --- |
| \`mdimg [文本]\` | Markdown 转图片 |

## 服务

\`\`\`typescript
ctx.markdownToImage.convertToImage(markdownText: string): Promise<Buffer>
\`\`\``

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
        preset: Schema.string()
          .default('m3-light')
          .description('M3 明色 m3-light 或暗色 m3-dark；旧主题名自动迁移。'),
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
              '兼容旧配置；语法颜色始终跟随 M3 页面主题。'
            ),
          mermaidTheme: Schema.union(MERMAID_THEMES)
            .default('dark')
            .description('兼容旧配置；图表颜色始终跟随 M3 页面主题。'),
        }),
      }).description('自定义主题'),
    ])
      .description('主题配置')
      .default({ mode: 'preset', preset: 'm3-light' }),
  }),
]) satisfies Schema<Config>

declare module 'koishi' {
  interface Context {
    markdownToImage: MarkdownToImageService
  }
}

export class MarkdownToImageService extends Service {
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
      `<style>${baseCss()}</style>`,
    ].join('\n')

    const mermaidBlock = hasMermaid
      ? `<script>${mermaidJs()}</script>
<script>
window.mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: ${JSON.stringify((() => { const c = scheme(258, theme.pageTheme === 'dark'); return { darkMode:theme.pageTheme==='dark', fontFamily:FONT_STACK, primaryColor:c.primaryContainer, primaryTextColor:c.onPrimaryContainer, primaryBorderColor:c.outline, lineColor:c.onSurfaceVariant, secondaryColor:c.secondaryContainer, tertiaryColor:c.tertiaryContainer, background:c.surface, mainBkg:c.surfaceContainer, nodeTextColor:c.onSurface, textColor:c.onSurface, edgeLabelBackground:c.surface }; })())},
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
  const presentation = usePresentation(ctx, 'mdimg')
  ctx.plugin(MarkdownToImageService, config)

  ctx
    .command('mdimg [markdownText:text]', 'Markdown 转图片')
    .alias('markdownToImage')
    .action(async ({ session }, markdownText) => {
      if (!markdownText) {
        await session.send('💡 发送要转换的 Markdown 文本，或发送「取消」。')
        markdownText = await promptInput(session, '继续当前操作。')
        if (!markdownText) return '⏳ 没有等到有效输入，这次先作罢。'
        if (markdownText.trim() === '取消') return '✅ 已取消。'
      }

      if (presentation.textOnly(session)) return h.text(markdownText)
      try {
        const imageBuffer = await ctx.markdownToImage.convertToImage(markdownText)
        return presentation.present(session, h.image(imageBuffer, `image/${config.rendering.imageFormat}`), h.text(markdownText))
      } catch (e) {
        ctx.logger('markdown-to-image').warn(e)
        return h.text(`图片暂时无法生成，可稍后重试。\n${markdownText}`)
      }
    })
}
