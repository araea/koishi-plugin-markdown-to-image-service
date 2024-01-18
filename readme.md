# koishi-plugin-markdown-to-image-service

[![npm](https://img.shields.io/npm/v/koishi-plugin-markdown-to-image-service?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-markdown-to-image-service)

## 简介

koishi-plugin-markdown-to-image-service 是一个基于 [Koishi](https://koishi.chat/) 的插件，旨在提供将 Markdown 文本转换为图片的服务。

该插件支持完整的 Markdown 格式，包括 LaTeX 公式、Mermaid 流程图、代码高亮等功能。转换后的图片可用于分享和展示 Markdown 内容。

## 安装

您可以通过 Koishi 插件市场来搜索并安装该插件。

## 使用

当您在 Markdown 中引用本地图片时，务必使用**相对路径**。相对路径的根目录位于：`./data/notebook`。

例如，如果在 `notebook` 文件夹内有名为 `0.png` 的图片，那么您需要使用以下方式来在 Markdown 中引用该图片：

```markdown
![图片介绍](0.png)
```

## 示例

```typescript
// index.ts
import { Context } from 'koishi'
import { MarkdownToImage } from 'koishi-plugin-markdown-to-image-service'

export const inject = ['markdownToImage']

export async function apply(ctx: Context) {
  const imageBuffer = await ctx.markdownToImage.convertToImage('# Hello')
  return h.image(imageBuffer, 'image/png')
}
```

## 致谢

- [Koishi](https://koishi.chat/) - 提供机器人框架支持
- [crossnote](https://github.com/shd101wyy/crossnote) - 提供 Markdown 渲染引擎支持

## License

MIT © 2023
