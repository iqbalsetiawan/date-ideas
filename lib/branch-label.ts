import { ItemLocation } from '@/lib/supabase'

function branchesNewestFirst(branches: ItemLocation[]): ItemLocation[] {
  return [...branches].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  )
}

/** Area label for sorting / single-branch cell: newest-added branch first. */
export function displayAreaLabel(branches: ItemLocation[]): string {
  if (branches.length === 0) return ''
  const sorted = branchesNewestFirst(branches)
  return (sorted[0].label ?? '').trim()
}

/** Ordered labels (newest first) for tooltips when an item has multiple areas. */
export function allAreaLabelsNewestFirst(branches: ItemLocation[]): string[] {
  if (branches.length === 0) return []
  return branchesNewestFirst(branches).map((b) => (b.label ?? '').trim() || '—')
}

/** Native `title` string: numbered list, newest first. */
export function areasListTitle(branches: ItemLocation[]): string {
  const labels = allAreaLabelsNewestFirst(branches)
  if (labels.length === 0) return ''
  return ['Areas:', ...labels.map((l, i) => `${i + 1}. ${l}`)].join('\n')
}
