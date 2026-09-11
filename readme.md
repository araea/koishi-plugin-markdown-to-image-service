# koishi-plugin-markdown-to-image-service

把 Markdown 渲染为图片的 Koishi 服务，供其他插件调用

## 安装

```sh
yarn add koishi-plugin-markdown-to-image-service
```

在 Koishi 配置中启用，并提供 puppeteer 服务。

## 指令

| 指令 | 说明 |
| --- | --- |
| `mdimg [文本]` | 将 Markdown 转为图片 |
| `test-md` | 输出测试样张 |

## 服务

```typescript
ctx.markdownToImage.convertToImage(markdownText: string): Promise<Buffer>
```

## 许可证

使用 [MIT](LICENSE-MIT) 许可证。
