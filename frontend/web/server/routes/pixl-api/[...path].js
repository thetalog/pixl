const API_TARGET = process.env.NUXT_DEV_API_PROXY || 'http://127.0.0.1:3001'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const path = url.pathname.replace(/^\/pixl-api/, '') || '/'
  return proxyRequest(event, `${API_TARGET}${path}${url.search}`)
})
