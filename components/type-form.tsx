'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Type, Item } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trash2, Edit } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormLabel as RHFLabel, FormControl, FormMessage } from '@/components/ui/form'
import { typeSchema, type TypeFormValues } from '@/lib/validation'
import { useResetOnOpen } from '@/lib/forms'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

interface TypeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  types: Type[]
  items: Item[]
}

export function TypeForm({ open, onOpenChange, types, items }: TypeFormProps) {
  const { addType, updateType, deleteType, loading } = useStore()
  const [editingType, setEditingType] = useState<Type | null>(null)
  const [typeCategoryTab, setTypeCategoryTab] = useState<'food' | 'place'>('food')
  const form = useForm<TypeFormValues>({
    resolver: zodResolver(typeSchema),
    defaultValues: { name: '', category: 'food' },
    mode: 'onSubmit',
  })

  const resetValues = useMemo<TypeFormValues>(() => (
    editingType
      ? { name: editingType.name, category: editingType.category }
      : { name: '', category: typeCategoryTab }
  ), [editingType, typeCategoryTab])
  useResetOnOpen(form, open, resetValues)

  const onSubmit = async (values: TypeFormValues) => {
    const duplicateType = types.find(type =>
      type.name.toLowerCase() === values.name.toLowerCase() &&
      type.category === values.category &&
      (!editingType || type.id !== editingType.id)
    )

    if (duplicateType) {
      form.setError('name', { message: `A ${values.category} type with this name already exists.` })
      return
    }

    try {
      if (editingType) {
        await updateType(editingType.id, { name: values.name, category: values.category })
        setEditingType(null)
      } else {
        await addType({ name: values.name, category: values.category })
      }
      form.reset({ name: '', category: typeCategoryTab })
    } catch (error) {
      console.error(error)
    }
  }

  const handleEdit = (type: Type) => {
    setEditingType(type)
    form.reset({ name: type.name, category: type.category })
  }

  const handleDelete = async (id: number) => {
    const itemsUsingType = items.filter(item => item.type_id === id)
    if (itemsUsingType.length > 0) {
      const typeToDelete = types.find(type => type.id === id)
      alert(`Cannot delete "${typeToDelete?.name}" type because it is being used by ${itemsUsingType.length} item(s). Please reassign or delete those items first.`)
      return
    }
    if (confirm('Are you sure you want to delete this type?')) {
      try {
        await deleteType(id)
      } catch (error) {
        console.error(error)
      }
    }
  }

  const cancelEdit = () => {
    setEditingType(null)
    form.reset({ name: '', category: typeCategoryTab })
  }

  const foodTypes = types.filter(type => type.category === 'food')
  const placeTypes = types.filter(type => type.category === 'place')

  const formCategory = form.watch('category')
  const activeCategoryTab = editingType
    ? (formCategory || editingType.category)
    : typeCategoryTab

  const handleDialogOpenChange = (next: boolean) => {
    if (!next) setEditingType(null)
    onOpenChange(next)
  }

  const renderTypeList = (list: Type[]) => (
    <div className="space-y-1.5 max-h-[min(40vh,14rem)] overflow-y-auto pr-1">
      {list.length === 0 ? (
        <p className="text-muted-foreground text-xs">None yet</p>
      ) : (
        list.map((type) => (
          <div
            key={type.id}
            className="flex items-center justify-between gap-2 py-1.5 px-2 border rounded-md"
          >
            <span className="font-medium">{type.name}</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(type)}
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(type.id)}
                className="text-destructive hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto gap-3 p-4 sm:p-5">
        <DialogHeader className="space-y-1">
          <DialogTitle>Manage Types</DialogTitle>
          <DialogDescription className="text-xs leading-snug">
            Add, edit, or delete types for food and places.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Card className="gap-3 py-4 shadow-sm">
            <CardHeader className="px-4 py-0">
              <CardTitle className="text-base">
                {editingType ? 'Edit Type' : 'Add New Type'}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-0">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  <div className={cn(editingType ? 'grid grid-cols-2 gap-3 items-start' : 'space-y-2')}>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <RHFLabel className="text-sm">Type Name</RHFLabel>
                          <FormControl>
                            <Input placeholder="Enter type name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {editingType && (
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <RHFLabel className="text-sm">Category</RHFLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="food">Food</SelectItem>
                                <SelectItem value="place">Place</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" size="sm" disabled={loading}>
                      {loading ? 'Saving...' : editingType ? 'Update' : 'Add Type'}
                    </Button>
                    {editingType && (
                      <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Tabs
            value={activeCategoryTab}
            onValueChange={(v) => {
              if (editingType) return
              const c = v as 'food' | 'place'
              setTypeCategoryTab(c)
              form.setValue('category', c)
            }}
            className="space-y-2"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="food" disabled={!!editingType}>
                Food ({foodTypes.length})
              </TabsTrigger>
              <TabsTrigger value="place" disabled={!!editingType}>
                Place ({placeTypes.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="food" className="mt-0">
              <Card className="gap-0 py-3 shadow-sm">
                <CardHeader className="px-4 py-0 pb-2">
                  <CardTitle className="text-sm font-medium">Food types</CardTitle>
                </CardHeader>
                <CardContent className="px-4">{renderTypeList(foodTypes)}</CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="place" className="mt-0">
              <Card className="gap-0 py-3 shadow-sm">
                <CardHeader className="px-4 py-0 pb-2">
                  <CardTitle className="text-sm font-medium">Place types</CardTitle>
                </CardHeader>
                <CardContent className="px-4">{renderTypeList(placeTypes)}</CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="pt-1">
          <Button variant="outline" size="sm" onClick={() => handleDialogOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
