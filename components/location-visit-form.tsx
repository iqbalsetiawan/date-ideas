'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel as RHFLabel, FormControl, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { visitSchema, type VisitFormValues } from '@/lib/validation'
import { useStore } from '@/lib/store'
import { ItemLocation } from '@/lib/supabase'
import { useMemo } from 'react'
import { useResetOnOpen } from '@/lib/forms'

interface LocationVisitFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  location: ItemLocation
}

export function LocationVisitForm({ open, onOpenChange, location }: LocationVisitFormProps) {
  const { updateLocation, loading } = useStore()
  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: { visited_at: '' },
    mode: 'onSubmit',
  })

  const resetValues = useMemo<VisitFormValues>(() => ({
    visited_at: location.visited_at ? new Date(location.visited_at).toISOString().split('T')[0] : '',
  }), [location])
  useResetOnOpen(form, open, resetValues)

  const onSubmit = async (values: VisitFormValues) => {
    try {
      await updateLocation(location.id, {
        status: true,
        visited_at: values.visited_at || new Date().toISOString().split('T')[0],
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
          <DialogTitle>Mark Branch as Visited</DialogTitle>
          <DialogDescription>
            Select the date you visited this branch. You can leave it empty if unsure.
          </DialogDescription>
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
