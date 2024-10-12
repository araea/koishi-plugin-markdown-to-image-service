# koishi-plugin-markdown-to-image-service

[![npm](https://img.shields.io/npm/v/koishi-plugin-markdown-to-image-service?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-markdown-to-image-service)

## 简介

Koishi 的 Markdown 转图片服务插件。支持 LaTeX、Mermaid、代码高亮等。

## 注意事项

引用本地图片时，请使用相对路径。
相对路径根目录位于：`./data/notebook`。

若在 `notebook` 文件夹内，存在名为 `0.png` 的图片，引用方式如下：

```markdown
![图片介绍](0.png)
```

## 服务

- `ctx.markdownToImage.convertToImage(markdownText: string): Promise<Buffer>`

### 示例

```typescript
import {Context, h} from 'koishi';
import {} from 'koishi-plugin-markdown-to-image-service';

export const inject = {
  required: ['markdownToImage'],
};

export async function apply(ctx: Context) {
  ctx.command('test', '测试')
    .action(async ({session}) => {
      const markdownText = '# Hello';
      const imageBuffer = await ctx.markdownToImage.convertToImage(markdownText);
      return h.image(imageBuffer, 'image/png');
    });
}
```

## 致谢

- [Koishi](https://koishi.chat/) - 机器人框架
- [crossnote](https://github.com/shd101wyy/crossnote) - Markdown 渲染引擎

## QQ 群

- 956758505

## License

MIT License © 2024
