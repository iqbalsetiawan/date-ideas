import type { ItemLocation } from '@/lib/supabase'

/** Max distinct labels kept in memory (handles large DBs). */
const DEFAULT_MAX_UNIQUES = 400
/** Max options shown in the suggestion panel. */
export const LABEL_SUGGESTION_PANEL_MAX = 12

/**
 * Unique labels from all `item_locations`, sorted A–Z by label text.
 */
export function getSortedLocationLabels(
  locations: ItemLocation[],
  maxUniques = DEFAULT_MAX_UNIQUES
): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const loc of locations) {
    const raw = (loc.label ?? '').trim()
    if (!raw) continue
    const key = raw.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(raw)
  }
  out.sort((a, b) => a.localeCompare(b))
  return out.slice(0, maxUniques)
}

/** Filter + sort A–Z for the dropdown (substring match). */
export function filterLabelSuggestions(
  sortedLabels: string[],
  query: string,
  max = LABEL_SUGGESTION_PANEL_MAX
): string[] {
  const q = query.trim().toLowerCase()
  const base = q
    ? sortedLabels.filter((s) => s.toLowerCase().includes(q))
    : sortedLabels
  return [...base].sort((a, b) => a.localeCompare(b)).slice(0, max)
}
