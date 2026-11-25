export function formatRp(amount: number): string {
  return 'Rp ' + amount.toLocaleString('id-ID')
}

export function parseRp(value: string): number {
  return parseInt(value.replace(/\D/g, '')) || 0
}

export function displayRp(value: string): string {
  const n = parseRp(value)
  return n ? n.toLocaleString('id-ID') : ''
}
