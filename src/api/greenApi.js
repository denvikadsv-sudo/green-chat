import { resolveApiUrl } from '../utils/phone.js'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function endpoint({ idInstance, apiTokenInstance, apiUrl }, method, query = '') {
  const base = apiUrl || resolveApiUrl(idInstance)
  return `${base}/waInstance${idInstance}/${method}/${apiTokenInstance}${query}`
}

async function request(url, options = {}) {
  let res
  try {
    res = await fetch(url, options)
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new ApiError('Нет связи с GREEN-API. Проверьте интернет и значение apiUrl.', 0)
  }
  if (res.status === 401 || res.status === 403) {
    throw new ApiError('Неверный idInstance или apiTokenInstance.', res.status)
  }
  if (res.status === 429) throw new ApiError('Превышен лимит запросов, повторяем позже.', 429)
  if (!res.ok) throw new ApiError(`Ошибка GREEN-API (HTTP ${res.status}).`, res.status)
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const getStateInstance = (creds, signal) =>
  request(endpoint(creds, 'getStateInstance'), { signal })

export const sendMessage = (creds, chatId, message) =>
  request(endpoint(creds, 'sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  })

export const receiveNotification = (creds, signal, receiveTimeout = 10) =>
  request(endpoint(creds, 'receiveNotification', `?receiveTimeout=${receiveTimeout}`), { signal })

export const deleteNotification = (creds, receiptId) =>
  request(endpoint(creds, 'deleteNotification') + `/${receiptId}`, { method: 'DELETE' })
