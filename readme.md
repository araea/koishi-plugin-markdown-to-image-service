# koishi-plugin-markdown-to-image-service

[![github](https://img.shields.io/badge/github-araea/markdown_to_image-8da0cb?style=for-the-badge&labelColor=555555&logo=github)](https://github.com/araea/koishi-plugin-markdown-to-image-service) [![npm](https://img.shields.io/npm/v/koishi-plugin-markdown-to-image-service.svg?style=for-the-badge&color=fc8d62&logo=npm)](https://www.npmjs.com/package/koishi-plugin-markdown-to-image-service)

## 简介

Koishi 的 Markdown 转图片服务插件，支持 LaTeX、Mermaid 与代码高亮。

## 命令

### `markdownToImage [markdownText:text]`

将 Markdown 文本转换为图片。

- **用法 1**：`markdownToImage # Hello World`
- **用法 2**：直接输入 `markdownToImage`，根据提示输入 Markdown 内容。

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
`
      const imageBuffer = await ctx.markdownToImage.convertToImage(markdown)
      return h.image(imageBuffer, 'image/png')
    })
}
```

## 致谢

- [Koishi](https://koishi.chat/)
- [markdown-it](https://github.com/markdown-it/markdown-it)
- [Puppeteer](https://pptr.dev/)
- [KaTeX](https://katex.org/)
- [highlight.js](https://highlightjs.org/)

## 交流

- QQ 群：`956758505`

## License

*Licensed under either of [Apache License, Version 2.0](LICENSE-APACHE) or [MIT license](LICENSE-MIT) at your option.*

*Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in this crate by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.*
