import { useState } from 'react'
import { getStateInstance } from '../api/greenApi.js'

export default function Login({ onLogin, initialError = '' }) {
  const [idInstance, setId] = useState('')
  const [apiTokenInstance, setToken] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [error, setError] = useState(initialError)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const creds = {
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
      apiUrl: apiUrl.trim().replace(/\/+$/, '') || undefined,
    }
    if (!/^\d+$/.test(creds.idInstance)) return setError('idInstance — это число, например 1101000001.')
    if (!creds.apiTokenInstance) return setError('Введите apiTokenInstance.')

    setBusy(true)
    setError('')
    try {
      const res = await getStateInstance(creds)
      if (res?.stateInstance !== 'authorized') {
        setError(
          `Аккаунт WhatsApp не авторизован (статус: ${res?.stateInstance ?? 'неизвестен'}). ` +
            'Отсканируйте QR-код в личном кабинете GREEN-API и повторите вход.',
        )
        return
      }
      onLogin(creds)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <div className="login__logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="44" height="44" fill="currentColor">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.3A10 10 0 1 0 12 2Zm0 2a8 8 0 1 1-4.100 14.900l-.3-.2-2.900.8.8-2.800-.2-.3A8 8 0 0 1 12 4Z" />
          </svg>
        </div>
        <h1>Green Chat</h1>
        <p className="login__hint">
          Введите данные инстанса из личного кабинета{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">GREEN-API</a>
        </p>

        <label>
          idInstance
          <input
            value={idInstance}
            onChange={(e) => setId(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            placeholder="1101000001"
            autoFocus
          />
        </label>
        <label>
          apiTokenInstance
          <input
            value={apiTokenInstance}
            onChange={(e) => setToken(e.target.value)}
            type="password"
            autoComplete="off"
            placeholder="d75b3a66374942c5b3c019c698abc2067e151558acbd412345"
          />
        </label>

        <details className="login__adv">
          <summary>Дополнительно</summary>
          <label>
            apiUrl (если отличается от стандартного)
            <input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://1101.api.green-api.com"
            />
          </label>
        </details>

        {error && <div className="login__error" role="alert">{error}</div>}

        <button className="btn btn--primary" disabled={busy}>
          {busy ? 'Проверяем…' : 'Войти'}
        </button>
        <p className="login__note">Данные хранятся только в вашем браузере (localStorage).</p>
      </form>
    </div>
  )
}
