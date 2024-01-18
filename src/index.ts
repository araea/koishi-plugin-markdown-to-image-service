import {Context, h, Schema, Service} from 'koishi'

import * as fs from "fs";
import path from "node:path";
import {promisify} from 'util';
import {Notebook} from "crossnote"
import find from 'puppeteer-finder';
import {languages} from "crossnote/out/types/src/prism/prism";
import awk = languages.awk;

export const name = 'markdown-to-image-service'
export const usage = `
<style>
        code[class*=language-], pre[class*=language-] {
            color: #333;
            background: 0 0;
            font-family: Consolas, "Liberation Mono", Menlo, Courier, monospace;
            text-align: left;
            white-space: pre;
            word-spacing: normal;
            word-break: normal;
            word-wrap: normal;
            line-height: 1.4;
            -moz-tab-size: 8;
            -o-tab-size: 8;
            tab-size: 8;
            -webkit-hyphens: none;
            -moz-hyphens: none;
            -ms-hyphens: none;
            hyphens: none
        }
                pre[class*=language-] {
            padding: .8em;
            overflow: auto;
            border-radius: 3px;
            background: #f5f5f5
        }

        :not(pre) > code[class*=language-] {
            padding: .1em;
            border-radius: .3em;
            white-space: normal;
            background: #f5f5f5
        }
              .token.blockquote, .token.comment {
            color: #969896
        }

        .token.cdata {
            color: #183691
        }

        .token.doctype, .token.macro.property, .token.punctuation, .token.variable {
            color: #333
        }

        .token.builtin, .token.important, .token.keyword, .token.operator, .token.rule {
            color: #a71d5d
        }

        .token.attr-value, .token.regex, .token.string, .token.url {
            color: #183691
        }

        .token.atrule, .token.boolean, .token.code, .token.command, .token.constant, .token.entity, .token.number, .token.property, .token.symbol {
            color: #0086b3
        }

        .token.prolog, .token.selector, .token.tag {
            color: #63a35c
        }

        .token.attr-name, .token.class, .token.class-name, .token.function, .token.id, .token.namespace, .token.pseudo-class, .token.pseudo-element, .token.url-reference .token.variable {
            color: #795da3
        }

        .token.entity {
            cursor: help
        }

        .token.title, .token.title .token.punctuation {
            font-weight: 700;
            color: #1d3e81
        }

        .token.list {
            color: #ed6a43
        }

        .token.inserted {
            background-color: #eaffea;
            color: #55a532
        }

        .token.deleted {
            background-color: #ffecec;
            color: #bd2c00
        }

        .token.bold {
            font-weight: 700
        }

        .token.italic {
            font-style: italic
        }

        .language-json .token.property {
            color: #183691
        }

        .language-markup .token.tag .token.punctuation {
            color: #333
        }

        .language-css .token.function, code.language-css {
            color: #0086b3
        }

        .language-yaml .token.atrule {
            color: #63a35c
        }

        code.language-yaml {
            color: #183691
        }

        .language-ruby .token.function {
            color: #333
        }

        .language-markdown .token.url {
            color: #795da3
        }

        .language-makefile .token.symbol {
            color: #795da3
        }

        .language-makefile .token.variable {
            color: #183691
        }

        .language-makefile .token.builtin {
            color: #0086b3
        }

        .language-bash .token.keyword {
            color: #0086b3
        }

        pre[data-line] {
            position: relative;
            padding: 1em 0 1em 3em
        }

        pre[data-line] .line-highlight-wrapper {
            position: absolute;
            top: 0;
            left: 0;
            background-color: transparent;
            display: block;
            width: 100%
        }

        pre[data-line] .line-highlight {
            position: absolute;
            left: 0;
            right: 0;
            margin-top: 1em;
            background: hsla(24, 20%, 50%, .08);
            background: linear-gradient(to right, hsla(24, 20%, 50%, .1) 70%, hsla(24, 20%, 50%, 0));
            pointer-events: none;
            line-height: inherit;
            white-space: pre
        }

        pre[data-line] .line-highlight:before, pre[data-line] .line-highlight[data-end]:after {
            content: attr(data-start);
            position: absolute;
            top: .4em;
            left: .6em;
            min-width: 1em;
            padding: 0 .5em;
            background-color: hsla(24, 20%, 50%, .4);
            color: #f4f1ef;
            font: bold 65%/1.5 sans-serif;
            text-align: center;
            vertical-align: .3em;
            border-radius: 999px;
            text-shadow: none;
            box-shadow: 0 1px #fff
        }

        pre[data-line] .line-highlight[data-end]:after {
            content: attr(data-end);
            top: auto;
            bottom: .4em
        }
                html body {
            font-family: 'Helvetica Neue', Helvetica, 'Segoe UI', Arial, freesans, sans-serif;
            font-size: 16px;
            line-height: 1.6;
            color: #333;
            background-color: #fff;
            overflow: initial;
            box-sizing: border-box;
            word-wrap: break-word
        }
            html body > :first-child {
            margin-top: 0
        }

        html body h1, html body h2, html body h3, html body h4, html body h5, html body h6 {
            line-height: 1.2;
            margin-top: 1em;
            margin-bottom: 16px;
            color: #000
        }

        html body h1 {
            font-size: 2.25em;
            font-weight: 300;
            padding-bottom: .3em
        }

        html body h2 {
            font-size: 1.75em;
            font-weight: 400;
            padding-bottom: .3em
        }

        html body h3 {
            font-size: 1.5em;
            font-weight: 500
        }

        html body h4 {
            font-size: 1.25em;
            font-weight: 600
        }

        html body h5 {
            font-size: 1.1em;
            font-weight: 600
        }

        html body h6 {
            font-size: 1em;
            font-weight: 600
        }

        html body h1, html body h2, html body h3, html body h4, html body h5 {
            font-weight: 600
        }

        html body h5 {
            font-size: 1em
        }

        html body h6 {
            color: #5c5c5c
        }

        html body strong {
            color: #000
        }

        html body del {
            color: #5c5c5c
        }

        html body a:not([href]) {
            color: inherit;
            text-decoration: none
        }

        html body a {
            color: #08c;
            text-decoration: none
        }

        html body a:hover {
            color: #00a3f5;
            text-decoration: none
        }

        html body img {
            max-width: 100%
        }

        html body > p {
            margin-top: 0;
            margin-bottom: 16px;
            word-wrap: break-word
        }

        html body > ol, html body > ul {
            margin-bottom: 16px
        }

        html body ol, html body ul {
            padding-left: 2em
        }

        html body ol.no-list, html body ul.no-list {
            padding: 0;
            list-style-type: none
        }

        html body ol ol, html body ol ul, html body ul ol, html body ul ul {
            margin-top: 0;
            margin-bottom: 0
        }

        html body li {
            margin-bottom: 0
        }

        html body li.task-list-item {
            list-style: none
        }

        html body li > p {
            margin-top: 0;
            margin-bottom: 0
        }

        html body .task-list-item-checkbox {
            margin: 0 .2em .25em -1.8em;
            vertical-align: middle
        }

        html body .task-list-item-checkbox:hover {
            cursor: pointer
        }

        html body blockquote {
            margin: 16px 0;
            font-size: inherit;
            padding: 0 15px;
            color: #5c5c5c;
            background-color: #f0f0f0;
            border-left: 4px solid #d6d6d6
        }

        html body blockquote > :first-child {
            margin-top: 0
        }

        html body blockquote > :last-child {
            margin-bottom: 0
        }

        html body hr {
            height: 4px;
            margin: 32px 0;
            background-color: #d6d6d6;
            border: 0 none
        }

        html body table {
            margin: 10px 0 15px 0;
            border-collapse: collapse;
            border-spacing: 0;
            display: block;
            width: 100%;
            overflow: auto;
            word-break: normal;
            word-break: keep-all
        }

        html body table th {
            font-weight: 700;
            color: #000
        }

        html body table td, html body table th {
            border: 1px solid #d6d6d6;
            padding: 6px 13px
        }

        html body dl {
            padding: 0
        }

        html body dl dt {
            padding: 0;
            margin-top: 16px;
            font-size: 1em;
            font-style: italic;
            font-weight: 700
        }

        html body dl dd {
            padding: 0 16px;
            margin-bottom: 16px
        }

        html body code {
            font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
            font-size: .85em;
            color: #000;
            background-color: #f0f0f0;
            border-radius: 3px;
            padding: .2em 0
        }

        html body code::after, html body code::before {
            letter-spacing: -.2em;
            content: '\\00a0'
        }

        html body pre > code {
            padding: 0;
            margin: 0;
            word-break: normal;
            white-space: pre;
            background: 0 0;
            border: 0
        }

        html body .highlight {
            margin-bottom: 16px
        }

        html body .highlight pre, html body pre {
            padding: 1em;
            overflow: auto;
            line-height: 1.45;
            border: #d6d6d6;
            border-radius: 3px
        }

        html body .highlight pre {
            margin-bottom: 0;
            word-break: normal
        }

        html body pre code, html body pre tt {
            display: inline;
            max-width: initial;
            padding: 0;
            margin: 0;
            overflow: initial;
            line-height: inherit;
            word-wrap: normal;
            background-color: transparent;
            border: 0
        }

        html body pre code:after, html body pre code:before, html body pre tt:after, html body pre tt:before {
            content: normal
        }

        html body blockquote, html body dl, html body ol, html body p, html body pre, html body ul {
            margin-top: 0;
            margin-bottom: 16px
        }

        html body kbd {
            color: #000;
            border: 1px solid #d6d6d6;
            border-bottom: 2px solid #c7c7c7;
            padding: 2px 4px;
            background-color: #f0f0f0;
            border-radius: 3px
        }

        @media print {
            html body {
                background-color: #fff
            }

            html body h1, html body h2, html body h3, html body h4, html body h5, html body h6 {
                color: #000;
                page-break-after: avoid
            }

            html body blockquote {
                color: #5c5c5c
            }

            html body pre {
                page-break-inside: avoid
            }

            html body table {
                display: table
            }

            html body img {
                display: block;
                max-width: 100%;
                max-height: 100%
            }

            html body code, html body pre {
                word-wrap: break-word;
                white-space: pre
            }
        }

        .markdown-preview {
            width: 100%;
            height: 100%;
            box-sizing: border-box
        }

        .markdown-preview ul {
            list-style: disc
        }

        .markdown-preview ul ul {
            list-style: circle
        }

        .markdown-preview ul ul ul {
            list-style: square
        }

        .markdown-preview ol {
            list-style: decimal
        }

        .markdown-preview ol ol, .markdown-preview ul ol {
            list-style-type: lower-roman
        }

        .markdown-preview ol ol ol, .markdown-preview ol ul ol, .markdown-preview ul ol ol, .markdown-preview ul ul ol {
            list-style-type: lower-alpha
        }

        .markdown-preview .newpage, .markdown-preview .pagebreak {
            page-break-before: always
        }

        .markdown-preview pre.line-numbers {
            position: relative;
            padding-left: 3.8em;
            counter-reset: linenumber
        }

        .markdown-preview pre.line-numbers > code {
            position: relative
        }

        .markdown-preview pre.line-numbers .line-numbers-rows {
            position: absolute;
            pointer-events: none;
            top: 1em;
            font-size: 100%;
            left: 0;
            width: 3em;
            letter-spacing: -1px;
            border-right: 1px solid #999;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none
        }

        .markdown-preview pre.line-numbers .line-numbers-rows > span {
            pointer-events: none;
            display: block;
            counter-increment: linenumber
        }

        .markdown-preview pre.line-numbers .line-numbers-rows > span:before {
            content: counter(linenumber);
            color: #999;
            display: block;
            padding-right: .8em;
            text-align: right
        }

        .markdown-preview .mathjax-exps .MathJax_Display {
            text-align: center !important
        }

        .markdown-preview:not([data-for=preview]) .code-chunk .code-chunk-btn-group {
            display: none
        }

        .markdown-preview:not([data-for=preview]) .code-chunk .status {
            display: none
        }

        .markdown-preview:not([data-for=preview]) .code-chunk .output-div {
            margin-bottom: 16px
        }

        .markdown-preview .md-toc {
            padding: 0
        }

        .markdown-preview .md-toc .md-toc-link-wrapper .md-toc-link {
            display: inline;
            padding: .25rem 0
        }

        .markdown-preview .md-toc .md-toc-link-wrapper .md-toc-link div, .markdown-preview .md-toc .md-toc-link-wrapper .md-toc-link p {
            display: inline
        }

        .markdown-preview .md-toc .md-toc-link-wrapper.highlighted .md-toc-link {
            font-weight: 800
        }

        .scrollbar-style::-webkit-scrollbar {
            width: 8px
        }

        .scrollbar-style::-webkit-scrollbar-track {
            border-radius: 10px;
            background-color: transparent
        }

        .scrollbar-style::-webkit-scrollbar-thumb {
            border-radius: 5px;
            background-color: rgba(150, 150, 150, .66);
            border: 4px solid rgba(150, 150, 150, .66);
            background-clip: content-box
        }

        html body[for=html-export]:not([data-presentation-mode]) {
            position: relative;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            margin: 0;
            padding: 0;
            overflow: auto
        }

        html body[for=html-export]:not([data-presentation-mode]) .markdown-preview {
            position: relative;
            top: 0;
            min-height: 100vh
        }
         html body[for=html-export]:not([data-presentation-mode]) #sidebar-toc-btn {
            position: fixed;
            bottom: 8px;
            left: 8px;
            font-size: 28px;
            cursor: pointer;
            color: inherit;
            z-index: 99;
            width: 32px;
            text-align: center;
            opacity: .4
        }

        html body[for=html-export]:not([data-presentation-mode])[html-show-sidebar-toc] #sidebar-toc-btn {
            opacity: 1
        }

        html body[for=html-export]:not([data-presentation-mode])[html-show-sidebar-toc] .md-sidebar-toc {
            position: fixed;
            top: 0;
            left: 0;
            width: 300px;
            height: 100%;
            padding: 32px 0 48px 0;
            font-size: 14px;
            box-shadow: 0 0 4px rgba(150, 150, 150, .33);
            box-sizing: border-box;
            overflow: auto;
            background-color: inherit
        }

        html body[for=html-export]:not([data-presentation-mode])[html-show-sidebar-toc] .md-sidebar-toc::-webkit-scrollbar {
            width: 8px
        }

        html body[for=html-export]:not([data-presentation-mode])[html-show-sidebar-toc] .md-sidebar-toc::-webkit-scrollbar-track {
            border-radius: 10px;
            background-color: transparent
        }

        html body[for=html-export]:not([data-presentation-mode])[html-show-sidebar-toc] .md-sidebar-toc::-webkit-scrollbar-thumb {
            border-radius: 5px;
            background-color: rgba(150, 150, 150, .66);
            border: 4px solid rgba(150, 150, 150, .66);
            background-clip: content-box
        }

        html body[for=html-export]:not([data-presentation-mode])[html-show-sidebar-toc] .md-sidebar-toc a {
            text-decoration: none
        }

        html body[for=html-export]:not([data-presentation-mode])[html-show-sidebar-toc] .md-sidebar-toc .md-toc {
            padding: 0 16px
        }

        html body[for=html-export]:not([data-presentation-mode])[html-show-sidebar-toc] .md-sidebar-toc .md-toc .md-toc-link-wrapper .md-toc-link {
            display: inline;
            padding: .25rem 0
        }

        html body[for=html-export]:not([data-presentation-mode])[html-show-sidebar-toc] .md-sidebar-toc .md-toc .md-toc-link-wrapper .md-toc-link div, html body[for=html-export]:not([data-presentation-mode])[html-show-sidebar-toc] .md-sidebar-toc .md-toc .md-toc-link-wrapper .md-toc-link p {
            display: inline
        }

        html body[for=html-export]:not([data-presentation-mode])[html-show-sidebar-toc] .md-sidebar-toc .md-toc .md-toc-link-wrapper.highlighted .md-toc-link {
            font-weight: 800
        }

        html body[for=html-export]:not([data-presentation-mode])[html-show-sidebar-toc] .markdown-preview {
            left: 300px;
            width: calc(100% - 300px);
            padding: 2em calc(50% - 457px - 300px / 2);
            margin: 0;
            box-sizing: border-box
        }
         html body[for=html-export]:not([data-presentation-mode]):not([html-show-sidebar-toc]) .markdown-preview {
            left: 50%;
            transform: translateX(-50%)
        }

        html body[for=html-export]:not([data-presentation-mode]):not([html-show-sidebar-toc]) .md-sidebar-toc {
            display: none
        }

</style>

<h2 id="-使用">🌈 使用 </h2>
<p>当您在 Markdown 中引用本地图片时，务必使用<strong>相对路径</strong>。相对路径的根目录位于：<code>./data/notebook</code>。</p>
<p>例如，在 <code>notebook</code> 文件夹内有名为 <code>0.png</code> 的图片，那么您需要使用一下方式在 Markdown 中引用该图片：</p>
<pre data-role="codeBlock" data-info="markdown" class="language-markdown markdown"><code><span class="token url"><span class="token operator">!</span>[<span class="token content">图片介绍</span>](<span class="token url">0.png</span>)</span>
</code></pre><h2 id="-指令">🌼 指令 </h2>
<ul>
<li><code>markdownToImage [markdownText]</code>：将 Markdown 文本转换为图片。</li>
</ul>
<h2 id="-服务">☕ 服务 </h2>
<ul>
<li><code>ctx.markdownToImage.convertToImage(markdownText: string): Promise&lt;Buffer&gt;</code></li>
</ul>
<h3 id="-示例">🌰 示例 </h3>
<pre data-role="codeBlock" data-info="typescript" class="language-typescript typescript"><code><span class="token comment">// index.ts</span>
<span class="token keyword keyword-import">import</span> <span class="token punctuation">{</span> Context <span class="token punctuation">}</span> <span class="token keyword keyword-from">from</span> <span class="token string">'koishi'</span>
<span class="token keyword keyword-import">import</span> <span class="token punctuation">{</span> <span class="token punctuation">}</span> <span class="token keyword keyword-from">from</span> <span class="token string">'koishi-plugin-markdown-to-image-service'</span>

<span class="token keyword keyword-export">export</span> <span class="token keyword keyword-const">const</span> inject <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token string">'markdownToImage'</span><span class="token punctuation">]</span>

<span class="token keyword keyword-export">export</span> <span class="token keyword keyword-async">async</span> <span class="token keyword keyword-function">function</span> <span class="token function">apply</span><span class="token punctuation">(</span>ctx<span class="token operator">:</span> Context<span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword keyword-const">const</span> imageBuffer <span class="token operator">=</span> <span class="token keyword keyword-await">await</span> ctx<span class="token punctuation">.</span>markdownToImage<span class="token punctuation">.</span><span class="token function">convertToImage</span><span class="token punctuation">(</span><span class="token string">'# Hello'</span><span class="token punctuation">)</span>
  <span class="token keyword keyword-return">return</span> h<span class="token punctuation">.</span><span class="token function">image</span><span class="token punctuation">(</span>imageBuffer<span class="token punctuation">,</span> <span class="token string">'image/png'</span><span class="token punctuation">)</span> <span class="token comment">// 'image/png', 'image/jpeg'</span>
<span class="token punctuation">}</span>
</code></pre><h2 id="-致谢">🍧 致谢 </h2>
<ul>
<li><a href="https://koishi.chat/">Koishi</a> - 提供机器人框架支持</li>
<li><a href="https://github.com/shd101wyy/crossnote">crossnote</a> - 提供 Markdown 渲染引擎支持</li>
</ul>
<h2 id="-license">✨ License </h2>
<p>MIT © 2023</p>
`

export interface Config {
  enableAutoCacheClear: boolean
  enableRunAllCodeChunks: boolean;
  defaultImageFormat: string;

  mermaidTheme: 'default' | 'dark' | 'forest';
  codeBlockTheme: "auto.css" | "default.css" | "atom-dark.css" | "atom-light.css" | "atom-material.css" | "coy.css" | "darcula.css" | "dark.css" | "funky.css" | "github.css" | "github-dark.css" | "hopscotch.css" | "monokai.css" | "okaidia.css" | "one-dark.css" | "one-light.css" | "pen-paper-coffee.css" | "pojoaque.css" | "solarized-dark.css" | "solarized-light.css" | "twilight.css" | "vue.css" | "vs.css" | "xonokai.css";
  previewTheme: "atom-dark.css" | "atom-light.css" | "atom-material.css" | "github-dark.css" | "github-light.css" | "gothic.css" | "medium.css" | "monokai.css" | "newsprint.css" | "night.css" | "none.css" | "one-dark.css" | "one-light.css" | "solarized-dark.css" | "solarized-light.css" | "vue.css";
  revealjsTheme: "beige.css" | "black.css" | "blood.css" | "league.css" | "moon.css" | "night.css" | "serif.css" | "simple.css" | "sky.css" | "solarized.css" | "white.css" | "none.css";

  breakOnSingleNewLine: boolean;
  enableLinkify: boolean;
  enableWikiLinkSyntax: boolean;
  enableEmojiSyntax: boolean;
  enableExtendedTableSyntax: boolean;
  enableCriticMarkupSyntax: boolean;
  frontMatterRenderingOption: 'none' | 'table' | 'code';
  enableScriptExecution: boolean;
  enableHTML5Embed: boolean;
  HTML5EmbedUseImageSyntax: boolean;
  HTML5EmbedUseLinkSyntax: boolean;
  HTML5EmbedIsAllowedHttp: boolean;
  HTML5EmbedAudioAttributes: string;
  HTML5EmbedVideoAttributes: string;

  mathRenderingOption: "KaTeX" | "MathJax" | "None";
  mathInlineDelimiters: [string, string][];
  mathBlockDelimiters: [string, string][];
  mathRenderingOnlineService: string;
  mathjaxV3ScriptSrc: string;

  enableOffline: boolean;
  printBackground: boolean;
  chromePath: string;
  puppeteerArgs: string[];

  protocolsWhiteList: string;
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    enableAutoCacheClear: Schema.boolean().default(true).description('是否启动自动删除缓存功能。'),
    enableRunAllCodeChunks: Schema.boolean().default(false).description('文本转图片时是否执行代码块里的代码。'),
    defaultImageFormat: Schema.union(['png', 'jpeg']).default('png').description('文本转图片时默认渲染的图片格式。'),
  }).description('基础设置'),
  Schema.object({
    mermaidTheme: Schema.union(['default', 'dark', 'forest']).default('default').description('Mermaid 主题。'),
    codeBlockTheme: Schema.union([
      'auto.css',
      'default.css',
      'atom-dark.css',
      'atom-light.css',
      'atom-material.css',
      'coy.css',
      'darcula.css',
      'dark.css',
      'funky.css',
      'github.css',
      'github-dark.css',
      'hopscotch.css',
      'monokai.css',
      'okaidia.css',
      'one-dark.css',
      'one-light.css',
      'pen-paper-coffee.css',
      'pojoaque.css',
      'solarized-dark.css',
      'solarized-light.css',
      'twilight.css',
      'vue.css',
      'vs.css',
      'xonokai.css'
    ]).default('auto.css').description('代码块主题。如果选择 `auto.css`，那么将选择与当前预览主题最匹配的代码块主题。'),
    previewTheme: Schema.union([
      'atom-dark.css',
      'atom-light.css',
      'atom-material.css',
      'github-dark.css',
      'github-light.css',
      'gothic.css',
      'medium.css',
      'monokai.css',
      'newsprint.css',
      'night.css',
      'none.css',
      'one-dark.css',
      'one-light.css',
      'solarized-dark.css',
      'solarized-light.css',
      'vue.css'
    ]).default('github-light.css').description('预览主题。'),
    revealjsTheme: Schema.union([
      'beige.css',
      'black.css',
      'blood.css',
      'league.css',
      'moon.css',
      'night.css',
      'serif.css',
      'simple.css',
      'sky.css',
      'solarized.css',
      'white.css',
      'none.css',
    ]).default('white.css').description('Revealjs 演示主题。')

  }).description('主题相关设置'),
  Schema.object({
    breakOnSingleNewLine: Schema.boolean().default(true).description('在 Markdown 中，单个换行符不会在生成的 HTML 中导致换行。在 GitHub Flavored Markdown 中，情况并非如此。启用此配置选项以在渲染的 HTML 中为 Markdown 源中的单个换行符插入换行。'),
    enableLinkify: Schema.boolean().default(true).description('启用将类似 URL 的文本转换为 Markdown 预览中的链接。'),
    enableWikiLinkSyntax: Schema.boolean().default(true).description('启用 Wiki 链接语法支持。更多信息可以在 https://help.github.com/articles/adding-links-to-wikis/ 找到。如果选中，我们将使用 GitHub 风格的管道式 Wiki 链接，即 [[linkText|wikiLink]]。否则，我们将使用 [[wikiLink|linkText]] 作为原始 Wikipedia 风格。'),
    enableEmojiSyntax: Schema.boolean().default(true).description('启用 emoji 和 font-awesome 插件。这仅适用于 markdown-it 解析器，而不适用于 pandoc 解析器。'),
    enableExtendedTableSyntax: Schema.boolean().default(false).description('启用扩展表格语法以支持合并表格单元格。'),
    enableCriticMarkupSyntax: Schema.boolean().default(false).description('启用 CriticMarkup 语法。仅适用于 markdown-it 解析器。'),
    frontMatterRenderingOption: Schema.union(['none', 'table', 'code']).default('none').description('Front matter 渲染选项。'),
    enableScriptExecution: Schema.boolean().default(false).description('启用执行代码块和导入 javascript 文件。这也启用了侧边栏目录。⚠ ️ 请谨慎使用此功能，因为它可能会使您的安全受到威胁！如果在启用脚本执行的情况下，有人让您打开带有恶意代码的 markdown，您的计算机可能会被黑客攻击。'),
    enableHTML5Embed: Schema.boolean().default(false).description('启用将音频视频链接转换为 html5 嵌入音频视频标签。内部启用了 markdown-it-html5-embed 插件。'),
    HTML5EmbedUseImageSyntax: Schema.boolean().default(true).description(`使用 ! [] () 语法启用视频/音频嵌入（默认）。`),
    HTML5EmbedUseLinkSyntax: Schema.boolean().default(false).description('使用 [] () 语法启用视频/音频嵌入。'),
    HTML5EmbedIsAllowedHttp: Schema.boolean().default(false).description('当 URL 中有 http:// 协议时嵌入媒体。当为 false 时忽略并且不嵌入它们。'),
    HTML5EmbedAudioAttributes: Schema.string().default('controls preload="metadata" width="320"').description('传递给音频标签的 HTML 属性。'),
    HTML5EmbedVideoAttributes: Schema.string().default('controls preload="metadata" width="320" height="240"').description('传递给视频标签的 HTML 属性。'),
  }).description('Markdown 解析相关设置'),
  Schema.object({
    mathRenderingOption: Schema.union(['KaTeX', 'MathJax', 'None']).default('KaTeX').description('数学渲染引擎。'),
    mathInlineDelimiters: Schema.array(Schema.array(String)).collapse().default([["$", "$"], ["\\(", "\\)"]]).description('数学公式行内分隔符。'),
    mathBlockDelimiters: Schema.array(Schema.array(String)).collapse().default([["$", "$"], ["\\[", "\\]"]]).description('数学公式块分隔符。'),
    mathRenderingOnlineService: Schema.union(['https://latex.codecogs.com/gif.latex', 'https://latex.codecogs.com/svg.latex', 'https://latex.codecogs.com/png.latex']).default('https://latex.codecogs.com/gif.latex').description('数学公式渲染在线服务。'),
    mathjaxV3ScriptSrc: Schema.string().role('link').default('https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js').description('MathJax 脚本资源。')
  }).description('数学公式渲染设置'),
  Schema.object({
    enableOffline: Schema.boolean().default(false).description('是否离线使用 html。'),
    printBackground: Schema.boolean().default(false).description('是否为文件导出打印背景。如果设置为 `false`，则将使用 `github-light` 预览主题。您还可以为单个文件设置 `print_background`。'),
    chromePath: Schema.path().default('').description('Chrome / Edge 可执行文件路径，用于 Puppeteer 导出。留空表示路径将自动找到。'),
    puppeteerArgs: Schema.array(String).default([]).description('传递给 puppeteer.launch({args: $puppeteerArgs}) 的参数，例如 `[\'--no-sandbox\', \'--disable-setuid-sandbox\']`。'),
  }).description('导出与渲染设置'),
  Schema.object({
    protocolsWhiteList: Schema.string().default('http://, https://, atom://, file://, mailto:, tel:').description('链接的接受协议白名单。'),
  }).description('其他设置'),
]) as any


// 声明合并 Context ctx.markdownToImage()
declare module 'koishi' {
  interface Context {
    markdownToImage: MarkdownToImageService
  }
}

class MarkdownToImageService extends Service {
  constructor(ctx: Context, private config: Config) {
    super(ctx, 'markdownToImage', true);
  }

  async convertToImage(markdownText: string): Promise<Buffer> {
    const logger = this.ctx.logger('markdownToImage')
    const notebookDirPath = path.join(this.ctx.baseDir, 'data', 'notebook');

    async function ensureDirExists(dirPath: string) {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, {recursive: true});
      }
    }

    async function ensureFileExists(filePath: string) {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '', 'utf-8');
      }
    }

    await ensureDirExists(notebookDirPath)
    let {
      enableAutoCacheClear,
      enableRunAllCodeChunks,
      defaultImageFormat,
      enableOffline,
      breakOnSingleNewLine,
      enableLinkify,
      mathRenderingOption,
      mathInlineDelimiters,
      mathBlockDelimiters,
      mathRenderingOnlineService,
      mathjaxV3ScriptSrc,
      enableWikiLinkSyntax,
      enableEmojiSyntax,
      enableExtendedTableSyntax,
      enableCriticMarkupSyntax,
      frontMatterRenderingOption,
      mermaidTheme,
      codeBlockTheme,
      previewTheme,
      revealjsTheme,
      protocolsWhiteList,
      printBackground,
      chromePath,
      enableScriptExecution,
      enableHTML5Embed,
      HTML5EmbedUseImageSyntax,
      HTML5EmbedUseLinkSyntax,
      HTML5EmbedIsAllowedHttp,
      HTML5EmbedAudioAttributes,
      HTML5EmbedVideoAttributes,
      puppeteerArgs,
    } = this.config;
    const executablePath = await find();
    if (!chromePath) chromePath = executablePath
    const notebook = await Notebook.init({
      notebookPath: notebookDirPath,
      config: {
        breakOnSingleNewLine,
        enableLinkify,
        mathRenderingOption,
        mathInlineDelimiters,
        mathBlockDelimiters,
        mathRenderingOnlineService,
        mathjaxV3ScriptSrc,
        enableWikiLinkSyntax,
        enableEmojiSyntax,
        enableExtendedTableSyntax,
        enableCriticMarkupSyntax,
        frontMatterRenderingOption,
        mermaidTheme,
        codeBlockTheme,
        previewTheme,
        revealjsTheme,
        protocolsWhiteList,
        printBackground,
        chromePath,
        enableScriptExecution,
        enableHTML5Embed,
        HTML5EmbedUseImageSyntax,
        HTML5EmbedUseLinkSyntax,
        HTML5EmbedIsAllowedHttp,
        HTML5EmbedAudioAttributes,
        HTML5EmbedVideoAttributes,
        puppeteerArgs,
      },
    });


    const asyncUnlink = promisify(fs.unlink);

    function getCurrentTimeNumberString(): string {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    async function generateAndSaveImage(notebookDirPath: string, markdownText: string, defaultImageFormat: string, enableRunAllCodeChunks: boolean): Promise<Buffer> {
      const currentTimeString = getCurrentTimeNumberString();
      const readmeFilePath = path.join(notebookDirPath, `${currentTimeString}.md`);
      await fs.promises.writeFile(readmeFilePath, markdownText);

      const engine = notebook.getNoteMarkdownEngine(readmeFilePath);
      await engine.chromeExport({fileType: defaultImageFormat, runAllCodeChunks: enableRunAllCodeChunks});

      const readmeImagePath = path.join(notebookDirPath, `${currentTimeString}.${defaultImageFormat}`);
      const imageBuffer = fs.readFileSync(readmeImagePath);

      if (enableAutoCacheClear) {
        await asyncUnlink(readmeImagePath);
        await asyncUnlink(readmeFilePath);
      }

      return imageBuffer;
    }

    try {
      // 处理 imageBuffer
      return await generateAndSaveImage(notebookDirPath, markdownText, defaultImageFormat, enableRunAllCodeChunks)
    } catch (error) {
      logger.error('出错：', error);
    }


  }

  //
}

// export default MarkdownToImageService;

export function apply(ctx: Context, config: Config) {
  ctx.plugin(MarkdownToImageService, config)

  ctx.command('markdownToImage [markdownText:text]','将 Markdown 文本转换为图片')
    .action(async ({session}, markdownText) => {
      if (!markdownText) {
        await session.send('请输入你要转换的 Markdown 文本内容：')
        const userInput = await session.prompt()
        if (!userInput) return `输入超时。`
        markdownText = userInput
      }
      const markdownToImage = new MarkdownToImageService(ctx, config)
      const imageBuffer = await markdownToImage.convertToImage(markdownText)
      return h.image(imageBuffer, `image/${config.defaultImageFormat}`)
    })
}
