// ============================================================
// generate-routes.mjs
//
// Scan folder src/modules/{project}/{module}.ts lalu generate
// src/registry.generated.ts secara otomatis.
//
// Ini yang bikin "nambah project baru = tidak perlu edit index.ts".
// Cukup buat folder + file module, script ini yang urus sisanya.
//
// Dijalankan otomatis lewat npm (predev/prebuild/predeploy),
// atau manual: node scripts/generate-routes.mjs
// ============================================================
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const MODULES_DIR = path.join(ROOT, 'src/modules')
const OUTPUT_FILE = path.join(ROOT, 'src/registry.generated.ts')

if (!fs.existsSync(MODULES_DIR)) {
  console.error(`Folder tidak ditemukan: ${MODULES_DIR}`)
  process.exit(1)
}

const projects = fs
  .readdirSync(MODULES_DIR)
  .filter((name) => fs.statSync(path.join(MODULES_DIR, name)).isDirectory())
  .sort()

if (projects.length === 0) {
  console.warn('Tidak ada project ditemukan di src/modules/. Registry akan kosong.')
}

const imports = []
const mounts = []
let totalRoutes = 0

for (const project of projects) {
  const projectDir = path.join(MODULES_DIR, project)
  const files = fs
    .readdirSync(projectDir)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    .sort()

  for (const file of files) {
    const moduleName = file.replace(/\.ts$/, '')
    // nama variabel import harus unik & valid identifier JS
    const varName = `${project}_${moduleName}`.replace(/[^a-zA-Z0-9_]/g, '_')

    imports.push(`import ${varName} from './modules/${project}/${moduleName}'`)
    mounts.push(`  app.route('/v1/${project}/${moduleName}', ${varName})`)
    totalRoutes++
  }
}

const output = `// ============================================================
// FILE INI AUTO-GENERATED. JANGAN DIEDIT MANUAL.
// Digenerate oleh scripts/generate-routes.mjs
// Terakhir digenerate: ${new Date().toISOString()}
//
// Untuk menambah route baru: buat file baru di
// src/modules/{project}/{module}.ts lalu jalankan ulang
// "npm run generate:routes" (atau otomatis lewat dev/deploy).
// ============================================================
import type { Hono } from 'hono'
${imports.join('\n')}

export function registerRoutes(app: Hono<any>) {
${mounts.join('\n')}
}

export const REGISTERED_ROUTES = ${JSON.stringify(
  projects.flatMap((project) =>
    fs
      .readdirSync(path.join(MODULES_DIR, project))
      .filter((f) => f.endsWith('.ts'))
      .map((f) => `/v1/${project}/${f.replace(/\.ts$/, '')}`)
  ),
  null,
  2
)}
`

fs.writeFileSync(OUTPUT_FILE, output)
console.log(`✔ Digenerate ${totalRoutes} route dari ${projects.length} project: ${projects.join(', ')}`)
