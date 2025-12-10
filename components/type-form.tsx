'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Type, Item } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Edit } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormLabel as RHFLabel, FormControl, FormMessage } from '@/components/ui/form'
import { typeSchema, type TypeFormValues } from '@/lib/validation'
import { useResetOnOpen } from '@/lib/forms'
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
  const form = useForm<TypeFormValues>({
    resolver: zodResolver(typeSchema),
    defaultValues: { name: '', category: undefined as unknown as 'food' | 'place' },
    mode: 'onSubmit',
  })

  const resetValues = useMemo<TypeFormValues>(() => (
    editingType
      ? { name: editingType.name, category: editingType.category }
      : { name: '', category: undefined as unknown as 'food' | 'place' }
  ), [editingType])
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
      form.reset({ name: '', category: undefined as unknown as 'food' | 'place' })
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
    form.reset({ name: '', category: undefined as unknown as 'food' | 'place' })
  }

  const foodTypes = types.filter(type => type.category === 'food')
  const placeTypes = types.filter(type => type.category === 'place')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Types</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {editingType ? 'Edit Type' : 'Add New Type'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <RHFLabel>Type Name</RHFLabel>
                          <FormControl>
                            <Input placeholder="Enter type name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <RHFLabel>Category</RHFLabel>
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
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : editingType ? 'Update' : 'Add Type'}
                    </Button>
                    {editingType && (
                      <Button type="button" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Food Types ({foodTypes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {foodTypes.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No food types yet</p>
                ) : (
                  foodTypes.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <span className="font-medium">{type.name}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(type.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Place Types ({placeTypes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {placeTypes.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No place types yet</p>
                ) : (
                  placeTypes.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <span className="font-medium">{type.name}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(type.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
