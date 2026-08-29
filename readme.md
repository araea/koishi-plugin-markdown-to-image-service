koishi-plugin-markdown-to-image-service
=======================================

[<img alt="github" src="https://img.shields.io/badge/github-araea/markdown_to_image-8da0cb?style=for-the-badge&labelColor=555555&logo=github" height="20">](https://github.com/araea/koishi-plugin-markdown-to-image-service)
[<img alt="npm" src="https://img.shields.io/npm/v/koishi-plugin-markdown-to-image-service.svg?style=for-the-badge&color=fc8d62&logo=npm" height="20">](https://www.npmjs.com/package/koishi-plugin-markdown-to-image-service)

Koishi 的 Markdown 转图片服务插件。基于 Puppeteer 与本地化的 KaTeX / highlight.js / Mermaid，完全离线渲染，不依赖任何 CDN。

## 使用

1. 启动 `puppeteer` 服务。
2. `markdownToImage` 把文本画成图；`test-md` 出一份含公式、代码、表格与 Mermaid 的样张。

## 特性

- **公式渲染**：内置现代 KaTeX（0.16），支持行内 `$...$`、块级 `$$...$$` 以及 `\(...\)`、`\[...\]`，公式字体与样式全部内联，块级公式居中、对齐正常。
- **代码高亮**：使用 highlight.js 全量语言，明暗主题可选。
- **Mermaid 图表**：本地渲染流程图、时序图等，无需联网。
- **完整 Markdown 语法**：表格、任务列表、脚注、上下标、定义列表、删除线、高亮、缩写、emoji、自定义容器（`:::note / :::tip / :::warning / :::danger`）等。
- **主题系统**：内置 `github-light`、`github-dark`、`atom-one-light`、`atom-one-dark`、`monokai`、`vs2015`、`tokyo-night` 预设，也支持完全自定义。
- **自适应宽度**：超宽表格 / 代码 / 公式会自动扩展图片宽度，避免被裁剪。
- **高清输出**：默认 `deviceScaleFactor = 2`，支持 png / jpeg / webp。

## 指令

### `markdownToImage [markdownText:text]`

将 Markdown 文本转换为图片。

- **用法 1**：`markdownToImage # Hello World`
- **用法 2**：直接输入 `markdownToImage`，根据提示输入 Markdown 内容。

### `test-md`

生成一份包含公式、代码、表格、列表、Mermaid 等元素的示例图片，用于测试渲染效果。

## 服务

本插件提供 `markdownToImage` 服务，供其他插件调用。

```typescript
ctx.markdownToImage.convertToImage(markdownText: string): Promise<Buffer>
```

### 示例

```typescript
import { Context, h } from 'koishi'
import {} from 'koishi-plugin-markdown-to-image-service'

export const inject = {
  required: ['markdownToImage'],
}

export function apply(ctx: Context) {
  ctx.command('test-md', '测试 Markdown 图片转换')
    .action(async () => {
      const markdown = `
# Hello, Koishi

行内公式 $E=mc^2$，块级公式：

$$\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}$$

| 名称 | 值 |
| ---- | -- |
| 甲   | 1  |
| 乙   | 2  |

\`\`\`mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
\`\`\`
`
      const imageBuffer = await ctx.markdownToImage.convertToImage(markdown)
      return h.image(imageBuffer, 'image/png')
    })
}
```

## 致谢

- [Koishi](https://koishi.chat/)
- [markdown-it](https://github.com/markdown-it/markdown-it)
- [KaTeX](https://katex.org/)
- [highlight.js](https://highlightjs.org/)
- [Mermaid](https://mermaid.js.org/)

## QQ 群

- 956758505

<br>

#### License

<sup>
Licensed under either of <a href="LICENSE-APACHE">Apache License, Version
2.0</a> or <a href="LICENSE-MIT">MIT license</a> at your option.
</sup>

<br>

<sub>
Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in this crate by you, as defined in the Apache-2.0 license, shall
be dual licensed as above, without any additional terms or conditions.
</sub>
