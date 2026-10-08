import { useEffect, useRef, useState } from 'react'
import { formatTime, dayLabel, dayKey } from '../utils/time.js'
import Avatar from './Avatar.jsx'

const MAX_LEN = 4000

function Ticks({ status }) {
  if (status === 'pending') return <span className="tick tick--pending" title="Отправляется">🕓</span>
  const double = status === 'delivered' || status === 'read'
  const titles = { sent: 'Отправлено', delivered: 'Доставлено', read: 'Прочитано' }
  return (
    <svg className={`tick ${status === 'read' ? 'tick--read' : ''}`} viewBox="0 0 20 12" width="19" height="12" role="img" aria-label={titles[status]}>
      <title>{titles[status]}</title>
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1.5 6.5 5 10 11.500 2.500" />
        {double && <path d="M7.500 8.500 8.500 10 15 2.500" />}
      </g>
    </svg>
  )
}

function Composer({ onSend, disabled }) {
  const [text, setText] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }, [text])

  const submit = () => {
    const value = text.trim()
    if (!value || disabled) return
    onSend(value)
    setText('')
  }

  return (
    <form className="composer" onSubmit={(e) => { e.preventDefault(); submit() }}>
      <textarea
        ref={ref}
        rows={1}
        value={text}
        maxLength={MAX_LEN}
        placeholder="Введите сообщение"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            submit()
          }
        }}
      />
      <button className="send" type="submit" disabled={!text.trim()} aria-label="Отправить" title="Отправить">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M2 21 23 12 2 3v7l15 2-15 2z" /></svg>
      </button>
    </form>
  )
}

export default function ChatWindow({ chat, messages, onSend, onRetry, onBack }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, chat?.id])

  if (!chat) {
    return (
      <main className="chat chat--empty">
        <div>
          <h2>Green Chat</h2>
          <p>Выберите чат или создайте новый по номеру телефона.</p>
        </div>
      </main>
    )
  }

  let prevDay = null
  return (
    <main className="chat">
      <header className="chat__head">
        <button className="icon-btn chat__back" onClick={onBack} aria-label="Назад">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M20 11H7.800l5.600-5.600L12 4l-8 8 8 8 1.400-1.400L7.800 13H20z" /></svg>
        </button>
        <Avatar name={chat.name} />
        <div className="chat__name">{chat.name}</div>
      </header>

      <div className="chat__messages">
        {messages.length === 0 && <div className="chat__hint">Сообщений пока нет. Напишите первым.</div>}
        {messages.map((m) => {
          const key = dayKey(m.ts)
          const showDay = key !== prevDay
          prevDay = key
          return (
            <div key={m.id} className="chat__row">
              {showDay && <div className="day">{dayLabel(m.ts)}</div>}
              <div className={`bubble bubble--${m.direction} ${m.status === 'failed' ? 'bubble--failed' : ''} ${m.unsupported ? 'bubble--muted' : ''}`}>
                <span className="bubble__text">{m.text}</span>
                <span className="bubble__meta">
                  {formatTime(m.ts)}
                  {m.direction === 'out' && m.status !== 'failed' && <Ticks status={m.status} />}
                </span>
                {m.status === 'failed' && (
                  <button className="bubble__retry" onClick={() => onRetry(chat.id, m)}>
                    Не отправлено. Повторить
                  </button>
                )}
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <Composer onSend={(text) => onSend(chat.id, text)} />
    </main>
  )
}
