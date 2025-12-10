'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel as RHFLabel, FormControl, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { visitSchema, type VisitFormValues } from '@/lib/validation'
import { useStore } from '@/lib/store'
import { Item } from '@/lib/supabase'
import { useMemo } from 'react'
import { useResetOnOpen } from '@/lib/forms'

interface VisitFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item
}

export function VisitForm({ open, onOpenChange, item }: VisitFormProps) {
  const { updateItem, loading } = useStore()
  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: { visited_at: '' },
    mode: 'onSubmit',
  })

  const resetValues = useMemo<VisitFormValues>(() => ({
    visited_at: item.visited_at || '',
  }), [item])
  useResetOnOpen(form, open, resetValues)

  const onSubmit = async (values: VisitFormValues) => {
    try {
      await updateItem(item.id, {
        status: true,
        visited_at: values.visited_at || null,
      })
      onOpenChange(false)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mark as Visited</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="visited_at"
              render={({ field }) => (
                <FormItem>
                  <RHFLabel>Visit Date</RHFLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
