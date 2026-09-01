koishi-plugin-markdown-to-image-service
=======================================

[<img alt="github" src="https://img.shields.io/badge/github-araea/koishi__plugin__markdown__to__image__service-8da0cb?style=for-the-badge&labelColor=555555&logo=github" height="20">](https://github.com/araea/koishi-plugin-markdown-to-image-service)
[<img alt="npm" src="https://img.shields.io/npm/v/koishi-plugin-markdown-to-image-service.svg?style=for-the-badge&color=fc8d62&logo=npm" height="20">](https://www.npmjs.com/package/koishi-plugin-markdown-to-image-service)

Koishi 的 Markdown 转图片服务插件。

## 使用

`mdimg` 将 Markdown 转为图片；`test-md` 输出测试样张。

## 指令

| 指令 | 说明 |
| --- | --- |
| `mdimg [文本]` | Markdown 转图片 |
| `test-md` | 渲染测试样张 |

## 服务

```typescript
ctx.markdownToImage.convertToImage(markdownText: string): Promise<Buffer>
```

## QQ 群

956758505

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
