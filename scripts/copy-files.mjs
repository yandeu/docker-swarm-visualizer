import chokidar from 'chokidar'
import { resolve, join } from 'path'
import { copyFile, mkdirSync, unlinkSync } from 'fs'
import { copySync } from 'fs-extra'

const WATCH = process.env.WATCH === 'true' ? true : false

// listen for file changed in the static folder
const src = join(resolve(), 'src/www')
const dest = join(resolve(), 'dist/www')

// create the static folder in /dist
mkdirSync(dest, { recursive: true })

// copy all files
copySync(src, dest, {
  filter: (src, dest) => {
    if (/\.ts$|\.js$/gm.test(src)) return false
    return true
  }
})

if (!WATCH) process.exit(0)


const watcher = chokidar.watch(src, {
  ignored: /\.ts$|\.js$/ // ignore js/ts
})

watcher.on('add', path => {
  copyFile(path, path.replace(src, dest), err => {
    if (err) throw err
  })
})

watcher.on('change', path => {
  copyFile(path, path.replace(src, dest), err => {
    if (err) throw err
  })
})

watcher.on('unlink', path => {
  unlinkSync(path.replace(src, dest))
})

console.log('Watching Files...')