'use client'

import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { Item, Type } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ExternalLink } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormLabel as RHFLabel, FormControl, FormMessage } from '@/components/ui/form'
import { itemSchema, type ItemFormValues } from '@/lib/validation'
import { useResetOnOpen } from '@/lib/forms'

interface ItemFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: 'food' | 'place'
  types: Type[]
  item?: Item
}

export function ItemForm({ open, onOpenChange, category, types, item }: ItemFormProps) {
  const { addItem, updateItem, loading } = useStore()
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: { name: '', type_id: '', location: '', link: '', status: false, visited_at: '' },
    mode: 'onSubmit',
  })
  const resetValues = useMemo<ItemFormValues>(() => (
    item
      ? { name: item.name, type_id: item.type_id.toString(), location: item.location, link: item.link || '', status: item.status, visited_at: item.visited_at || '' }
      : { name: '', type_id: '', location: '', link: '', status: false, visited_at: '' }
  ), [item])
  useResetOnOpen(form, open, resetValues)

  const onSubmit = async (values: ItemFormValues) => {
    try {
      if (item) {
        await updateItem(item.id, {
          name: values.name,
          type_id: parseInt(values.type_id),
          location: values.location,
          link: values.link || null,
          status: values.status,
          visited_at: values.status ? values.visited_at || null : null,
        })
      } else {
        await addItem({
          name: values.name,
          type_id: parseInt(values.type_id),
          location: values.location,
          link: values.link || null,
          status: values.status,
          visited_at: values.status ? values.visited_at || null : null,
          category,
        })
      }
      onOpenChange(false)
    } catch (error) {
      console.error(error)
    }
  }

  const openLink = () => {
    const link = form.getValues('link')
    if (link) {
      window.open(link, '_blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Edit' : 'Add New'} {category === 'food' ? 'Food' : 'Place'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <RHFLabel>Name</RHFLabel>
                  <FormControl>
                    <Input placeholder={`Enter ${category} name`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type_id"
              render={({ field }) => (
                <FormItem>
                  <RHFLabel>Type</RHFLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <RHFLabel className="flex items-center justify-between">
                    Location
                  </RHFLabel>
                  <FormControl>
                    <Input placeholder="Google Maps URL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <RHFLabel>Link (Optional)</RHFLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="TikTok, Instagram, or review link" className="flex-1" {...field} />
                    </FormControl>
                    <Button type="button" variant="outline" size="icon" onClick={openLink} disabled={!form.getValues('link')}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <Label htmlFor="status">Already visited</Label>
                  </div>
                </FormItem>
              )}
            />

            {form.watch('status') && (
              <>
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
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : item ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
