import { useEffect, useRef, useState } from 'react'
import { receiveNotification, deleteNotification } from '../api/greenApi.js'
import { parseNotification } from '../utils/notifications.js'

const sleep = (ms, signal) =>
  new Promise((resolve) => {
    const t = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => { clearTimeout(t); resolve() }, { once: true })
  })

// Long-polls GREEN-API receiveNotification -> onEvent -> deleteNotification, strictly in sequence.
export function usePolling(creds, onEvent, onAuthError) {
  const [online, setOnline] = useState(true)
  const handlers = useRef({ onEvent, onAuthError })
  handlers.current = { onEvent, onAuthError }

  useEffect(() => {
    if (!creds) return undefined
    const ctrl = new AbortController()
    let backoff = 1000

    ;(async () => {
      while (!ctrl.signal.aborted) {
        try {
          const n = await receiveNotification(creds, ctrl.signal, 10)
          setOnline(true)
          backoff = 1000
          if (n && n.receiptId != null) {
            try {
              const event = parseNotification(n.body)
              if (event) handlers.current.onEvent(event)
            } finally {
              // always ack, otherwise one bad notification would block the queue
              await deleteNotification(creds, n.receiptId).catch(() => {})
            }
          }
        } catch (e) {
          if (ctrl.signal.aborted || e.name === 'AbortError') break
          if (e.status === 401 || e.status === 403) {
            handlers.current.onAuthError?.(e)
            break
          }
          setOnline(false)
          await sleep(backoff, ctrl.signal)
          backoff = Math.min(backoff * 2, 15000)
        }
      }
    })()

    return () => ctrl.abort()
  }, [creds])

  return online
}
