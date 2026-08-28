/**
 * Builds public/favicon.ico from the PNG icon sizes.
 * ICO entries may hold raw PNG data, so no image encoding is needed here.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const sources = [
  { file: 'favicon-16.png', size: 16 },
  { file: 'favicon-32.png', size: 32 },
]

const images = await Promise.all(
  sources.map(async ({ file, size }) => ({ size, data: await readFile(join(publicDir, file)) }))
)

const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(images.length, 4)

const directory = Buffer.alloc(16 * images.length)
let offset = header.length + directory.length

images.forEach((image, index) => {
  const entry = index * 16
  directory.writeUInt8(image.size >= 256 ? 0 : image.size, entry)
  directory.writeUInt8(image.size >= 256 ? 0 : image.size, entry + 1)
  directory.writeUInt8(0, entry + 2)
  directory.writeUInt8(0, entry + 3)
  directory.writeUInt16LE(1, entry + 4)
  directory.writeUInt16LE(32, entry + 6)
  directory.writeUInt32LE(image.data.length, entry + 8)
  directory.writeUInt32LE(offset, entry + 12)
  offset += image.data.length
})

await writeFile(
  join(publicDir, 'favicon.ico'),
  Buffer.concat([header, directory, ...images.map((image) => image.data)])
)

console.log(`favicon.ico written from ${images.map((i) => `${i.size}x${i.size}`).join(', ')}`)
