import { spawn } from 'node:child_process'
import process from 'node:process'

function openUrl(url) {
  const plat = process.platform
  const cmd =
    plat === 'darwin' ? 'open' :
    plat === 'win32'  ? 'cmd'  :
    'xdg-open'

  const args =
    plat === 'win32' ? ['/c', 'start', '', url] : [url]

  const child = spawn(cmd, args, { stdio: 'ignore', detached: true })
  child.unref()
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: process.env,
    })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`))
    })
  })
}

const mode = process.argv[2] ?? 'dev'
const port = process.env.PORT ?? '3001'
const url = `http://localhost:${port}/dashboard`

openUrl(url)

if (mode === 'dev') {
  await run('npm', ['run', 'dev'])
} else if (mode === 'start') {
  await run('npm', ['run', 'start'])
} else {
  console.error(`Unknown mode: ${mode}. Use: dev | start`)
  process.exit(1)
}

