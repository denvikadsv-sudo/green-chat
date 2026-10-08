const COLORS = ['#25d366', '#128c7e', '#34b7f1', '#a561e0', '#e8744f', '#d9a21b', '#4f8cff']

export default function Avatar({ name }) {
  const label = (name || '?').replace(/[^\p{L}\p{N}]/gu, '').charAt(0).toUpperCase() || '#'
  let hash = 0
  for (const ch of name || '') hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return (
    <div className="avatar" style={{ background: COLORS[hash % COLORS.length] }} aria-hidden="true">
      {label}
    </div>
  )
}
