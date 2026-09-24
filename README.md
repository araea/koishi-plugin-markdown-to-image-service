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
