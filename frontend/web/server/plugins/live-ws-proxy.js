import { attachLiveWsProxy } from '../utils/liveWsProxy.js'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('listen', (listener) => {
    attachLiveWsProxy(listener?.server || listener)
  })
})
