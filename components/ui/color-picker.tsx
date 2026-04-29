'use client'

import * as React from 'react'
import { HexColorPicker } from 'react-colorful'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type ColorPickerProps = Omit<
  React.ComponentPropsWithoutRef<typeof Button>,
  'value' | 'onChange' | 'children'
> & {
  value: string
  onChange: (hex: string) => void
  onBlur?: () => void
}

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/
const PRESET_HEX = [
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#14B8A6',
  '#06B6D4',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#6B7280',
  '#111827',
]

function normalizeHex(value: string): string {
  const t = value.trim()
  if (HEX_PATTERN.test(t)) return t.toUpperCase()
  return '#3B82F6'
}

const ColorPicker = React.forwardRef<HTMLButtonElement, ColorPickerProps>(function ColorPicker(
  { className, value, onChange, onBlur, disabled, ...buttonProps },
  ref
) {
  const hex = normalizeHex(value)
  const [hexInput, setHexInput] = React.useState(hex.slice(1))

  React.useEffect(() => {
    setHexInput(hex.slice(1))
  }, [hex])

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) {
          setHexInput(hex.slice(1))
          onBlur?.()
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          ref={ref}
          disabled={disabled}
          className={cn('w-full justify-start gap-2 font-normal', className)}
          {...buttonProps}
        >
          <span
            className="size-4 shrink-0 rounded-sm border border-input shadow-sm"
            style={{ backgroundColor: hex }}
            aria-hidden
          />
          <span className="truncate font-mono text-xs text-muted-foreground tabular-nums">
            {hex}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-3" align="start">
        <div
          className="mb-3 h-10 w-full rounded-md border border-input"
          style={{ backgroundColor: hex }}
          aria-hidden
        />
        <HexColorPicker
          color={hex}
          onChange={(c) => onChange(c.toUpperCase())}
          style={{ width: 224, height: 160 }}
        />
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">#</span>
            <Input
              value={hexInput}
              onChange={(e) => {
                const cleaned = e.target.value
                  .replace(/[^0-9a-fA-F]/g, '')
                  .slice(0, 6)
                  .toUpperCase()
                setHexInput(cleaned)
                if (cleaned.length === 6) onChange(`#${cleaned}`)
              }}
              onBlur={() => {
                if (hexInput.length !== 6) setHexInput(hex.slice(1))
                onBlur?.()
              }}
              placeholder="RRGGBB"
              className="h-8 font-mono text-xs tracking-wider"
              spellCheck={false}
              maxLength={6}
              inputMode="text"
              aria-label="Hex color value"
            />
          </div>
          <div className="grid grid-cols-6 gap-1">
            {PRESET_HEX.map((preset) => (
              <button
                key={preset}
                type="button"
                className={cn(
                  'h-6 w-6 rounded-md border border-input transition-transform hover:scale-105',
                  hex === preset && 'ring-2 ring-ring ring-offset-1'
                )}
                style={{ backgroundColor: preset }}
                onClick={() => onChange(preset)}
                aria-label={`Pick ${preset}`}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
})

ColorPicker.displayName = 'ColorPicker'

export { ColorPicker }
