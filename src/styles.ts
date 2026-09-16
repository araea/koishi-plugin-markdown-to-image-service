import { FONT_STACK, MONO_STACK, scheme, SHAPE } from './m3'

/**
 * 自包含的 Markdown 排版样式。
 *
 * 明暗两套变量都由 Material 3 的色调板推出，与其它插件同源；
 * 代码高亮仍交给 highlight.js 的主题文件，那部分是语法着色，不归设计系统管。
 */

/** 文档类的主色取中性蓝：长文里主色只出现在链接和强调上，不该抢戏。 */
const HUE = 258
const LIGHT = scheme(HUE)
const DARK = scheme(HUE, true)

/** 把一套配色摊成 `--md-*` 变量。两套主题共用这张表，只有取值不同。 */
function vars(c: ReturnType<typeof scheme>, dark: boolean) {
  return `
  --md-bg: ${c.surface};
  --md-fg: ${c.onSurface};
  --md-fg-muted: ${c.onSurfaceVariant};
  --md-border: ${c.outlineVariant};
  --md-border-strong: ${c.outline};
  --md-accent: ${c.primary};
  --md-code-bg: ${c.surfaceContainerHigh};
  --md-code-block-bg: ${c.surfaceContainerLow};
  --md-blockquote-bg: ${c.surfaceContainerLow};
  --md-blockquote-border: ${c.primary};
  --md-table-header-bg: ${c.surfaceContainerHigh};
  --md-table-stripe: ${c.surfaceContainerLow};
  --md-mark-bg: ${c.tertiaryContainer};
  --md-mark-fg: ${c.onTertiaryContainer};
  --md-ins-bg: ${c.secondaryContainer};
  --md-danger: ${c.error};
  /* 提示 / 注意两类容器没有 M3 的角色，取次色与第三色：
     相邻的一对（说明与提示）共用蓝色系、只差彩度，警示那一类用对比色，与说明、危险都拉得开 */
  --md-tip-border: ${c.secondary};
  --md-warning-border: ${c.tertiary};
  --md-kbd-bg: ${c.surfaceContainerHigh};
  --md-kbd-border: ${c.outlineVariant};
  --md-radius-s: ${SHAPE.extraSmall}px;
  --md-radius-m: ${SHAPE.medium}px;
  --md-radius-l: ${SHAPE.large}px;
  --md-font: ${FONT_STACK};
  --md-font-mono: ${MONO_STACK};
  color-scheme: ${dark ? 'dark' : 'light'};`
}

export function baseCss(): string {
  return `
:root,
html[data-theme="light"] {${vars(LIGHT, false)}
}

html[data-theme="dark"] {${vars(DARK, true)}
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  background: var(--md-bg);
}

.markdown-body {
  background: var(--md-bg);
  color: var(--md-fg);
  font-family: var(--md-font);
  font-size: 16px;
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
  font-weight: 600;
  line-height: 1.3;
}

/* 层级靠字号与留白拉开，不再画下划线——线会把长文切得很碎 */
.markdown-body h1 {
  font-size: 2em;
  letter-spacing: -0.5px;
}
.markdown-body h2 {
  font-size: 1.5em;
  letter-spacing: -0.25px;
}
.markdown-body h3 {
  font-size: 1.25em;
}
.markdown-body h4 {
  font-size: 1em;
}
.markdown-body h5 {
  font-size: 0.875em;
}
.markdown-body h6 {
  font-size: 0.85em;
  color: var(--md-fg-muted);
}

.markdown-body p {
  margin: 0 0 16px;
}

/* 链接出图后没有 hover，下划线是颜色之外的第二条通道 */
.markdown-body a {
  color: var(--md-accent);
  text-decoration: underline;
}

.markdown-body strong {
  font-weight: 600;
}

.markdown-body del {
  color: var(--md-fg-muted);
}

.markdown-body mark {
  background: var(--md-mark-bg);
  color: var(--md-mark-fg);
  border-radius: var(--md-radius-s);
  padding: 0.1em 0.2em;
}

.markdown-body ins {
  background: var(--md-ins-bg);
  text-decoration: none;
  border-radius: var(--md-radius-s);
  padding: 0.1em 0.2em;
}

.markdown-body sub,
.markdown-body sup {
  font-size: 0.75em;
}

.markdown-body abbr[title] {
  border-bottom: 1px dotted var(--md-fg-muted);
  cursor: help;
  text-decoration: none;
}

/* 分隔线收到 1px：M3 里分隔线是最低一级的层次手段，粗了就成了装饰 */
.markdown-body hr {
  height: 1px;
  padding: 0;
  margin: 28px 0;
  background-color: var(--md-border);
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
  color: var(--md-fg-muted);
  border-left: 0.25em solid var(--md-blockquote-border);
  background: var(--md-blockquote-bg);
  border-radius: var(--md-radius-m);
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
  font-family: var(--md-font-mono);
  font-size: 0.875em;
}

.markdown-body code:not(.hljs) {
  background: var(--md-code-bg);
  color: var(--md-fg);
  padding: 0.2em 0.4em;
  margin: 0;
  border-radius: var(--md-radius-m);
  white-space: break-spaces;
}

.markdown-body pre {
  margin: 0 0 16px;
  padding: 0;
  border-radius: var(--md-radius-l);
  overflow: hidden;
  background: var(--md-code-block-bg);
  line-height: 1.5;
  border: 1px solid var(--md-border);
}

.markdown-body pre > code {
  display: block;
  padding: 16px;
  overflow-x: auto;
  background: transparent;
  color: var(--md-fg);
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
  background: var(--md-kbd-bg);
  border: 1px solid var(--md-kbd-border);
  border-bottom-color: var(--md-border-strong);
  border-radius: var(--md-radius-m);
  box-shadow: inset 0 -1px 0 var(--md-border);
  color: var(--md-fg);
  line-height: 1.2;
  vertical-align: middle;
}

/* ---------- 表格 ---------- */
.markdown-body table {
  border-spacing: 0;
  border-collapse: collapse;
  width: 100%;
  margin: 0 0 16px;
  font-size: 0.95em;
}
.markdown-body table th,
.markdown-body table td {
  padding: 6px 13px;
  border: 1px solid var(--md-border);
}
.markdown-body table tr {
  background-color: var(--md-bg);
}
.markdown-body table tr:nth-child(2n) {
  background-color: var(--md-table-stripe);
}
.markdown-body table th {
  font-weight: 600;
  background-color: var(--md-table-header-bg);
}

/* ---------- 图片 ---------- */
.markdown-body img {
  max-width: 100%;
  height: auto;
  border-radius: var(--md-radius-m);
  background: var(--md-bg);
}

/* ---------- 定义列表 ---------- */
.markdown-body dl {
  margin: 0 0 16px;
}
.markdown-body dt {
  font-weight: 600;
  margin-top: 8px;
}
.markdown-body dd {
  margin: 0 0 8px 1.5em;
}

/* ---------- 脚注 ---------- */
.markdown-body .footnotes {
  margin-top: 24px;
  padding-top: 12px;
  border-top: 1px solid var(--md-border);
  font-size: 0.875em;
  color: var(--md-fg-muted);
}
.markdown-body .footnotes hr {
  display: none;
}
.markdown-body .footnote-ref {
  color: var(--md-accent);
  text-decoration: none;
  font-size: 0.85em;
}
.markdown-body .footnote-backref {
  color: var(--md-accent);
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
  color: var(--md-danger);
  font-family: var(--md-font-mono);
  background: var(--md-code-bg);
  padding: 0.1em 0.4em;
  border-radius: var(--md-radius-m);
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
  border-radius: var(--md-radius-l);
  border-left: 0.3em solid var(--md-border-strong);
  background: var(--md-blockquote-bg);
}
.markdown-body .md-container .md-container-kind {
  font-size: 0.875em;
  font-weight: 600;
  color: var(--md-fg-muted);
  margin-bottom: 0.125em;
}
.markdown-body .md-container .md-container-title {
  font-weight: 600;
  margin-bottom: 0.25em;
}
.markdown-body .md-container.note {
  border-left-color: var(--md-accent);
}
.markdown-body .md-container.tip {
  border-left-color: var(--md-tip-border);
}
.markdown-body .md-container.warning {
  border-left-color: var(--md-warning-border);
}
.markdown-body .md-container.danger {
  border-left-color: var(--md-danger);
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
  background: var(--md-border-strong);
  border-radius: var(--md-radius-s);
}
`
}
