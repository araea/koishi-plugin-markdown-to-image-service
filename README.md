# Markdown 转图片服务

Koishi 服务插件，将 Markdown 文本渲染为图片，并提供接口供其他插件调用。

## 安装

```sh
yarn add koishi-plugin-markdown-to-image-service
```

在 Koishi 中启用，并安装 `puppeteer` 服务。

## 使用

指令：`mdimg [文本]`

其他插件可调用：

```ts
ctx.markdownToImage.convertToImage(markdownText: string): Promise<Buffer>
```

## 许可证

可按 [Apache-2.0](LICENSE-APACHE) 或 [MIT](LICENSE-MIT) 使用。

## 显示与交互

有渲染图时只发图片，不再附带同内容的文字；图片生成失败时才退回文字。作品素材与感官测试的适用边界见 [设计系统](./DESIGN_SYSTEM.md)。

本次更新：统一 M3 明暗主题、语法高亮和 Mermaid 颜色；保留原文与文字模式；可延长输入；发布共享设计令牌同步与检查工具。
