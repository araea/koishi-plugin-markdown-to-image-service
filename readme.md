# koishi-plugin-markdown-to-image-service

[![npm](https://img.shields.io/npm/v/koishi-plugin-markdown-to-image-service?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-markdown-to-image-service)

## 简介

这是一个基于 [Koishi](https://koishi.chat/) 的插件，提供将 Markdown 文本转换为图片的服务。

支持完整的 Markdown 格式，包括 LaTeX 公式、Mermaid 流程图、代码高亮等。

转换后的图片可用于分享和展示 Markdown 内容。

## 安装

通过 Koishi 插件市场搜索并安装。

## 使用

Markdown 引用本地图片时，必须使用**相对路径**。相对路径的根目录位于:`./data/notebook`。

例如，`notebook` 文件夹内有 `0.png`，那么 Markdown 引用方式为：

```
! [图片介绍] (0.png)
```

## 示例

```typescript
// index.ts
import {} from 'koishi-plugin-markdown-to-image-service'

export const inject = ['markdownToImage']

export async function apply(ctx: Context) {
  const url = await ctx.markdownToImage.convertToImage('# Hello')
  return h.image(url)
}
```

```json
"dependencies": {
  "koishi-plugin-markdown-to-image-service": "^0.0.1"
}
```

## 致谢

- [Koishi](https://koishi.chat/) - 机器人框架
- [crossnote](https://github.com/shd101wyy/crossnote) - Markdown 渲染引擎

## License

MIT © 2023
