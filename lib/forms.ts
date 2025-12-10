import { useEffect } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'

export function useResetOnOpen<T extends FieldValues>(form: UseFormReturn<T>, open: boolean, values: T) {
  useEffect(() => {
    if (open) {
      form.reset(values)
    }
  }, [open, values, form])
}

