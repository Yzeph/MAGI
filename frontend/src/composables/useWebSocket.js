import { ref, onUnmounted } from 'vue'

export function useWebSocket(options = {}) {
  const {
    onMessage = () => {},
    reconnectInterval = 3000,
  } = options

  const status = ref('disconnected')
  let ws = null
  let reconnectTimer = null

  function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}/ws`

    ws = new WebSocket(url)

    ws.onopen = () => {
      status.value = 'connected'
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (e) {
        console.error('[WS] 消息解析失败:', e)
      }
    }

    ws.onclose = () => {
      status.value = 'disconnected'
      scheduleReconnect()
    }

    ws.onerror = () => {
      // onclose will fire after this, triggering reconnect
    }
  }

  function scheduleReconnect() {
    clearReconnect()
    reconnectTimer = setTimeout(connect, reconnectInterval)
  }

  function clearReconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  function send(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
      return true
    }
    return false
  }

  function disconnect() {
    clearReconnect()
    if (ws) {
      ws.onclose = null // prevent reconnect
      ws.close()
      ws = null
    }
    status.value = 'disconnected'
  }

  // Auto-cleanup on component unmount
  onUnmounted(disconnect)

  return { status, connect, send, disconnect }
}
