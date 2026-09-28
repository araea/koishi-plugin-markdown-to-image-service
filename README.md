# Markdown 转图片服务

Koishi 插件：把 Markdown 文本渲染成图片，支持 KaTeX 公式与 Mermaid 图表

[![GitHub](https://img.shields.io/badge/GitHub-仓库-blue)](https://github.com/araea/koishi-plugin-markdown-to-image-service) [![npm](https://img.shields.io/badge/npm-包-red)](https://www.npmjs.com/package/koishi-plugin-markdown-to-image-service)

## 安装

```sh
yarn add koishi-plugin-markdown-to-image-service
```

在 Koishi 中启用，并安装 `puppeteer` 服务。

## 快速使用

发送 `mdimg` 加一段 Markdown 文本，得到一张图片。文本留空时，插件会等待下一条消息作为内容。

指令另可用别名 `markdownToImage`。其他插件可调用服务接口渲染：

```ts
ctx.markdownToImage.convertToImage(markdownText: string): Promise<Buffer>
```

## 配置

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `rendering.width` | number（200–4000） | 800 | 图片内容宽度（像素） |
| `rendering.maxWidth` | number（200–6000） | 2000 | 内容过宽时图片宽度的上限 |
| `rendering.deviceScaleFactor` | number（1–4） | 2 | 设备缩放比率，建议 2 获得更清晰的图片 |
| `rendering.imageFormat` | `png` / `jpeg` / `webp` | `png` | 图片输出格式 |
| `rendering.imageQuality` | number（1–100） | 90 | jpeg/webp 图片质量，png 忽略此项 |
| `rendering.padding` | number（0–200） | 32 | 内容四周的内边距（像素） |
| `theme.mode` | `preset` / `custom` | `preset` | 主题模式 |
| `theme.preset` | string | `m3-light` | 预设主题，可选 `m3-light` 或 `m3-dark` |
| `theme.custom.pageTheme` | `light` / `dark` | `dark` | 自定义主题下的整体页面主题 |
| `theme.custom.codeTheme` | string | `github-dark` | 语法高亮配色 |
| `theme.custom.mermaidTheme` | `default` / `base` / `forest` / `dark` / `neutral` | `dark` | Mermaid 图表配色 |

## 限制 / 风险

依赖 `puppeteer`（无头 Chrome），需安装对应的系统依赖。图片由 Puppeteer 截图生成，内容比视口宽时自动扩展宽度至 `rendering.maxWidth`，避免横向裁剪。

## 必要链接

- [LICENSE-APACHE](LICENSE-APACHE) / [LICENSE-MIT](LICENSE-MIT)：双协议任选其一
