import {
  baseline,
  colorVars,
  ELEVATION,
  EMPHASIZED_WEIGHT,
  scheme,
  TYPE,
} from './m3'

/**
 * 自包含的 Markdown 排版样式。
 *
 * 取值全部来自 m3.ts：`baseline()` 铺开色相 258 的 `--md-sys-color-*` 角色色、
 * 形状 / 字阶 / 高度的变量与排版重置；圆角走 `--md-sys-shape-corner-*`，
 * 字号与强调字重走 `TYPE` 与 `EMPHASIZED_WEIGHT`，高度走 `ELEVATION`。
 * 代码高亮仍交给 highlight.js 的主题文件，那部分是语法着色，不归设计系统管。
 */

/** 文档类的主色取中性蓝：长文里主色只出现在链接和强调上，不该抢戏。 */
const HUE = 258
const LIGHT = scheme(HUE)
const DARK = scheme(HUE, true)

/**
 * 行内等比缩放的几处字号保持 `em`：它们随所在层级的字号缩放，
 * 锚成绝对 px 会让标题里的公式反而比正文小。清单见文件末尾的注释。
 */
export function baseCss(): string {
  return `
${baseline(LIGHT)}
/* 暗色只换角色取值；明色由 baseline 的 :root 兜底，与 data-theme="light" 同值 */
:root { color-scheme: light; }
html[data-theme="dark"] {${colorVars(DARK)};color-scheme:dark}

html,
body {
  background: var(--md-sys-color-surface);
}

.markdown-body {
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  font-family: var(--md-sys-typescale-font);
  font-size: ${TYPE.bodyLarge.size}px;
  line-height: 1.65;
  word-wrap: break-word;
  overflow-wrap: break-word;
  width: 100%;
}

.markdown-body::before {
  display: table;
  content: "";
}

.markdown-body > *:first-child {
  margin-top: 0 !important;
}

.markdown-body > *:last-child {
  margin-bottom: 0 !important;
}

/* ---------- 标题 ---------- */
.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 28px;
  margin-bottom: 14px;
  /* Expressive 的强调字重。600 在只装了 400/700 的机器上会匹配到 700，
     取 500 则会悄悄回落成常规字重，标题层级就塌了 */
  font-weight: ${EMPHASIZED_WEIGHT.headline};
  line-height: 1.3;
}

/* 层级靠字号与留白拉开，不再画下划线——线会把长文切得很碎 */
.markdown-body h1 {
  font-size: ${TYPE.headlineLarge.size}px;
  letter-spacing: -0.5px;
}
.markdown-body h2 {
  font-size: ${TYPE.headlineSmall.size}px;
  letter-spacing: -0.25px;
}
.markdown-body h3 {
  font-size: ${TYPE.titleLarge.size}px;
}
.markdown-body h4 {
  font-size: ${TYPE.titleMedium.size}px;
}
.markdown-body h5 {
  font-size: ${TYPE.titleSmall.size}px;
}
.markdown-body h6 {
  font-size: ${TYPE.titleSmall.size}px;
  color: var(--md-sys-color-on-surface-variant);
}

.markdown-body p {
  margin: 0 0 16px;
}

/* 链接出图后没有 hover，下划线是颜色之外的第二条通道 */
.markdown-body a {
  color: var(--md-sys-color-primary);
  text-decoration: underline;
}

.markdown-body strong {
  font-weight: ${EMPHASIZED_WEIGHT.label};
}

.markdown-body del {
  color: var(--md-sys-color-on-surface-variant);
}

.markdown-body mark {
  background: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);
  border-radius: var(--md-sys-shape-corner-extra-small);
  padding: 0.1em 0.2em;
}

.markdown-body ins {
  background: var(--md-sys-color-secondary-container);
  text-decoration: none;
  border-radius: var(--md-sys-shape-corner-extra-small);
  padding: 0.1em 0.2em;
}

.markdown-body sub,
.markdown-body sup {
  font-size: 0.75em;
}

.markdown-body abbr[title] {
  border-bottom: 1px dotted var(--md-sys-color-on-surface-variant);
  cursor: help;
  text-decoration: none;
}

/* 分隔线收到 1px：M3 里分隔线是最低一级的层次手段，粗了就成了装饰 */
.markdown-body hr {
  height: 1px;
  padding: 0;
  margin: 28px 0;
  background-color: var(--md-sys-color-outline-variant);
  border: 0;
}

/* ---------- 列表 ---------- */
.markdown-body ul,
.markdown-body ol {
  padding-left: 2em;
  margin: 0 0 16px;
}
.markdown-body li {
  margin: 0.25em 0;
}
.markdown-body li > ul,
.markdown-body li > ol {
  margin-bottom: 0;
}
.markdown-body li + li {
  margin-top: 0.25em;
}

/* 任务列表 */
.markdown-body ul.contains-task-list {
  list-style: none;
  padding-left: 0.25em;
}
.markdown-body .task-list-item {
  list-style-type: none;
}
.markdown-body .task-list-item input[type="checkbox"] {
  margin: 0 0.5em 0.15em -1.4em;
  vertical-align: middle;
  appearance: auto;
}

/* ---------- 引用 ---------- */
.markdown-body blockquote {
  margin: 0 0 16px;
  padding: 0 1em;
  color: var(--md-sys-color-on-surface-variant);
  border-left: 0.25em solid var(--md-sys-color-primary);
  background: var(--md-sys-color-surface-container-low);
  border-radius: var(--md-sys-shape-corner-medium);
  padding-top: 0.25em;
  padding-bottom: 0.25em;
}
.markdown-body blockquote > :first-child {
  margin-top: 0.5em;
}
.markdown-body blockquote > :last-child {
  margin-bottom: 0.5em;
}

/* ---------- 行内代码与代码块 ---------- */
.markdown-body code,
.markdown-body kbd,
.markdown-body pre,
.markdown-body samp,
.markdown-body tt {
  font-family: var(--md-sys-typescale-font-mono);
  font-size: 0.875em;
}

.markdown-body code:not(.hljs) {
  background: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  padding: 0.2em 0.4em;
  margin: 0;
  border-radius: var(--md-sys-shape-corner-medium);
  white-space: break-spaces;
}

.markdown-body pre {
  margin: 0 0 16px;
  padding: 0;
  border-radius: var(--md-sys-shape-corner-large);
  overflow: hidden;
  background: var(--md-sys-color-surface-container-low);
  line-height: 1.5;
  border: 1px solid var(--md-sys-color-outline-variant);
}

.markdown-body pre > code {
  display: block;
  padding: 16px;
  overflow-x: auto;
  background: transparent;
  color: var(--md-sys-color-on-surface);
  font-size: 0.875em;
  line-height: 1.5;
  word-wrap: normal;
  white-space: pre;
}

/* highlight.js 主题会自带背景与内边距，这里统一覆盖内边距，保持观感一致 */
.markdown-body pre code.hljs {
  display: block;
  padding: 16px;
  overflow-x: auto;
  background: transparent;
}

.markdown-body kbd {
  display: inline-block;
  padding: 0.15em 0.4em;
  background: var(--md-sys-color-surface-container-high);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-bottom-color: var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-medium);
  /* 键帽原来用一条手写的 inset 阴影线描边；高度统一改取 ELEVATION 的 level 1 */
  box-shadow: ${ELEVATION[1]};
  color: var(--md-sys-color-on-surface);
  line-height: 1.2;
  vertical-align: middle;
}

/* ---------- 表格 ---------- */
.markdown-body table {
  border-spacing: 0;
  border-collapse: collapse;
  width: 100%;
  margin: 0 0 16px;
  font-size: ${TYPE.bodyLarge.size}px;
}
.markdown-body table th,
.markdown-body table td {
  padding: 6px 13px;
  border: 1px solid var(--md-sys-color-outline-variant);
}
.markdown-body table tr {
  background-color: var(--md-sys-color-surface);
}
.markdown-body table tr:nth-child(2n) {
  background-color: var(--md-sys-color-surface-container-low);
}
.markdown-body table th {
  font-weight: ${EMPHASIZED_WEIGHT.title};
  background-color: var(--md-sys-color-surface-container-high);
}

/* ---------- 图片 ---------- */
.markdown-body img {
  max-width: 100%;
  height: auto;
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-surface);
}

/* ---------- 定义列表 ---------- */
.markdown-body dl {
  margin: 0 0 16px;
}
.markdown-body dt {
  font-weight: ${EMPHASIZED_WEIGHT.title};
  margin-top: 8px;
}
.markdown-body dd {
  margin: 0 0 8px 1.5em;
}

/* ---------- 脚注 ---------- */
.markdown-body .footnotes {
  margin-top: 24px;
  padding-top: 12px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  font-size: ${TYPE.bodyMedium.size}px;
  color: var(--md-sys-color-on-surface-variant);
}
.markdown-body .footnotes hr {
  display: none;
}
.markdown-body .footnote-ref {
  color: var(--md-sys-color-primary);
  text-decoration: none;
  font-size: 0.85em;
}
.markdown-body .footnote-backref {
  color: var(--md-sys-color-primary);
  text-decoration: none;
}

/* ---------- KaTeX 公式 ---------- */
.markdown-body .katex {
  font-size: 1.1em;
  line-height: 1.2;
}
.markdown-body .katex-display {
  display: block;
  margin: 1.2em 0;
  text-align: center;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.4em 0;
}
.markdown-body .katex-display > .katex {
  font-size: 1.21em;
  white-space: nowrap;
  display: inline-block;
}
.markdown-body .katex-error {
  color: var(--md-sys-color-error);
  font-family: var(--md-sys-typescale-font-mono);
  background: var(--md-sys-color-surface-container-high);
  padding: 0.1em 0.4em;
  border-radius: var(--md-sys-shape-corner-medium);
}

/* ---------- Mermaid ---------- */
.markdown-body .mermaid {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 16px 0;
  text-align: center;
}
.markdown-body .mermaid svg {
  max-width: 100%;
  height: auto;
}

/* ---------- 自定义容器（markdown-it-container） ---------- */
.markdown-body .md-container {
  margin: 0 0 16px;
  padding: 0.75em 1em;
  border-radius: var(--md-sys-shape-corner-large);
  border-left: 0.3em solid var(--md-sys-color-outline);
  background: var(--md-sys-color-surface-container-low);
}
.markdown-body .md-container .md-container-kind {
  font-size: ${TYPE.labelLarge.size}px;
  font-weight: ${EMPHASIZED_WEIGHT.label};
  color: var(--md-sys-color-on-surface-variant);
  margin-bottom: 0.125em;
}
.markdown-body .md-container .md-container-title {
  font-weight: ${EMPHASIZED_WEIGHT.title};
  margin-bottom: 0.25em;
}
.markdown-body .md-container.note {
  border-left-color: var(--md-sys-color-primary);
}
.markdown-body .md-container.tip {
  border-left-color: var(--md-sys-color-secondary);
}
.markdown-body .md-container.warning {
  border-left-color: var(--md-sys-color-tertiary);
}
.markdown-body .md-container.danger {
  border-left-color: var(--md-sys-color-error);
}
.markdown-body .md-container p:last-child {
  margin-bottom: 0;
}

/* ---------- 滚动条（用于代码/表格横向滚动，尽量弱化） ---------- */
.markdown-body pre > code::-webkit-scrollbar,
.markdown-body table::-webkit-scrollbar,
.markdown-body .katex-display::-webkit-scrollbar {
  height: 8px;
}
.markdown-body pre > code::-webkit-scrollbar-thumb,
.markdown-body table::-webkit-scrollbar-thumb,
.markdown-body .katex-display::-webkit-scrollbar-thumb {
  background: var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-extra-small);
}
`
}

/*
 * 仍写 `em` 的六处字号，都是「随所在层级等比缩放」的行内尺寸，不是绝对档位：
 *   sub / sup 0.75em、.footnote-ref 0.85em      —— 上下标与脚注角标
 *   code / kbd / pre / samp / tt 0.875em         —— 行内等宽文本
 *   pre > code 0.875em                           —— 代码块内文（基准是 pre 的 0.875em）
 *   .katex 1.1em、.katex-display > .katex 1.21em —— KaTeX 内部全靠 em 缩放
 * 锚成绝对 px 会让标题里的公式、行内代码比周围正文小，属于改版式。
 */
