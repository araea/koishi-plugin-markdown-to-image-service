import { Context, h } from 'koishi'
import { randomUUID } from 'node:crypto'
interface Payment { id: string; plugin: string; platform: string; userId: string; amount: number; currency: string; status: string; createdAt: Date }
declare module 'koishi' { interface Tables { plugin_payment_audit: Payment } }
/** Journal before executing. An ambiguous failure is never automatically retried. */
export function createPayments(ctx: Context, plugin: string) {
  ctx.model.extend('plugin_payment_audit', {
    id: 'string', plugin: 'string', platform: 'string', userId: 'string', amount: 'double', currency: 'string', status: 'string', createdAt: 'timestamp',
  }, { primary: 'id' })
  ctx.command(`${plugin}.待核对`, '查看未确认的入账记录', { authority: 3 }).action(async () => {
    const rows = await ctx.database.get('plugin_payment_audit', { plugin, status: 'pending' })
    return h.text(rows.length ? rows.map(r => `${r.id} · ${r.platform}:${r.userId} · ${r.amount} ${r.currency} · ${r.createdAt.toISOString()}`).join('\n') + `\n请先核对实际余额与后台日志；确认已入账或人工补发后使用「${plugin}.确认入账 编号」。此命令不会重复付款。` : '没有待核对的入账记录。')
  })
  ctx.command(`${plugin}.确认入账 <id:string>`, '人工核对后标记入账记录，不执行转账', { authority: 3 }).action(async (_, id) => {
    const [row] = await ctx.database.get('plugin_payment_audit', { id, plugin, status: 'pending' })
    if (!row) return '未找到待核对记录。'
    await ctx.database.set('plugin_payment_audit', { id, plugin }, { status: 'verified' })
    return '已记录人工核对结果；未执行转账。'
  })
  return {
    async pay(platform: string, userId: string, amount: number, currency: string, execute: () => Promise<unknown>): Promise<boolean> {
      if (amount <= 0) return true
      const id = randomUUID()
      try {
        await ctx.database.create('plugin_payment_audit', { id, plugin, platform, userId, amount, currency, status: 'pending', createdAt: new Date() })
        await execute()
        await ctx.database.set('plugin_payment_audit', { id }, { status: 'complete' })
        return true
      } catch (error) {
        ctx.logger(plugin).error('入账未确认（编号 %s，用户 %s:%s，金额 %d %s），请人工核对，禁止盲目重试：%s', id, platform, userId, amount, currency, error)
        return false
      }
    },
    async pending(platform: string, userId: string) {
      return (await ctx.database.get('plugin_payment_audit', { plugin, platform, userId, status: 'pending' })).length > 0
    },
  }
}
