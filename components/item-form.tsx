'use client'

import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { Item, Type } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormLabel as RHFLabel, FormControl, FormMessage } from '@/components/ui/form'
import { itemSchema, type ItemFormValues } from '@/lib/validation'
import { useResetOnOpen } from '@/lib/forms'
import { Plus, Trash2 } from 'lucide-react'

interface ItemFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: 'food' | 'place'
  types: Type[]
  item?: Item
}

export function ItemForm({ open, onOpenChange, category, types, item }: ItemFormProps) {
  const { addItem, updateItem, loading, locations, addLocation, updateLocation, deleteLocation } = useStore()
  
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: { 
      name: '', 
      type_id: '', 
      locations: [{ label: '', url: '' }], 
      status: false, 
      visited_at: '' 
    },
    mode: 'onSubmit',
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "locations"
  });

  const multipleLocations = (form.watch('locations') || []).length > 1

  const resetValues = useMemo<ItemFormValues>(() => {
    if (!item) {
      return { 
        name: '', 
        type_id: '', 
        locations: [{ label: '', url: '' }], 
        status: false, 
        visited_at: '' 
      }
    }

    const itemLocations = locations.filter(l => l.item_id === item.id)
    const formLocations = itemLocations.length > 0 
      ? itemLocations.map(l => ({ id: l.id, label: l.label, url: l.url }))
      : [{ label: '', url: item.location }]

    return {
      name: item.name,
      type_id: item.type_id.toString(),
      locations: formLocations,
      status: item.status,
      visited_at: item.visited_at || ''
    }
  }, [item, locations])

  useResetOnOpen(form, open, resetValues)

  const onSubmit = async (values: ItemFormValues) => {
    const primaryLocation = values.locations[0].url;
    const isMulti = values.locations.length > 1

    try {
      if (item) {
        // Update Item
        await updateItem(item.id, {
          name: values.name,
          type_id: parseInt(values.type_id),
          location: primaryLocation,
          status: isMulti ? false : values.status,
          visited_at: isMulti ? null : (values.status ? values.visited_at || null : null),
        });

        // Handle Locations
        const currentLocations = locations.filter(l => l.item_id === item.id);
        
        // Identify deletions
        const formLocationIds = values.locations.map(l => l.id).filter(Boolean);
        const toDelete = currentLocations.filter(l => !formLocationIds.includes(l.id));
        for (const loc of toDelete) {
          await deleteLocation(loc.id);
        }

        // Identify updates and additions
        for (const loc of values.locations) {
          if (loc.id) {
            // Update
            const existing = currentLocations.find(l => l.id === loc.id);
            if (existing && (existing.label !== loc.label || existing.url !== loc.url)) {
              await updateLocation(loc.id, { label: loc.label, url: loc.url });
            }
          } else {
            // Add
            await addLocation({
              item_id: item.id,
              label: loc.label,
              url: loc.url,
              status: false
            });
          }
        }

      } else {
        // Create Item
        const newItem = await addItem({
          name: values.name,
          type_id: parseInt(values.type_id),
          location: primaryLocation,
          status: isMulti ? false : values.status,
          visited_at: isMulti ? null : (values.status ? values.visited_at || null : null),
          category,
        });

        if (newItem) {
          // Add locations for new item
          for (const loc of values.locations) {
            await addLocation({
              item_id: newItem.id,
              label: loc.label,
              url: loc.url,
              status: false
            });
          }
        }
      }
      onOpenChange(false)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Edit' : 'Add New'} {category === 'food' ? 'Food' : 'Place'}
          </DialogTitle>
          <DialogDescription>
            Fill in name, type, and branches. Add multiple branches if needed. Visit tracking is disabled when multiple branches are present.
          </DialogDescription>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <RHFLabel>Locations</RHFLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ label: '', url: '' })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Branch
                </Button>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <FormField
                      control={form.control}
                      name={`locations.${index}.label`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="e.g. Blok M" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`locations.${index}.url`}
                      render={({ field }) => (
                        <FormItem className="flex-[2]">
                          <FormControl>
                            <Input placeholder="Google Maps URL" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-destructive"
                        title="Remove Branch"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <FormMessage>
                {form.formState.errors.locations?.message || form.formState.errors.locations?.root?.message}
              </FormMessage>
            </div>

            {!multipleLocations && (
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
            )}

            {!multipleLocations && form.watch('status') && (
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
