import { describe, it, expect } from 'vitest'
import { chatReducer, initialState } from './chatReducer.js'
import { parseNotification } from '../utils/notifications.js'

const chatId = '79991234567@c.us'
const msg = (over = {}) => ({ id: 'a', text: 'hi', ts: 1000, direction: 'in', status: 'sent', ...over })

describe('chatReducer', () => {
  it('creates chat and counts unread for incoming message in inactive chat', () => {
    const s = chatReducer(initialState, { type: 'ADD_MESSAGE', chatId, message: msg() })
    expect(s.chats[chatId].unread).toBe(1)
    expect(s.messages[chatId]).toHaveLength(1)
  })

  it('ignores duplicate message ids', () => {
    let s = chatReducer(initialState, { type: 'ADD_MESSAGE', chatId, message: msg() })
    s = chatReducer(s, { type: 'ADD_MESSAGE', chatId, message: msg() })
    expect(s.messages[chatId]).toHaveLength(1)
  })

  it('does not count unread in the active chat', () => {
    let s = chatReducer(initialState, { type: 'ADD_CHAT', chatId })
    s = chatReducer(s, { type: 'ADD_MESSAGE', chatId, message: msg() })
    expect(s.chats[chatId].unread).toBe(0)
  })

  it('confirm replaces temp id, or drops temp if echo already arrived', () => {
    let s = chatReducer(initialState, {
      type: 'ADD_MESSAGE', chatId, message: msg({ id: 'tmp', direction: 'out', status: 'pending' }),
    })
    s = chatReducer(s, { type: 'CONFIRM_SENT', chatId, tempId: 'tmp', id: 'real' })
    expect(s.messages[chatId][0]).toMatchObject({ id: 'real', status: 'sent' })

    let r = chatReducer(initialState, {
      type: 'ADD_MESSAGE', chatId, message: msg({ id: 'tmp', direction: 'out', status: 'pending' }),
    })
    r = chatReducer(r, { type: 'ADD_MESSAGE', chatId, message: msg({ id: 'real', direction: 'out' }) })
    r = chatReducer(r, { type: 'CONFIRM_SENT', chatId, tempId: 'tmp', id: 'real' })
    expect(r.messages[chatId].map((m) => m.id)).toEqual(['real'])
  })

  it('status never goes backwards', () => {
    let s = chatReducer(initialState, {
      type: 'ADD_MESSAGE', chatId, message: msg({ id: 'x', direction: 'out', status: 'read' }),
    })
    s = chatReducer(s, { type: 'SET_STATUS', id: 'x', status: 'delivered' })
    expect(s.messages[chatId][0].status).toBe('read')
  })
})

describe('parseNotification', () => {
  const body = {
    typeWebhook: 'incomingMessageReceived',
    timestamp: 1763115112,
    idMessage: 'm1',
    senderData: { chatId, chatName: 'Иван' },
    messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет' } },
  }
  it('parses incoming text', () => {
    const e = parseNotification(body)
    expect(e).toMatchObject({ kind: 'message', chatId, name: 'Иван' })
    expect(e.message).toMatchObject({ id: 'm1', text: 'Привет', direction: 'in' })
  })
  it('marks non-text as unsupported', () => {
    const e = parseNotification({ ...body, messageData: { typeMessage: 'imageMessage' } })
    expect(e.message.unsupported).toBe(true)
  })
  it('parses status updates', () => {
    expect(parseNotification({ typeWebhook: 'outgoingMessageStatus', idMessage: 'm1', status: 'read' }))
      .toEqual({ kind: 'status', id: 'm1', status: 'read' })
  })
  it('ignores unknown types', () => {
    expect(parseNotification({ typeWebhook: 'something' })).toBeNull()
  })
})
