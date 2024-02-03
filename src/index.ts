import {Context, h, Schema, Service} from 'koishi'
import {} from 'koishi-plugin-puppeteer'

import * as fs from "fs";
import path from "node:path";
import {promisify} from 'util';
import {Notebook} from "crossnote"
import find from 'puppeteer-finder';

export const inject = {
  required: ['puppeteer'],
}
export const name = 'markdown-to-image-service'
export const usage = `## 🌈 使用

当您在 Markdown 中引用本地图片时，务必使用**相对路径**。相对路径的根目录位于：\`./data/notebook\`。

例如，在 \`notebook\` 文件夹内有名为 \`0.png\` 的图片，那么您需要使用以下方式在 Markdown 中引用该图片：

\`\`\`markdown
![图片介绍](0.png)
\`\`\`

## 🌼 指令

- \`markdownToImage [markdownText]\`：将 Markdown 文本转换为图片。

## ☕ 服务

- \`ctx.markdownToImage.convertToImage(markdownText: string): Promise<Buffer>\`

### 🌰 示例

\`\`\`typescript
// index.ts
import { Context } from 'koishi'
import { } from 'koishi-plugin-markdown-to-image-service'

export const inject = ['markdownToImage']

export async function apply(ctx: Context) {
  const imageBuffer = await ctx.markdownToImage.convertToImage('# Hello')
  return h.image(imageBuffer, 'image/png') // 'image/png', 'image/jpeg'
}
\`\`\`
`

export interface Config {
  width: number
  height: number
  deviceScaleFactor: number
  waitUntil: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";

  enableAutoCacheClear: boolean
  enableRunAllCodeChunks: boolean;
  defaultImageFormat: "png" | "jpeg" | "webp";

  mermaidTheme: 'default' | 'dark' | 'forest';
  codeBlockTheme: "auto.css" | "default.css" | "atom-dark.css" | "atom-light.css" | "atom-material.css" | "coy.css" | "darcula.css" | "dark.css" | "funky.css" | "github.css" | "github-dark.css" | "hopscotch.css" | "monokai.css" | "okaidia.css" | "one-dark.css" | "one-light.css" | "pen-paper-coffee.css" | "pojoaque.css" | "solarized-dark.css" | "solarized-light.css" | "twilight.css" | "vue.css" | "vs.css" | "xonokai.css";
  previewTheme: "atom-dark.css" | "atom-light.css" | "atom-material.css" | "github-dark.css" | "github-light.css" | "gothic.css" | "medium.css" | "monokai.css" | "newsprint.css" | "night.css" | "none.css" | "one-dark.css" | "one-light.css" | "solarized-dark.css" | "solarized-light.css" | "vue.css";
  revealjsTheme: "beige.css" | "black.css" | "blood.css" | "league.css" | "moon.css" | "night.css" | "serif.css" | "simple.css" | "sky.css" | "solarized.css" | "white.css" | "none.css";

  breakOnSingleNewLine: boolean;
  enableLinkify: boolean;
  enableWikiLinkSyntax: boolean;
  enableEmojiSyntax: boolean;
  enableExtendedTableSyntax: boolean;
  enableCriticMarkupSyntax: boolean;
  frontMatterRenderingOption: 'none' | 'table' | 'code';
  enableScriptExecution: boolean;
  enableHTML5Embed: boolean;
  HTML5EmbedUseImageSyntax: boolean;
  HTML5EmbedUseLinkSyntax: boolean;
  HTML5EmbedIsAllowedHttp: boolean;
  HTML5EmbedAudioAttributes: string;
  HTML5EmbedVideoAttributes: string;

  mathRenderingOption: "KaTeX" | "MathJax" | "None";
  mathInlineDelimiters: [string, string][];
  mathBlockDelimiters: [string, string][];
  mathRenderingOnlineService: string;
  mathjaxV3ScriptSrc: string;

  enableOffline: boolean;
  printBackground: boolean;
  chromePath: string;
  puppeteerArgs: string[];

  protocolsWhiteList: string;
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    width: Schema.number().default(800).description(`视图宽度。`),
    height: Schema.number().default(100).description(`视图高度。`),
    deviceScaleFactor: Schema.number().default(1).description(`设备的缩放比率。`),
    enableAutoCacheClear: Schema.boolean().default(true).description('是否启动自动删除缓存功能。'),
    enableRunAllCodeChunks: Schema.boolean().default(false).description('文本转图片时是否执行代码块里的代码。'),
    defaultImageFormat: Schema.union(['png', 'jpeg', 'webp']).default('png').description('文本转图片时默认渲染的图片格式。'),
    // waitUntil: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
    waitUntil: Schema.union(['load', 'domcontentloaded', 'networkidle0', 'networkidle2']).default('networkidle0').description('指定页面何时认为导航完成。'),
  }).description('基础设置'),
  Schema.object({
    mermaidTheme: Schema.union(['default', 'dark', 'forest']).default('default').description('Mermaid 主题。'),
    codeBlockTheme: Schema.union([
      'auto.css',
      'default.css',
      'atom-dark.css',
      'atom-light.css',
      'atom-material.css',
      'coy.css',
      'darcula.css',
      'dark.css',
      'funky.css',
      'github.css',
      'github-dark.css',
      'hopscotch.css',
      'monokai.css',
      'okaidia.css',
      'one-dark.css',
      'one-light.css',
      'pen-paper-coffee.css',
      'pojoaque.css',
      'solarized-dark.css',
      'solarized-light.css',
      'twilight.css',
      'vue.css',
      'vs.css',
      'xonokai.css'
    ]).default('auto.css').description('代码块主题。如果选择 `auto.css`，那么将选择与当前预览主题最匹配的代码块主题。'),
    previewTheme: Schema.union([
      'atom-dark.css',
      'atom-light.css',
      'atom-material.css',
      'github-dark.css',
      'github-light.css',
      'gothic.css',
      'medium.css',
      'monokai.css',
      'newsprint.css',
      'night.css',
      'none.css',
      'one-dark.css',
      'one-light.css',
      'solarized-dark.css',
      'solarized-light.css',
      'vue.css'
    ]).default('github-light.css').description('预览主题。'),
    revealjsTheme: Schema.union([
      'beige.css',
      'black.css',
      'blood.css',
      'league.css',
      'moon.css',
      'night.css',
      'serif.css',
      'simple.css',
      'sky.css',
      'solarized.css',
      'white.css',
      'none.css',
    ]).default('white.css').description('Revealjs 演示主题。')

  }).description('主题相关设置'),
  Schema.object({
    breakOnSingleNewLine: Schema.boolean().default(true).description('在 Markdown 中，单个换行符不会在生成的 HTML 中导致换行。在 GitHub Flavored Markdown 中，情况并非如此。启用此配置选项以在渲染的 HTML 中为 Markdown 源中的单个换行符插入换行。'),
    enableLinkify: Schema.boolean().default(true).description('启用将类似 URL 的文本转换为 Markdown 预览中的链接。'),
    enableWikiLinkSyntax: Schema.boolean().default(true).description('启用 Wiki 链接语法支持。更多信息可以在 https://help.github.com/articles/adding-links-to-wikis/ 找到。如果选中，我们将使用 GitHub 风格的管道式 Wiki 链接，即 [[linkText|wikiLink]]。否则，我们将使用 [[wikiLink|linkText]] 作为原始 Wikipedia 风格。'),
    enableEmojiSyntax: Schema.boolean().default(true).description('启用 emoji 和 font-awesome 插件。这仅适用于 markdown-it 解析器，而不适用于 pandoc 解析器。'),
    enableExtendedTableSyntax: Schema.boolean().default(false).description('启用扩展表格语法以支持合并表格单元格。'),
    enableCriticMarkupSyntax: Schema.boolean().default(false).description('启用 CriticMarkup 语法。仅适用于 markdown-it 解析器。'),
    frontMatterRenderingOption: Schema.union(['none', 'table', 'code']).default('none').description('Front matter 渲染选项。'),
    enableScriptExecution: Schema.boolean().default(false).description('启用执行代码块和导入 javascript 文件。这也启用了侧边栏目录。⚠ ️ 请谨慎使用此功能，因为它可能会使您的安全受到威胁！如果在启用脚本执行的情况下，有人让您打开带有恶意代码的 markdown，您的计算机可能会被黑客攻击。'),
    enableHTML5Embed: Schema.boolean().default(false).description('启用将音频视频链接转换为 html5 嵌入音频视频标签。内部启用了 markdown-it-html5-embed 插件。'),
    HTML5EmbedUseImageSyntax: Schema.boolean().default(true).description(`使用 ! [] () 语法启用视频/音频嵌入（默认）。`),
    HTML5EmbedUseLinkSyntax: Schema.boolean().default(false).description('使用 [] () 语法启用视频/音频嵌入。'),
    HTML5EmbedIsAllowedHttp: Schema.boolean().default(false).description('当 URL 中有 http:// 协议时嵌入媒体。当为 false 时忽略并且不嵌入它们。'),
    HTML5EmbedAudioAttributes: Schema.string().default('controls preload="metadata" width="320"').description('传递给音频标签的 HTML 属性。'),
    HTML5EmbedVideoAttributes: Schema.string().default('controls preload="metadata" width="320" height="240"').description('传递给视频标签的 HTML 属性。'),
  }).description('Markdown 解析相关设置'),
  Schema.object({
    mathRenderingOption: Schema.union(['KaTeX', 'MathJax', 'None']).default('KaTeX').description('数学渲染引擎。'),
    mathInlineDelimiters: Schema.array(Schema.array(String)).collapse().default([["$", "$"], ["\\(", "\\)"]]).description('数学公式行内分隔符。'),
    mathBlockDelimiters: Schema.array(Schema.array(String)).collapse().default([["$", "$"], ["\\[", "\\]"]]).description('数学公式块分隔符。'),
    mathRenderingOnlineService: Schema.union(['https://latex.codecogs.com/gif.latex', 'https://latex.codecogs.com/svg.latex', 'https://latex.codecogs.com/png.latex']).default('https://latex.codecogs.com/gif.latex').description('数学公式渲染在线服务。'),
    mathjaxV3ScriptSrc: Schema.string().role('link').default('https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js').description('MathJax 脚本资源。')
  }).description('数学公式渲染设置'),
  Schema.object({
    enableOffline: Schema.boolean().default(false).description('是否离线使用 html。'),
    printBackground: Schema.boolean().default(true).description('是否为文件导出打印背景。如果设置为 `false`，则将使用 `github-light` 预览主题。您还可以为单个文件设置 `print_background`。'),
    chromePath: Schema.path().default('').description('Chrome / Edge 可执行文件路径，用于 Puppeteer 导出。留空表示路径将自动找到。'),
    puppeteerArgs: Schema.array(String).default([]).description('传递给 puppeteer.launch({args: $puppeteerArgs}) 的参数，例如 `[\'--no-sandbox\', \'--disable-setuid-sandbox\']`。'),
  }).description('导出与渲染设置'),
  Schema.object({
    protocolsWhiteList: Schema.string().default('http://, https://, atom://, file://, mailto:, tel:').description('链接的接受协议白名单。'),
  }).description('其他设置'),
]) as any


// 声明合并 Context ctx.markdownToImage()
declare module 'koishi' {
  interface Context {
    markdownToImage: MarkdownToImageService
  }
}

class MarkdownToImageService extends Service {

  constructor(ctx: Context, private config: Config) {
    super(ctx, 'markdownToImage', true);
  }

  async convertToImage(markdownText: string): Promise<Buffer> {
    const page = await this.ctx.puppeteer.page()
    const logger = this.ctx.logger('markdownToImage')
    const notebookDirPath = path.join(this.ctx.baseDir, 'data', 'notebook');

    async function ensureDirExists(dirPath: string) {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, {recursive: true});
      }
    }

    async function ensureFileExists(filePath: string) {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '', 'utf-8');
      }
    }

    await ensureDirExists(notebookDirPath)
    let {
      height,
      width,
      deviceScaleFactor,
      waitUntil,
      enableAutoCacheClear,
      enableRunAllCodeChunks,
      defaultImageFormat,
      enableOffline,
      breakOnSingleNewLine,
      enableLinkify,
      mathRenderingOption,
      mathInlineDelimiters,
      mathBlockDelimiters,
      mathRenderingOnlineService,
      mathjaxV3ScriptSrc,
      enableWikiLinkSyntax,
      enableEmojiSyntax,
      enableExtendedTableSyntax,
      enableCriticMarkupSyntax,
      frontMatterRenderingOption,
      mermaidTheme,
      codeBlockTheme,
      previewTheme,
      revealjsTheme,
      protocolsWhiteList,
      printBackground,
      chromePath,
      enableScriptExecution,
      enableHTML5Embed,
      HTML5EmbedUseImageSyntax,
      HTML5EmbedUseLinkSyntax,
      HTML5EmbedIsAllowedHttp,
      HTML5EmbedAudioAttributes,
      HTML5EmbedVideoAttributes,
      puppeteerArgs,
    } = this.config;
    const executablePath = await find();
    if (!chromePath) chromePath = executablePath
    const notebook = await Notebook.init({
      notebookPath: notebookDirPath,
      config: {
        breakOnSingleNewLine,
        enableLinkify,
        mathRenderingOption,
        mathInlineDelimiters,
        mathBlockDelimiters,
        mathRenderingOnlineService,
        mathjaxV3ScriptSrc,
        enableWikiLinkSyntax,
        enableEmojiSyntax,
        enableExtendedTableSyntax,
        enableCriticMarkupSyntax,
        frontMatterRenderingOption,
        mermaidTheme,
        codeBlockTheme,
        previewTheme,
        revealjsTheme,
        protocolsWhiteList,
        printBackground,
        chromePath,
        enableScriptExecution,
        enableHTML5Embed,
        HTML5EmbedUseImageSyntax,
        HTML5EmbedUseLinkSyntax,
        HTML5EmbedIsAllowedHttp,
        HTML5EmbedAudioAttributes,
        HTML5EmbedVideoAttributes,
        puppeteerArgs,
      },
    });


    const asyncUnlink = promisify(fs.unlink);

    function getCurrentTimeNumberString(): string {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const randomString = Math.random().toString(36).substring(2, 8); // 生成一个随机字符串
      return `${year}${month}${day}${hours}${minutes}${seconds}_${randomString}`;
    }

    async function generateAndSaveImage(notebookDirPath: string, markdownText: string, defaultImageFormat: "png" | "jpeg" | "webp", enableRunAllCodeChunks: boolean): Promise<Buffer> {
      const currentTimeString = getCurrentTimeNumberString();
      const readmeFilePath = path.join(notebookDirPath, `${currentTimeString}.md`);
      await fs.promises.writeFile(readmeFilePath, markdownText);

      const engine = notebook.getNoteMarkdownEngine(readmeFilePath);
      await engine.htmlExport({offline: enableOffline, runAllCodeChunks: enableRunAllCodeChunks});

      const readmeHtmlPath = path.join(notebookDirPath, `${currentTimeString}.html`);
      await page.setViewport({width: width, height: height, deviceScaleFactor: deviceScaleFactor})
      await page.goto('file://' + readmeHtmlPath.replace(/\\/g, '/'), {waitUntil: waitUntil});
      const imageBuffer = await page.screenshot({fullPage: true, type: defaultImageFormat})
      // const pElement = await page.$('.crossnote.markdown-preview');
      // const imageBuffer = await pElement.screenshot({type: defaultImageFormat});
      await page.close()

      if (enableAutoCacheClear) {
        await asyncUnlink(readmeHtmlPath);
        await asyncUnlink(readmeFilePath);
      }

      return imageBuffer;
    }

    try {
      // 处理 imageBuffer
      return await generateAndSaveImage(notebookDirPath, markdownText, defaultImageFormat, enableRunAllCodeChunks)
    } catch (error) {
      logger.error('出错：', error);
    }


  }

  //
}

// export default MarkdownToImageService;

export function apply(ctx: Context, config: Config) {
  ctx.plugin(MarkdownToImageService, config)

  ctx.command('markdownToImage [markdownText:text]', '将 Markdown 文本转换为图片')
    .action(async ({session}, markdownText) => {
      if (!markdownText) {
        await session.send('请输入你要转换的 Markdown 文本内容：')
        const userInput = await session.prompt()
        if (!userInput) return `输入超时。`
        markdownText = userInput
      }
      const markdownToImage = new MarkdownToImageService(ctx, config)
      const imageBuffer = await markdownToImage.convertToImage(markdownText)
      return h.image(imageBuffer, `image/${config.defaultImageFormat}`)
    })
}
