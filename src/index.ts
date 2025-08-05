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

interface ThemeSettings {
  pageTheme: "light" | "dark";
  codeTheme: string;
  mermaidTheme: "default" | "dark" | "forest" | "neutral";
}

const themePresets: Record<string, ThemeSettings> = {
  "github-light": {
    pageTheme: "light",
    codeTheme: "github",
    mermaidTheme: "default",
  },
  "github-dark": {
    pageTheme: "dark",
    codeTheme: "github-dark",
    mermaidTheme: "dark",
  },
  "atom-one-dark": {
    pageTheme: "dark",
    codeTheme: "atom-one-dark",
    mermaidTheme: "dark",
  },
  dracula: {
    pageTheme: "dark",
    codeTheme: "dracula",
    mermaidTheme: "dark",
  },
  "solarized-light": {
    pageTheme: "light",
    codeTheme: "solarized-light",
    mermaidTheme: "default",
  },
  nord: {
    pageTheme: "dark",
    codeTheme: "nord",
    mermaidTheme: "dark",
  },
};

export interface Config {
  width: number;
  height: number;
  deviceScaleFactor: number;
  defaultImageFormat: "png" | "jpeg" | "webp";
  waitUntil: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
  themePreset: string;
  pageTheme: "light" | "dark";
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
  // 主题配置部分
  themePreset: Schema.union([...Object.keys(themePresets), "custom"])
    .default("github-dark")
    .description("选择一个预设主题组合。选择 `custom` 可进行自定义搭配。"),

  // 将原 customTheme 内的配置项移到此处，并使用 role('hidden') 控制显隐
  pageTheme: Schema.union(["light", "dark"])
    .default("dark")
    .description("【自定义】整体页面的主题风格。")
    .role("hidden", (config) => config.themePreset !== "custom"),

  codeTheme: Schema.string()
    .default("github-dark")
    .description(
      "【自定义】代码高亮主题。请使用 [highlight.js 的主题名](https://github.com/highlightjs/highlight.js/tree/main/src/styles)，例如 `github-dark`。"
    )
    .role("hidden", (config) => config.themePreset !== "custom"),
    
  mermaidTheme: Schema.union(["default", "dark", "forest", "neutral"])
    .default("dark")
    .description("【自定义】Mermaid 图表的主题。")
    .role("hidden", (config) => config.themePreset !== "custom"),
});


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

  private getThemeSettings(): ThemeSettings {
    const { themePreset, pageTheme, codeTheme, mermaidTheme } = this.config;

    if (themePreset !== "custom") {
      return themePresets[themePreset] || themePresets["github-dark"];
    }

    return { pageTheme, codeTheme, mermaidTheme };
  }

  private buildHtml(body: string): string {
    const { pageTheme, codeTheme, mermaidTheme } = this.getThemeSettings();
    return `
      <!DOCTYPE html>
      <html lang="en" data-color-mode="${pageTheme}" data-light-theme="light" data-dark-theme="dark">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Markdown Render</title>
        <!-- KaTeX CSS -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <!-- Highlight.js CSS (使用解析出的 codeTheme) -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/${codeTheme}.min.css">
        <!-- 主题 CSS (github-markdown-css) -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.1/github-markdown.min.css">
        <style>
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
          // 初始化 Mermaid (使用解析出的 mermaidTheme)
          mermaid.initialize({ startOnLoad: true, theme: '${mermaidTheme}' });
        </script>
      </body>
      </html>
    `;
  }

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
        const imageBuffer = await ctx.markdownToImage.convertToImage(
          markdownText
        );
        return h.image(imageBuffer, `image/${config.defaultImageFormat}`);
      } catch (e) {
        ctx.logger("markdownToImage").warn(e);
        return "图片生成失败，请检查日志。";
      }
    });

  ctx
    .command("test-md", "测试 Markdown 图片转换")
    .action(async ({ session }) => {
      const markdown = `
# Hello, Koishi

This is a test.

- LaTeX: $E=mc^2$
- Code:
  \`\`\`typescript
  console.log('Hello, world!')
  \`\`\`
- Mermaid:
  \`\`\`mermaid
  graph TD;
      A-->B;
      A-->C;
      B-->D;
      C-->D;
  \`\`\`
`;
      const imageBuffer = await ctx.markdownToImage.convertToImage(markdown);
      return h.image(imageBuffer, "image/png");
    });
}