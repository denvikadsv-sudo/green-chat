import { useCallback, useEffect, useReducer, useState } from 'react'
import { chatReducer, initialState } from './state/chatReducer.js'
import { usePolling } from './state/usePolling.js'
import { sendMessage } from './api/greenApi.js'
import { loadCreds, saveCreds, clearCreds, loadData, saveData } from './utils/storage.js'
import Login from './components/Login.jsx'
import Sidebar from './components/Sidebar.jsx'
import ChatWindow from './components/ChatWindow.jsx'

export default function App() {
  const [creds, setCreds] = useState(loadCreds)
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const [hydrated, setHydrated] = useState(false)
  const [authError, setAuthError] = useState('')

  const idInstance = creds?.idInstance

  useEffect(() => {
    if (!idInstance) return
    const saved = loadData(idInstance)
    if (saved) dispatch({ type: 'HYDRATE', state: saved })
    setHydrated(true)
  }, [idInstance])

  useEffect(() => {
    if (!idInstance || !hydrated) return undefined
    const t = setTimeout(() => saveData(idInstance, state), 300)
    return () => clearTimeout(t)
  }, [idInstance, hydrated, state.chats, state.messages])

  const onEvent = useCallback((event) => {
    if (event.kind === 'message') {
      dispatch({ type: 'ADD_MESSAGE', chatId: event.chatId, message: event.message, name: event.name })
    } else if (event.kind === 'status') {
      dispatch({ type: 'SET_STATUS', id: event.id, status: event.status })
    }
  }, [])

  const onAuthError = useCallback(() => {
    clearCreds()
    setCreds(null)
    setHydrated(false)
    dispatch({ type: 'HYDRATE', state: initialState })
    setAuthError('Сессия GREEN-API отклонена: проверьте idInstance и apiTokenInstance.')
  }, [])

  const online = usePolling(hydrated ? creds : null, onEvent, onAuthError)

  const send = useCallback(
    async (chatId, text) => {
      const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      dispatch({
        type: 'ADD_MESSAGE',
        chatId,
        message: { id: tempId, text, ts: Date.now(), direction: 'out', status: 'pending' },
      })
      try {
        const res = await sendMessage(creds, chatId, text)
        dispatch({ type: 'CONFIRM_SENT', chatId, tempId, id: res.idMessage })
      } catch {
        dispatch({ type: 'FAIL_SEND', chatId, tempId })
      }
    },
    [creds],
  )

  const retry = useCallback(
    (chatId, message) => {
      dispatch({ type: 'REMOVE_MESSAGE', chatId, id: message.id })
      send(chatId, message.text)
    },
    [send],
  )

  const logout = () => {
    clearCreds()
    setCreds(null)
    setHydrated(false)
    dispatch({ type: 'HYDRATE', state: initialState })
  }

  if (!creds) {
    return (
      <Login
        initialError={authError}
        onLogin={(c) => {
          setAuthError('')
          saveCreds(c)
          setCreds(c)
        }}
      />
    )
  }

  const active = state.activeId ? state.chats[state.activeId] : null

  return (
    <div className={`app ${active ? 'app--chat-open' : ''}`}>
      <Sidebar
        chats={state.chats}
        messages={state.messages}
        activeId={state.activeId}
        online={online}
        idInstance={creds.idInstance}
        onSelect={(chatId) => dispatch({ type: 'SELECT', chatId })}
        onCreate={(chatId) => dispatch({ type: 'ADD_CHAT', chatId })}
        onLogout={logout}
      />
      <ChatWindow
        chat={active}
        messages={active ? state.messages[active.id] || [] : []}
        onSend={send}
        onRetry={retry}
        onBack={() => dispatch({ type: 'SELECT_NONE' })}
      />
    </div>
  )
}
