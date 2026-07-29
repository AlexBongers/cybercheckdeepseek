import { cp, mkdir } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const standaloneDir = path.join(root, '.next', 'standalone')

await mkdir(path.join(standaloneDir, '.next'), { recursive: true })

await cp(path.join(root, 'public'), path.join(standaloneDir, 'public'), {
  recursive: true,
})

await cp(path.join(root, '.next', 'static'), path.join(standaloneDir, '.next', 'static'), {
  recursive: true,
})

console.log('Standalone bundle prepared in .next/standalone')
