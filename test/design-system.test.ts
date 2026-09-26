import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { scheme, contrast, MEDAL, onColor, clientColorScript, harmonize } from '../src/m3'
import { present, directInputConflict, registerDirectInput, promptInput } from '../src/ux'
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
test('有图只发图，图片缺失时才退回文字', () => {
  const text = '1. A\n2. B'
  const image = h.normalize(present(h.image('https://example.com/image.png'),h.text(text)))
  assert.equal(image.length,1)
  assert.equal(image[0].type,'img')
  assert.equal(h.normalize(present(null,h.text(text))).join(''),text)
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
test('input prompt waits five minutes without sending an extra line', async () => {
  const sent:string[] = [], deadlines:number[] = []
  assert.equal(await promptInput({send:async(m:string)=>{sent.push(m)},prompt:async (ms:number)=>{deadlines.push(ms);return '取消'}} as any),'取消')
  assert.deepEqual(deadlines,[300000]); assert.deepEqual(sent,[])
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
