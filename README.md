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

本次更新：mdimg 直接持有渲染器实例，不再触发 `property markdownToImage is not registered` 警告；新增导出 `MarkdownRenderer`。 主指令在 help 列表里补回描述；去掉「.显示」显示模式指令，有图只发图、出图失败才退回文字；多轮输入不再追加计时说明。
