import { chatIdToPhone, formatPhone } from '../utils/phone.js'

export const initialState = { chats: {}, messages: {}, activeId: null }

const STATUS_RANK = { pending: 0, failed: 0, sent: 1, delivered: 2, read: 3 }

function defaultName(chatId) {
  return chatId.endsWith('@c.us') ? formatPhone(chatIdToPhone(chatId)) : chatId
}

function ensureChat(state, chatId, name) {
  const existing = state.chats[chatId]
  if (existing) {
    if (name && existing.name === defaultName(chatId) && name !== existing.name) {
      return { ...state.chats, [chatId]: { ...existing, name } }
    }
    return state.chats
  }
  return {
    ...state.chats,
    [chatId]: { id: chatId, name: name || defaultName(chatId), lastTs: 0, unread: 0 },
  }
}

export function chatReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return { ...initialState, ...action.state, activeId: null }

    case 'ADD_CHAT': {
      const chats = ensureChat(state, action.chatId)
      return { ...state, chats, activeId: action.chatId }
    }

    case 'SELECT': {
      const chat = state.chats[action.chatId]
      if (!chat) return state
      return {
        ...state,
        activeId: action.chatId,
        chats: { ...state.chats, [action.chatId]: { ...chat, unread: 0 } },
      }
    }

    case 'SELECT_NONE':
      return { ...state, activeId: null }

    case 'ADD_MESSAGE': {
      const { chatId, message, name } = action
      const list = state.messages[chatId] || []
      if (list.some((m) => m.id === message.id)) return state

      let chats = ensureChat(state, chatId, name)
      const chat = chats[chatId]
      const isActive = state.activeId === chatId
      chats = {
        ...chats,
        [chatId]: {
          ...chat,
          lastTs: Math.max(chat.lastTs, message.ts),
          unread: message.direction === 'in' && !isActive ? chat.unread + 1 : chat.unread,
        },
      }
      const next = [...list, message].sort((a, b) => a.ts - b.ts)
      return { ...state, chats, messages: { ...state.messages, [chatId]: next } }
    }

    case 'CONFIRM_SENT': {
      const { chatId, tempId, id } = action
      const list = state.messages[chatId] || []
      const alreadyThere = list.some((m) => m.id === id)
      const next = alreadyThere
        ? list.filter((m) => m.id !== tempId)
        : list.map((m) => (m.id === tempId ? { ...m, id, status: 'sent' } : m))
      return { ...state, messages: { ...state.messages, [chatId]: next } }
    }

    case 'FAIL_SEND': {
      const { chatId, tempId } = action
      const list = (state.messages[chatId] || []).map((m) =>
        m.id === tempId ? { ...m, status: 'failed' } : m,
      )
      return { ...state, messages: { ...state.messages, [chatId]: list } }
    }

    case 'REMOVE_MESSAGE': {
      const list = (state.messages[action.chatId] || []).filter((m) => m.id !== action.id)
      return { ...state, messages: { ...state.messages, [action.chatId]: list } }
    }

    case 'SET_STATUS': {
      const { id, status } = action
      let changed = false
      const messages = {}
      for (const [chatId, list] of Object.entries(state.messages)) {
        messages[chatId] = list.map((m) => {
          if (m.id !== id || m.direction !== 'out') return m
          if ((STATUS_RANK[status] ?? 0) < (STATUS_RANK[m.status] ?? 0)) return m
          changed = true
          return { ...m, status }
        })
      }
      return changed ? { ...state, messages } : state
    }

    default:
      return state
  }
}
