export function resolveApiUrl(idInstance) {
  const id = String(idInstance || '').trim()
  return id.length >= 10 ? `https://${id.slice(0, 4)}.api.green-api.com` : 'https://api.green-api.com'
}

// "+7 (999) 123-45-67" / "8 999 123 45 67" -> "79991234567"; returns null if not a plausible number
export function normalizePhone(input) {
  let digits = String(input || '').replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) digits = '7' + digits.slice(1)
  if (digits.length < 10 || digits.length > 15) return null
  return digits
}

export const toChatId = (phone) => `${phone}@c.us`

export function chatIdToPhone(chatId) {
  return chatId.endsWith('@c.us') ? chatId.slice(0, -5) : chatId
}

export function formatPhone(phone) {
  const m = /^7(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(phone)
  return m ? `+7 ${m[1]} ${m[2]}-${m[3]}-${m[4]}` : `+${phone}`
}
