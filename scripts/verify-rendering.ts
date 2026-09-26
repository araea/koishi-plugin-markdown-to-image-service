import * as counter from '../../message-counter/src'
import { h } from 'koishi'
import puppeteer from 'puppeteer-core'
import { Context } from 'koishi'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import { html as board2048 } from '../../number-merge-game/src/render'
import { renderChart } from '../../monetary-rank/src/chart'
import { renderCard } from '../../monetary-rank/src/card'
import { boardCard, startCard } from '../../mcdle/src/view'
import { blockData } from '../../mcdle/src/data'
import { poolTable } from '../../azur-lane-building/src/render'
import { generateImage, generatePanelImage } from '../../wordle-game/src/services/renderer'
import { generateStyledHtml } from '../../wordle-game/src/html/tiles'
import { MarkdownToImageService, Config } from '../src'

async function main() {
 const out = await mkdtemp(path.join(tmpdir(), 'koishi-design-review-'))
 const browser = await puppeteer.launch({executablePath:process.env.CHROMIUM_PATH || '/data/data/com.termux/files/usr/bin/chromium-browser',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']})
 const errors: string[] = []
 const page = async () => {const p = await browser.newPage();p.on('pageerror',e=>errors.push(e.message));return p}
 const ctx = new Context();ctx.provide('puppeteer', {page} as any)
 const results: any[] = []
 async function capture(name:string,html:string,width=720) {
  const p = await page()
  try {
   await p.setViewport({width,height:400,deviceScaleFactor:1});await p.setContent(html,{waitUntil:'load'})
   await p.evaluate(()=>document.fonts.ready)
   const size = await p.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}))
   await p.setViewport({width:size.width,height:400,deviceScaleFactor:1})
   await p.screenshot({path:path.join(out,`${name}.png`),fullPage:true})
   assert.ok(size.width>100&&size.height>100)
   results.push({name,...size})
  }finally{await p.close()}
 }
 try {
  const grid = [[2,4,8,16],[32,64,128,256],[512,1024,2048,4096],[0,0,0,0]].map(row=>row.map(value=>value?{value}:null))
  await capture('2048',board2048({grid:grid as any,size:4,score:12345,best:99999}))
  const rows = Array.from({length:8},(_,i)=>({name:i===0?'很长的名字用于检查昵称截断保持原设计':'成员 '+i,userId:String(i),count:123456-i*11111,avatarBase64:'',accent:['#ffff00','#0000ff','#ff0000'][i%3]}))
  await capture('monetary-chart',renderChart('本频道货币排行榜','8 位 · 货币 coin',rows,[],[],{horizontalBarBackgroundOpacity:0,horizontalBarBackgroundFullOpacity:0,shouldMoveIconToBarEndLeft:true,gridLinesOverBars:true,valueFollowsBar:true}),1400)
  await capture('monetary-card',renderCard('货币排行榜',rows.map(r=>({username:r.name,userId:r.userId,value:r.count,avatar:''})),'coin'),560)
  const first = {...blockData[0],chinese_title_gui:'false'} as any
  await capture('mcdle-board',boardCard({mode:'block',guesses:[first,{...first,chinese_title:'很长的方块名称，用于检查布局是否溢出'}]} as any))
  await capture('mcdle-start',startCard('block',0,10,true))
  await capture('azur-pool',poolTable({SSR:'企业、测试舰娘',SR:'标枪',R:'拉菲',N:'长岛'} as any,{SSR:7,SR:12,R:26,N:55} as any,'轻型池',1))
  const md = new MarkdownToImageService(ctx,Config({}));
  await capture('markdown-light',md.render('# 示例文档\n\n这是一段支持换行的正文。\n\n```js\nconst a = "long";\n'+ 'really_long_code_'.repeat(15)+'\n```\n\n```mermaid\ngraph LR\nA[开始] --> B[结束]\n```'),640)
  // Execute the actual message-counter command through its database/render pipeline.
  const commands = new Map<string, Function>()
  const mockCtx:any = {root:{},baseDir:out,model:{extend(){}},puppeteer:{page},on(){return ()=>{}},setInterval(){return ()=>{}},middleware(){},channel(){return mockCtx},command(name:string){
    const chain:any=new Proxy({}, {get(_,key){return (...args:any[])=>{if(key==='action')commands.set(name,args[0]);return chain}}});return chain
  },http:{get:async()=>Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+yD1sAAAAASUVORK5CYII=','base64')},database:{select(){
    const chain:any=new Proxy({}, {get(_,key){return (...args:any[])=> key==='execute' ? Promise.resolve(args.length ? rows.reduce((n,r)=>n+r.count,0) : rows.map(r=>({userId:r.userId,name:r.name,avatar:'https://example.test/avatar',count:r.count}))) : chain}});return chain
  }}}
  await counter.apply(mockCtx,counter.Config({isLeaderboardToHorizontalBarChartConversionEnabled:true,autoPush:false}))
  const counterOutput = await commands.get('msgcount.排行榜 [count:posint]')!({session:{platform:'mock',selfId:'bot',userId:'0',channelId:'g'},options:{}},8)
  const counterImage = h.select(h.normalize(counterOutput),'img')[0]
  assert.ok(counterImage,'message-counter must return an actual chart, not silently fall back to text')
  assert.match(h.normalize(counterOutput).join(''),/8\. 成员 7/)
  const counterSource = counterImage.attrs.src as string
  await writeFile(path.join(out,'message-counter.png'), Buffer.from(counterSource.split(',')[1],'base64'))
  const g: any={ctx,config:{imageType:'png'},logger:{warn(...args:any[]){errors.push(String(args))}}}
  for (const dark of [false,true]) {
   g.config.isDarkThemeEnabled=dark
   const buffer=await generateImage(g,generateStyledHtml(6),'<div class="Row-module_row__pwpBq">'+['correct','present','absent','correct','present'].map((state,i)=>`<div class="Tile-module_tile__UWEHN" data-state="${state}">${'HELLO'[i]}</div>`).join('')+'</div>')
   assert.ok(buffer.length>100)
   await writeFile(path.join(out,`wordle-${dark?'dark':'light'}.png`),buffer)
   await writeFile(path.join(out,`wordle-panel-${dark?'dark':'light'}.png`),await generatePanelImage(g,[{lead:'1',name:'很长的测试名字',value:'123'},{lead:'2',name:'第二位',value:'80'}],true))
  }
  assert.deepEqual(errors,[])
  console.log(JSON.stringify({out,results},null,2))
 }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1})
