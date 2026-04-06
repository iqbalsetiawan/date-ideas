'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel as RHFLabel, FormControl, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { branchSchema, type BranchFormValues } from '@/lib/validation'
import { useStore } from '@/lib/store'
import { Item } from '@/lib/supabase'
import { useResetOnOpen } from '@/lib/forms'
import { getSortedLocationLabels } from '@/lib/location-label-suggestions'
import { LabelSuggestInput } from '@/components/label-suggest-input'
import { useMemo } from 'react'

interface AddBranchFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item
}

export function AddBranchForm({ open, onOpenChange, item }: AddBranchFormProps) {
  const { addLocation, loading, locations } = useStore()
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: { label: '', url: '' },
    mode: 'onSubmit',
  })

  const resetValues = useMemo<BranchFormValues>(() => ({
    label: '',
    url: '',
  }), [])
  
  useResetOnOpen(form, open, resetValues)

  const sortedLocationLabels = useMemo(
    () => getSortedLocationLabels(locations),
    [locations]
  )

  const onSubmit = async (values: BranchFormValues) => {
    try {
      await addLocation({
        item_id: item.id,
        label: values.label.trim(),
        url: values.url.trim(),
      })
      onOpenChange(false)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] gap-3 p-4 sm:p-5 overflow-visible">
        <DialogHeader className="space-y-1">
          <DialogTitle>Add Branch</DialogTitle>
          <DialogDescription className="text-xs leading-snug">
            For {item.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <RHFLabel className="text-sm">Area (optional)</RHFLabel>
                  <FormControl>
                    <LabelSuggestInput
                      placeholder="Search or pick an area (e.g. Blok M)"
                      autoComplete="off"
                      suggestions={sortedLocationLabels}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <RHFLabel>Google Maps URL (optional)</RHFLabel>
                  <FormControl>
                    <Input placeholder="https://maps.google.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? 'Adding...' : 'Add Branch'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
