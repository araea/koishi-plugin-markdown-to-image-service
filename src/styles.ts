/**
 * 自包含的 Markdown 排版样式（替代外部 github-markdown-css 依赖）。
 * 通过 CSS 变量区分明暗主题，使用系统字体栈以覆盖中英文。
 */
export function baseCss(): string {
  return `
:root {
  color-scheme: light;
}
html[data-theme="dark"] {
  color-scheme: dark;
}

:root,
html[data-theme="light"] {
  --md-bg: #ffffff;
  --md-fg: #1f2328;
  --md-fg-muted: #59636e;
  --md-fg-faint: #818b98;
  --md-border: #d1d9e0;
  --md-border-strong: #b1bac4;
  --md-accent: #0969da;
  --md-accent-weak: rgba(9, 105, 218, 0.12);
  --md-code-bg: rgba(175, 184, 193, 0.22);
  --md-code-block-bg: #f6f8fa;
  --md-blockquote-bg: #f6f8fa;
  --md-blockquote-border: #d1d9e0;
  --md-table-header-bg: #f6f8fa;
  --md-table-stripe: #f6f8fa;
  --md-mark-bg: #fff8c5;
  --md-mark-fg: #1f2328;
  --md-ins-bg: #dafbe1;
  --md-danger: #d1242f;
  --md-kbd-bg: #f6f8fa;
  --md-kbd-border: #d1d9e0;
  --md-shadow: 0 0 0 1px rgba(31, 35, 40, 0.08);
}

html[data-theme="dark"] {
  --md-bg: #0d1117;
  --md-fg: #e6edf3;
  --md-fg-muted: #9198a1;
  --md-fg-faint: #6e7681;
  --md-border: #30363d;
  --md-border-strong: #3d444d;
  --md-accent: #4493f8;
  --md-accent-weak: rgba(68, 147, 248, 0.18);
  --md-code-bg: rgba(110, 118, 129, 0.4);
  --md-code-block-bg: #161b22;
  --md-blockquote-bg: #161b22;
  --md-blockquote-border: #3d444d;
  --md-table-header-bg: #161b22;
  --md-table-stripe: #161b22;
  --md-mark-bg: #bb8009;
  --md-mark-fg: #ffffff;
  --md-ins-bg: rgba(63, 185, 80, 0.22);
  --md-danger: #ff7b72;
  --md-kbd-bg: #161b22;
  --md-kbd-border: #3d444d;
  --md-shadow: 0 0 0 1px rgba(230, 237, 243, 0.1);
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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans",
    "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑",
    Helvetica, Arial, sans-serif;
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
  margin: 24px 0 16px;
  font-weight: 600;
  line-height: 1.3;
}

.markdown-body h1 {
  font-size: 2em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--md-border);
}
.markdown-body h2 {
  font-size: 1.5em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--md-border);
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

/* ---------- 段落与文本 ---------- */
.markdown-body p {
  margin: 0 0 16px;
}

.markdown-body a {
  color: var(--md-accent);
  text-decoration: none;
}
.markdown-body a:hover {
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
  border-radius: 3px;
  padding: 0.1em 0.2em;
}

.markdown-body ins {
  background: var(--md-ins-bg);
  text-decoration: none;
  border-radius: 3px;
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

.markdown-body hr {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
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
  border-radius: 0 6px 6px 0;
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
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: 0.875em;
}

.markdown-body code:not(.hljs) {
  background: var(--md-code-bg);
  color: var(--md-fg);
  padding: 0.2em 0.4em;
  margin: 0;
  border-radius: 6px;
  white-space: break-spaces;
}

.markdown-body pre {
  margin: 0 0 16px;
  padding: 0;
  border-radius: 8px;
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
  border-radius: 6px;
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
  border-radius: 6px;
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
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  background: var(--md-code-bg);
  padding: 0.1em 0.4em;
  border-radius: 6px;
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
  border-radius: 8px;
  border-left: 0.3em solid var(--md-border-strong);
  background: var(--md-blockquote-bg);
}
.markdown-body .md-container .md-container-title {
  font-weight: 600;
  margin-bottom: 0.25em;
}
.markdown-body .md-container.note {
  border-left-color: var(--md-accent);
}
.markdown-body .md-container.tip {
  border-left-color: #1a7f37;
}
.markdown-body .md-container.warning {
  border-left-color: #bf8700;
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
  border-radius: 4px;
}
`
}
