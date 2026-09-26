import { createHash } from 'node:crypto'
import { readFile, writeFile, readdir, access, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const source = fileURLToPath(new URL('..', import.meta.url))
const workspace = process.argv.find(x => x.startsWith('--workspace='))?.slice(12) || path.dirname(source)
const check = process.argv.includes('--check')
const exists = async file => access(file).then(() => true, () => false)
let failures = 0
for (const name of await readdir(workspace)) {
  const target = path.join(workspace, name)
  if (!(await exists(path.join(target, 'src/index.ts')))) continue
  const files = ['src/ux.ts', 'DESIGN_SYSTEM.md', 'scripts/check-design-system.mjs']
  if (await exists(path.join(target, 'src/payments.ts'))) files.push('src/payments.ts')
  if (await exists(path.join(target, 'src/m3.ts'))) files.push('src/m3.ts', 'src/material-color.ts', 'src/material-color-browser.ts', 'THIRD_PARTY_NOTICES.md')
  const hashes = {}
  for (const file of files) {
    const expected = await readFile(path.join(source, file), 'utf8')
    hashes[file] = createHash('sha256').update(expected).digest('hex')
    const actual = await readFile(path.join(target, file), 'utf8').catch(() => '')
    if (actual === expected) continue
    if (check) { console.error(`${name}/${file} differs`); failures++ }
    else { await mkdir(path.dirname(path.join(target, file)), {recursive:true}); await writeFile(path.join(target, file), expected) }
  }
  const manifest = JSON.stringify({version:'2026-09-26', source:'koishi-plugin-markdown-to-image-service', materialColorUtilities:'0.4.0', files:hashes}, null, 2) + '\n'
  const manifestPath = path.join(target, 'design-system.lock.json')
  if (check) {
    if (await readFile(manifestPath, 'utf8').catch(() => '') !== manifest) { console.error(`${name}/design-system.lock.json differs`); failures++ }
  } else await writeFile(manifestPath, manifest)
}
if (failures) process.exitCode = 1
