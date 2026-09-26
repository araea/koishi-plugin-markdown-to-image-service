import { build } from 'esbuild'
import { writeFile, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
const require = createRequire(import.meta.url)
const entry = require.resolve('@material/material-color-utilities')
const metadata = JSON.parse(await readFile(path.join(path.dirname(entry), 'package.json'), 'utf8'))
if (metadata.version !== '0.4.0') throw new Error('Expected Material Color Utilities 0.4.0')
for (const browser of [false, true]) {
 const result = await build({stdin:{contents:`export {Hct,SchemeTonalSpot,hexFromArgb,argbFromHex} from ${JSON.stringify(entry)}`},bundle:true,format:browser?'iife':'esm',globalName:browser?'MaterialColor':undefined,platform:'neutral',minify:browser,write:false,legalComments:'inline'})
 const notice = '// Generated from @material/material-color-utilities 0.4.0 (Apache-2.0).\n'
 await writeFile(new URL(browser?'../src/material-color-browser.ts':'../src/material-color.ts',import.meta.url), browser ? notice+'export const MATERIAL_COLOR_SCRIPT = '+JSON.stringify(result.outputFiles[0].text)+'\n' : '// @ts-nocheck\n'+notice+result.outputFiles[0].text)
}
