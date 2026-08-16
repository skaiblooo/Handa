import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ssrEntry = path.join(root, 'dist-ssr', 'entry-server.js')
const indexPath = path.join(root, 'dist', 'index.html')

const { render } = await import(`file://${ssrEntry.replace(/\\/g, '/')}`)
const appHtml = render()

const html = fs.readFileSync(indexPath, 'utf8')
if (!html.includes('<div id="root"></div>')) {
  throw new Error('prerender: expected an empty <div id="root"></div> in dist/index.html to inject into')
}
fs.writeFileSync(indexPath, html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`))

fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true })

console.log(`Prerendered the landing page into dist/index.html (${appHtml.length} chars)`)
