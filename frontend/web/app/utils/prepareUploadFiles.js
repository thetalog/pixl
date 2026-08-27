/**
 * Shrink images before multipart upload so they fit common reverse-proxy
 * body limits (nginx defaults to 1MB). Videos are returned unchanged.
 */
export async function prepareUploadFiles(files, options = {}) {
  const list = Array.from(files || []).filter((f) => f instanceof File)
  if (!list.length) return []

  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.82,
    maxBytes = 900_000,
  } = options

  return Promise.all(
    list.map((file) => compressImageFile(file, { maxWidth, maxHeight, quality, maxBytes }))
  )
}

async function compressImageFile(file, opts) {
  const mime = String(file.type || '').toLowerCase()
  const isImage =
    mime.startsWith('image/') ||
    /\.(jpe?g|png|webp|heic|heif|avif)$/i.test(file.name || '')

  // Keep GIFs (animation) and non-images as-is.
  if (!isImage || mime === 'image/gif' || mime.includes('gif')) return file
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    return file
  }

  try {
    const bitmap = await createImageBitmap(file)
    const { width, height } = fitWithin(bitmap.width, bitmap.height, opts.maxWidth, opts.maxHeight)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close?.()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    let q = opts.quality
    let blob = await canvasToBlob(canvas, 'image/jpeg', q)
    while (blob && blob.size > opts.maxBytes && q > 0.45) {
      q -= 0.1
      blob = await canvasToBlob(canvas, 'image/jpeg', q)
    }

    if (!blob || (file.size <= opts.maxBytes && blob.size >= file.size)) {
      return file
    }

    const base = String(file.name || 'upload').replace(/\.[^.]+$/, '') || 'upload'
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file
  }
}

function fitWithin(w, h, maxW, maxH) {
  const scale = Math.min(1, maxW / w, maxH / h)
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  }
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}
