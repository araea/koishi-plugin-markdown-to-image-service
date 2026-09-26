import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { scheme, contrast, MEDAL, onColor, clientColorScript, harmonize } from '../src/m3'
import { usePresentation, directInputConflict, registerDirectInput, withoutImages, imagesOnly, choosePresentation, imageText, promptInput } from '../src/ux'
import { createPayments } from '../src/payments'
import { h } from 'koishi'

test('M3 role pairs meet normal-text AA across source hues and light/dark schemes', () => {
  for (let hue = 0; hue < 360; hue += 15) for (const dark of [false, true]) {
    const s = scheme(hue, dark)
    for (const role of ['primary','secondary','tertiary','error','primaryContainer','secondaryContainer','tertiaryContainer','errorContainer','surface','surfaceVariant','background']) {
      const foreground = 'on' + role[0].toUpperCase() + role.slice(1)
      assert.ok(contrast(s[role], s[foreground]) >= 4.5, `${hue}/${dark} ${role}`)
    }
    for (const surface of ['surfaceContainerLowest','surfaceContainerLow','surfaceContainer','surfaceContainerHigh','surfaceContainerHighest']) assert.ok(contrast(s[surface], s.onSurfaceVariant) >= 4.5)
  }
  for (const color of Object.values(MEDAL)) assert.ok(contrast(color, onColor(color)) >= 4.5)
})
test('browser and server share the exact HCT algorithm', () => {
  const browser = vm.runInNewContext(clientColorScript() + ';M3')
  for (const color of ['#ffffff','#000000','#123456','#fefe00','#ff00ff']) {
    assert.equal(browser.harmonize(color,45,36,268), harmonize(color,45,36,268))
    assert.ok(contrast(harmonize(color,45,36,268),harmonize(color,90,24,268)) >= 3)
  }
})
function context() {
  const commands = new Map<string,Function>(), disposers: Function[] = []
  const ctx: any = { root: {}, command(name: string) { return { action(fn: Function) { commands.set(name, fn) } } }, on(_:string, fn:Function){disposers.push(fn)} }
  return {ctx,commands,disposers}
}
test('presentation preference is shared per bot, isolated per user; 图文只发图，文字模式发全文', () => {
  const {ctx,commands} = context()
  const one = usePresentation(ctx,'a'), two = usePresentation(ctx,'b')
  const session: any = {platform:'mock',selfId:'bot',userId:'u'}
  const text = '1. A\n2. B\n3. C\n4. D\n5. E\n6. F'
  // 图文模式：只给图片，不再附带等价文字
  const image = h.normalize(one.present(session,h.image('https://example.com/image.png'),h.text(text)))
  assert.equal(image.length,1)
  assert.equal(image[0].type,'img')
  assert.doesNotMatch(image.join(''),/6\. F/)
  commands.get('a.显示 [mode:string]')!({session},'文字')
  assert.equal(two.textOnly(session),true)
  assert.equal(two.textOnly({...session,selfId:'other'}),false)
  assert.equal(h.normalize(two.present(session,h.image('x'),h.text(text))).join(''),text)
  assert.equal(withoutImages(h('p',{},[h.image('x'),h.text(text)])).join(''),`<p>${text}</p>`)
})
test('图片等价文字在图文模式被丢掉、在文字模式被展开', () => {
  const content = h('p',{},['已撤销，挑战继续\n',h('p',{},[h.image('x'),imageText('棋盘：轮到红方')])])
  const image = imagesOnly(content).join('')
  const text = withoutImages(content).join('')
  assert.match(image,/已撤销/); assert.match(image,/<img/); assert.doesNotMatch(image,/棋盘：轮到红方/)
  assert.match(text,/棋盘：轮到红方/); assert.match(text,/已撤销/); assert.doesNotMatch(text,/<img/)
  assert.equal(choosePresentation(content,false).join(''),image)
  assert.equal(choosePresentation(content,true).join(''),text)
})
test('conflicting active games do not consume ambiguous bare input', async () => {
  const {ctx,disposers} = context(); const messages: string[] = []
  registerDirectInput(ctx,'a', () => true); registerDirectInput(ctx,'b', () => true)
  const session: any = {event:{user:{}},send:async (message:string)=>messages.push(message)}
  assert.equal(await directInputConflict(ctx,session),true)
  assert.match(messages[0], /a、b/)
  disposers[1]()
  assert.equal(await directInputConflict(ctx,session),false)
})
test('input deadline can be extended and cancellation returned unchanged', async () => {
  const replies = ['延长','取消'], deadlines:number[] = []
  assert.equal(await promptInput({send:async()=>{},prompt:async (ms:number)=>{deadlines.push(ms);return replies.shift()}} as any,'操作'),'取消')
  assert.deepEqual(deadlines,[300000,300000])
})
test('uncertain payment is journaled and never reported as successful or retried', async () => {
  const {ctx} = context(); const rows:any[] = []; let calls=0
  ctx.model = {extend(){}}
  ctx.logger = () => ({error(){}})
  ctx.database = { create:async (_:string,row:any)=>{rows.push(row)}, set:async (_:string,q:any,v:any)=>{Object.assign(rows.find(r=>r.id===q.id),v)}, get:async (_:string,q:any)=>rows.filter(r=>Object.entries(q).every(([k,v])=>r[k]===v)) }
  const payments = createPayments(ctx,'test')
  assert.equal(await payments.pay('mock','u',50,'coin',async()=>{calls++;throw Error('connection lost after request')}),false)
  assert.equal(calls,1); assert.equal(rows[0].status,'pending'); assert.equal(await payments.pending('mock','u'),true)
  assert.equal(await payments.pay('mock','v',25,'coin',async()=>{}),true)
  assert.equal(rows[1].status,'complete')
})
