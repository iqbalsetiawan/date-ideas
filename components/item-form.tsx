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
import { getSortedLocationLabels } from '@/lib/location-label-suggestions'
import { LabelSuggestInput } from '@/components/label-suggest-input'
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

  const watchedLocations = form.watch('locations') || []
  const multipleLocations = watchedLocations.length > 1

  const sortedLocationLabels = useMemo(
    () => getSortedLocationLabels(locations),
    [locations]
  )

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
    const normalizedLocs = values.locations.map((l) => ({
      id: l.id,
      label: (l.label ?? '').trim(),
      url: (l.url ?? '').trim(),
    }))
    const primaryLocation = normalizedLocs[0]?.url ?? ''
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
        const formLocationIds = normalizedLocs.map(l => l.id).filter(Boolean) as number[];
        const toDelete = currentLocations.filter(l => !formLocationIds.includes(l.id));
        for (const loc of toDelete) {
          await deleteLocation(loc.id);
        }

        // Identify updates and additions
        for (const loc of normalizedLocs) {
          if (loc.id) {
            // Update
            const existing = currentLocations.find(l => l.id === loc.id);
            if (existing && (existing.label !== loc.label || existing.url !== loc.url)) {
              await updateLocation(loc.id, { label: loc.label, url: loc.url });
            }
          } else if (loc.url) {
            // Add — only persist rows with a URL (avoids empty duplicate branches)
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
          for (const loc of normalizedLocs) {
            if (loc.url) {
              await addLocation({
                item_id: newItem.id,
                label: loc.label,
                url: loc.url,
                status: false
              });
            }
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
      <DialogContent className="sm:max-w-[550px] gap-3 p-4 sm:p-5 overflow-visible">
        <DialogHeader className="space-y-1">
          <DialogTitle>
            {item ? 'Edit' : 'Add New'} {category === 'food' ? 'Food' : 'Place'}
          </DialogTitle>
          <DialogDescription className="text-xs leading-snug">
            {item ? 'Update the details for this entry.' : 'Fill in the details to add it to your list.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <RHFLabel className="text-sm">Locations (optional)</RHFLabel>
                {!item && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0"
                    onClick={() => append({ label: '', url: '' })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Branch
                  </Button>
                )}
              </div>
              <div className="space-y-1.5 pr-1">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <FormField
                      control={form.control}
                      name={`locations.${index}.label`}
                      render={({ field }) => (
                        <FormItem className="flex-1 min-w-0">
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
                      name={`locations.${index}.url`}
                      render={({ field }) => (
                        <FormItem className="flex-[2] min-w-0">
                          <FormControl>
                            <Input placeholder="Google Maps URL (optional)" {...field} />
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
                        className="shrink-0 text-destructive hover:text-destructive"
                        onClick={() => remove(index)}
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

            <DialogFooter className="gap-2 sm:gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? 'Saving...' : item ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
