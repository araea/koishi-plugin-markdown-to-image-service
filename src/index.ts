import { Context, h, Schema, Service } from "koishi";
import {} from "koishi-plugin-puppeteer";

import MarkdownIt from "markdown-it";
import katex from "markdown-it-katex";
import hljs from "markdown-it-highlightjs";

export const inject = {
  required: ["puppeteer"],
  optional: ["markdownToImage"],
};
export const name = "markdown-to-image-service";
export const usage = `## 命令

### \`markdownToImage [markdownText:text]\`

将 Markdown 文本转换为图片。

- **用法 1**：\`markdownToImage # Hello World\`
- **用法 2**：直接输入 \`markdownToImage\`，根据提示输入 Markdown 内容。

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
    .action(async ({ session }) => {
      const markdown = \`
# Hello, Koishi

This is a test.

- LaTeX: $E=mc^2$
- Code:
  \\\`\\\`\\\`typescript
  console.log('Hello, world!')
  \\\`\\\`\\\`
- Mermaid:
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

## QQ 群

- \`956758505\`
`;

export interface Config {
  width: number;
  height: number;
  deviceScaleFactor: number;
  defaultImageFormat: "png" | "jpeg" | "webp";
  waitUntil: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
  theme: "light" | "dark";
  codeTheme: string;
  mermaidTheme: "default" | "dark" | "forest" | "neutral";
}

export const Config: Schema<Config> = Schema.object({
  width: Schema.number().default(800).description(`截图视口的宽度。`),
  height: Schema.number()
    .default(100)
    .description(`截图视口的初始高度（会自动撑开）。`),
  deviceScaleFactor: Schema.number()
    .default(2)
    .description(`设备的缩放比率，建议为 2 以获得更清晰的图片。`),
  defaultImageFormat: Schema.union(["png", "jpeg", "webp"])
    .default("png")
    .description("默认的图片输出格式。"),
  waitUntil: Schema.union([
    "load",
    "domcontentloaded",
    "networkidle0",
    "networkidle2",
  ])
    .default("load")
    .description(
      "页面加载完成的判断条件。`networkidle0` 能确保所有资源（如CDN上的CSS和JS）都加载完毕。"
    ),
  theme: Schema.union(["light", "dark"])
    .default("light")
    .description(
      "整体页面的主题风格。我们将使用 `github-markdown-css` 作为基础样式。"
    ),
  codeTheme: Schema.string()
    .default("github-dark")
    .description(
      "代码高亮主题。请使用 [highlight.js 的主题名](https://github.com/highlightjs/highlight.js/tree/main/src/styles)，例如 `github-dark`, `atom-one-dark`。"
    ),
  mermaidTheme: Schema.union(["default", "dark", "forest", "neutral"])
    .default("default")
    .description("Mermaid 图表的主题。"),
}) as any;

declare module "koishi" {
  interface Context {
    markdownToImage: MarkdownToImageService;
  }
}

class MarkdownToImageService extends Service {
  override readonly config: Config = {} as Config;
  private browser: any = null;
  private loggerForService: any;
  private md: MarkdownIt;

  constructor(ctx: Context, config: Config) {
    super(ctx, "markdownToImage", true);
    this.config = config;
    this.loggerForService = ctx.logger("markdownToImage");

    this.md = new MarkdownIt({
      html: true, // 允许 HTML 标签
      linkify: true, // 自动转换链接
    })
      .use(katex, { throwOnError: false, errorColor: " #cc0000" })
      .use(hljs, { auto: true }) // 使用 highlight.js 进行代码高亮
      .use((md) => {
        const fence = md.renderer.rules.fence!;
        md.renderer.rules.fence = (tokens, idx, options, env, self) => {
          const token = tokens[idx];
          if (token.info.trim() === "mermaid") {
            return `<div class="mermaid">${token.content}</div>`;
          }
          return fence(tokens, idx, options, env, self);
        };
      });
  }

  private async initBrowser(): Promise<void> {
    this.ctx.inject(["puppeteer"], (ctx) => {
      this.browser = ctx.puppeteer.browser;
    });
  }

  private buildHtml(body: string): string {
    const { theme, codeTheme, mermaidTheme } = this.config;
    return `
      <!DOCTYPE html>
      <!-- 使用 'data-color-mode' 属性来正确触发 github-markdown-css 的内置主题，而不是使用 class 和 filter hack -->
      <html lang="en" data-color-mode="${theme}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Markdown Render</title>
        <!-- KaTeX CSS -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <!-- Highlight.js CSS -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/${codeTheme}.min.css">
        <!-- 主题 CSS (github-markdown-css) -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.1/github-markdown.min.css">
        <style>
          /* 移除了所有主题覆盖的 CSS (如 filter 和 body background)。
             现在完全依赖 github-markdown-css 根据 data-color-mode 来设置主题。
             这能确保 light/dark 模式下背景和文字颜色都正确。*/
          .markdown-body {
            box-sizing: border-box;
            min-width: 200px;
            max-width: 980px;
            margin: 0 auto;
            padding: 45px;
          }
        </style>
      </head>
      <body class="markdown-body">
        ${body}
        
        <!-- Mermaid JS -->
        <script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js"></script>
        <script>
          // 初始化 Mermaid
          // 当主主题为 dark 时，优先使用 mermaid 的 dark 主题以保证样式统一。
          mermaid.initialize({ startOnLoad: true, theme: '${
            theme === "dark" ? "dark" : mermaidTheme
          }' });
        </script>
      </body>
      </html>
    `;
  }

  // 调整截图选项以包含背景色
  async convertToImage(markdownText: string): Promise<Buffer> {
    if (!this.browser) {
      await this.initBrowser();
    }

    const bodyHtml = this.md.render(markdownText);
    const fullHtml = this.buildHtml(bodyHtml);

    let page;
    try {
      page = await this.browser.newPage();
      await page.setViewport({
        width: this.config.width,
        height: this.config.height,
        deviceScaleFactor: this.config.deviceScaleFactor,
      });

      await page.setContent(fullHtml, { waitUntil: this.config.waitUntil });
      await page.bringToFront();

      const imageBuffer = await page.screenshot({
        fullPage: true,
        type: this.config.defaultImageFormat,
        // 将 omitBackground 设置为 false，以便将主题的背景色（浅色或深色）包含在最终的图片中。
        // 这解决了透明背景在不同聊天客户端背景下可读性差的问题。
        omitBackground: false,
      });

      return imageBuffer;
    } catch (error) {
      this.loggerForService.error("Error converting markdown to image:", error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }
}

export async function apply(ctx: Context, config: Config) {
  // 注册服务，使其在 context 中可用 (ctx.markdownToImage)
  ctx.plugin(MarkdownToImageService, config);

  ctx
    .command(
      "markdownToImage [markdownText:text]",
      "将 Markdown 文本转换为图片"
    )
    .action(async ({ session }, markdownText) => {
      if (!markdownText) {
        await session.send("请输入你要转换的 Markdown 文本内容：");
        markdownText = await session.prompt();
        if (!markdownText) return `输入超时。`;
      }

      try {
        const imageBuffer = await ctx.markdownToImage.convertToImage(markdownText);
        return h.image(imageBuffer, `image/${config.defaultImageFormat}`);
      } catch (e) {
        ctx.logger("markdownToImage").warn(e);
        return "图片生成失败，请检查日志。";
      }
    });
}