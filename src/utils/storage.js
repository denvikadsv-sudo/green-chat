const CREDS_KEY = 'gc:creds'
const dataKey = (id) => `gc:data:${id}`
const MAX_PER_CHAT = 500

function read(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or blocked — app still works in memory */
  }
}

export const loadCreds = () => read(CREDS_KEY)
export const saveCreds = (creds) => write(CREDS_KEY, creds)
export const clearCreds = () => {
  try { localStorage.removeItem(CREDS_KEY) } catch { /* ignore */ }
}

export function loadData(idInstance) {
  const data = read(dataKey(idInstance))
  if (!data) return null
  const messages = {}
  for (const [id, list] of Object.entries(data.messages || {})) {
    messages[id] = list.map((m) => (m.status === 'pending' ? { ...m, status: 'failed' } : m))
  }
  return { chats: data.chats || {}, messages }
}

export function saveData(idInstance, { chats, messages }) {
  const trimmed = {}
  for (const [id, list] of Object.entries(messages)) trimmed[id] = list.slice(-MAX_PER_CHAT)
  write(dataKey(idInstance), { chats, messages: trimmed })
}
