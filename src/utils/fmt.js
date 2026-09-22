export function pad2(n) {
  const x = Number(n)
  if (!Number.isFinite(x)) return '00'
  const s = String(Math.abs(x | 0))
  return s.length < 2 ? '0' + s : s
}
