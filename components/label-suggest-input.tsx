'use client'

import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { filterLabelSuggestions } from '@/lib/location-label-suggestions'
import { ChevronDown } from 'lucide-react'

export interface LabelSuggestInputProps
  extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'list'> {
  value: string
  onChange: (value: string) => void
  suggestions: string[]
}

export const LabelSuggestInput = forwardRef<HTMLInputElement, LabelSuggestInputProps>(
  function LabelSuggestInput(
    { value, onChange, suggestions, className, onBlur, onFocus, onKeyDown, disabled, ...rest },
    ref
  ) {
    const listId = useId()
    const [open, setOpen] = useState(false)
    const [highlight, setHighlight] = useState(-1)
    const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const filtered = useMemo(
      () => filterLabelSuggestions(suggestions, value),
      [suggestions, value]
    )

    const clearBlurTimer = useCallback(() => {
      if (blurTimer.current) {
        clearTimeout(blurTimer.current)
        blurTimer.current = null
      }
    }, [])

    useEffect(() => () => clearBlurTimer(), [clearBlurTimer])

    const scheduleClose = useCallback(() => {
      clearBlurTimer()
      blurTimer.current = setTimeout(() => {
        setOpen(false)
        setHighlight(-1)
      }, 180)
    }, [clearBlurTimer])

    const pick = useCallback(
      (label: string) => {
        onChange(label)
        setOpen(false)
        setHighlight(-1)
      },
      [onChange]
    )

    const showPanel = open && filtered.length > 0 && !disabled

    return (
      <div ref={containerRef} className="relative w-full">
        <div className="relative">
          <Input
            ref={ref}
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={showPanel ? listId : undefined}
            aria-autocomplete="list"
            value={value}
            disabled={disabled}
            className={cn('pr-8', className)}
            onChange={(e) => {
              onChange(e.target.value)
              setOpen(true)
              setHighlight(-1)
            }}
            onFocus={(e) => {
              clearBlurTimer()
              setOpen(true)
              onFocus?.(e)
            }}
            onBlur={(e) => {
              scheduleClose()
              onBlur?.(e)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                setOpen(false)
                setHighlight(-1)
                return
              }
              if (!showPanel && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && filtered.length > 0) {
                e.preventDefault()
                setOpen(true)
                setHighlight(e.key === 'ArrowDown' ? 0 : filtered.length - 1)
                return
              }
              if (showPanel) {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setHighlight((h) => (h < filtered.length - 1 ? h + 1 : 0))
                  return
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setHighlight((h) => (h > 0 ? h - 1 : filtered.length - 1))
                  return
                }
                if (e.key === 'Enter' && highlight >= 0 && filtered[highlight]) {
                  e.preventDefault()
                  pick(filtered[highlight])
                  return
                }
              }
              onKeyDown?.(e)
            }}
            {...rest}
          />
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled || suggestions.length === 0}
            className="absolute right-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            aria-label="Show area suggestions"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              clearBlurTimer()
              setOpen((o) => !o)
              setHighlight(-1)
            }}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
          </button>
        </div>
        {showPanel && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-[100] mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md"
          >
            {filtered.map((label, i) => (
              <li key={`${label}-${i}`} role="option" aria-selected={highlight === i}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full cursor-pointer items-center px-2.5 py-2 text-left text-sm outline-none',
                    'hover:bg-accent hover:text-accent-foreground',
                    highlight === i && 'bg-accent text-accent-foreground'
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(label)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
)
