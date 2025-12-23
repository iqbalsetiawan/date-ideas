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
import { useMemo } from 'react'

interface AddBranchFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item
}

export function AddBranchForm({ open, onOpenChange, item }: AddBranchFormProps) {
  const { addLocation, loading } = useStore()
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

  const onSubmit = async (values: BranchFormValues) => {
    try {
      await addLocation({
        item_id: item.id,
        label: values.label,
        url: values.url,
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
          <DialogTitle>Add Branch</DialogTitle>
          <DialogDescription>
            Add a new location branch for {item.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <RHFLabel>Label</RHFLabel>
                  <FormControl>
                    <Input placeholder="e.g. Branch Name or Area" {...field} />
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
                  <RHFLabel>Google Maps URL</RHFLabel>
                  <FormControl>
                    <Input placeholder="https://maps.google.com/..." {...field} />
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
                {loading ? 'Adding...' : 'Add Branch'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
