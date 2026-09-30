# Markdown 转图片服务

Koishi 插件：把 Markdown 文本渲染成图片，支持 KaTeX 公式与 Mermaid 图表

[![GitHub](https://img.shields.io/badge/GitHub-araea%2Fkoishi--plugin--markdown--to--image--service-181717?logo=github&logoColor=white)](https://github.com/araea/koishi-plugin-markdown-to-image-service)
[![npm](https://img.shields.io/npm/v/koishi-plugin-markdown-to-image-service?logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/koishi-plugin-markdown-to-image-service)

## 安装

```sh
npm i koishi-plugin-markdown-to-image-service
```

启用插件，并安装 `puppeteer` 服务。

## 快速使用

发送 `mdimg` 加一段 Markdown 文本，得到一张图片；文本留空时，插件会等待下一条消息作为内容。指令别名 `markdownToImage`。

插件实现 `markdownToImage` 服务，其他插件可直接调用：

```ts
ctx.markdownToImage.convertToImage(markdownText: string): Promise<Buffer>
```

## 配置

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `rendering.width` | number | `800` | 图片内容宽度（像素），范围 200–4000 |
| `rendering.maxWidth` | number | `2000` | 内容过宽时图片宽度的上限，范围 200–6000 |
| `rendering.deviceScaleFactor` | number | `2` | 设备缩放比率，范围 1–4 |
| `rendering.imageFormat` | `png` / `jpeg` / `webp` | `png` | 图片输出格式 |
| `rendering.imageQuality` | number | `90` | jpeg / webp 图片质量，范围 1–100，png 忽略 |
| `rendering.padding` | number | `32` | 内容四周的内边距（像素），范围 0–200 |
| `theme.mode` | `preset` / `custom` | `preset` | 主题模式 |
| `theme.preset` | string | `m3-light` | 预设主题，可选 `m3-light` 或 `m3-dark` |
| `theme.custom.pageTheme` | `light` / `dark` | `dark` | 自定义主题的页面主题 |
| `theme.custom.codeTheme` | string | `github-dark` | 语法高亮配色 |
| `theme.custom.mermaidTheme` | string | `dark` | 兼容旧配置；图表颜色始终跟随 M3 页面主题 |

## 限制 / 风险

依赖 `puppeteer`（无头 Chrome），需安装对应的系统依赖。

图片由 Puppeteer 截图生成，内容比视口宽时自动扩展宽度至 `rendering.maxWidth`，避免横向裁剪。

## 链接

- [设计系统](DESIGN_SYSTEM.md)
- [MIT](LICENSE-MIT) / [Apache-2.0](LICENSE-APACHE)
