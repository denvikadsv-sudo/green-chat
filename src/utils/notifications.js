const MESSAGE_TYPES = {
  incomingMessageReceived: 'in',
  outgoingMessageReceived: 'out',
  outgoingAPIMessageReceived: 'out',
}

const STATUS_MAP = { sent: 'sent', delivered: 'delivered', read: 'read', failed: 'failed' }

function extractText(messageData) {
  if (!messageData) return null
  switch (messageData.typeMessage) {
    case 'textMessage':
      return messageData.textMessageData?.textMessage ?? ''
    case 'extendedTextMessage':
      return messageData.extendedTextMessageData?.text ?? ''
    case 'quotedMessage':
      return messageData.extendedTextMessageData?.text ?? ''
    default:
      return null
  }
}

// Turns a GREEN-API notification body into a normalized event, or null if irrelevant.
export function parseNotification(body) {
  if (!body || !body.typeWebhook) return null

  if (body.typeWebhook in MESSAGE_TYPES) {
    const chatId = body.senderData?.chatId
    if (!chatId || !body.idMessage) return null
    const text = extractText(body.messageData)
    return {
      kind: 'message',
      chatId,
      name: body.senderData.chatName || body.senderData.senderName || '',
      message: {
        id: body.idMessage,
        text: text ?? 'Сообщение этого типа не поддерживается (только текст)',
        unsupported: text === null,
        ts: (body.timestamp || Math.floor(Date.now() / 1000)) * 1000,
        direction: MESSAGE_TYPES[body.typeWebhook],
        status: 'sent',
      },
    }
  }

  if (body.typeWebhook === 'outgoingMessageStatus') {
    const status = STATUS_MAP[body.status]
    if (!status || !body.idMessage) return null
    return { kind: 'status', id: body.idMessage, status }
  }

  if (body.typeWebhook === 'stateInstanceChanged') {
    return { kind: 'state', state: body.stateInstance }
  }

  return null
}
