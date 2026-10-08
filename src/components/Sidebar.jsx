import { useState } from 'react'
import { normalizePhone, toChatId } from '../utils/phone.js'
import { formatTime } from '../utils/time.js'
import Avatar from './Avatar.jsx'

export default function Sidebar({ chats, messages, activeId, online, idInstance, onSelect, onCreate, onLogout }) {
  const [adding, setAdding] = useState(false)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const list = Object.values(chats).sort((a, b) => b.lastTs - a.lastTs)

  const create = (e) => {
    e.preventDefault()
    const normalized = normalizePhone(phone)
    if (!normalized) return setError('Введите номер в международном формате, например +7 999 123-45-67.')
    onCreate(toChatId(normalized))
    setPhone('')
    setError('')
    setAdding(false)
  }

  return (
    <aside className="sidebar">
      <header className="sidebar__head">
        <div className="sidebar__me">
          <Avatar name="Я" />
          <div>
            <div className="sidebar__title">Чаты</div>
            <div className={`sidebar__status ${online ? '' : 'sidebar__status--off'}`}>
              {online ? `Инстанс ${idInstance}` : 'Нет соединения…'}
            </div>
          </div>
        </div>
        <div className="sidebar__actions">
          <button className="icon-btn" title="Новый чат" aria-label="Новый чат" onClick={() => setAdding((v) => !v)}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" /></svg>
          </button>
          <button className="icon-btn" title="Выйти" aria-label="Выйти" onClick={onLogout}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M10 17v-3H3v-4h7V7l5 5-5 5Zm9-14H12v2h7v14h-7v2h7a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z" /></svg>
          </button>
        </div>
      </header>

      {adding && (
        <form className="newchat" onSubmit={create}>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Номер телефона получателя"
            inputMode="tel"
            autoFocus
          />
          <button className="btn btn--primary">Создать чат</button>
          {error && <div className="newchat__error">{error}</div>}
        </form>
      )}

      <ul className="chatlist">
        {list.length === 0 && !adding && (
          <li className="chatlist__empty">Чатов пока нет. Нажмите «+», чтобы начать переписку по номеру телефона.</li>
        )}
        {list.map((chat) => {
          const msgs = messages[chat.id] || []
          const last = msgs[msgs.length - 1]
          return (
            <li key={chat.id}>
              <button
                className={`chatitem ${chat.id === activeId ? 'chatitem--active' : ''}`}
                onClick={() => onSelect(chat.id)}
              >
                <Avatar name={chat.name} />
                <div className="chatitem__body">
                  <div className="chatitem__row">
                    <span className="chatitem__name">{chat.name}</span>
                    {last && <span className="chatitem__time">{formatTime(last.ts)}</span>}
                  </div>
                  <div className="chatitem__row">
                    <span className="chatitem__preview">
                      {last ? `${last.direction === 'out' ? 'Вы: ' : ''}${last.text}` : 'Нет сообщений'}
                    </span>
                    {chat.unread > 0 && <span className="badge">{chat.unread}</span>}
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
