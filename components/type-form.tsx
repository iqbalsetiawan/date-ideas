'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Type, Item } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Edit } from 'lucide-react'

interface TypeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  types: Type[]
  items: Item[]
}

export function TypeForm({ open, onOpenChange, types, items }: TypeFormProps) {
  const { addType, updateType, deleteType, loading } = useStore()
  const [formData, setFormData] = useState({
    name: '',
    category: '' as 'food' | 'place' | ''
  })
  const [editingType, setEditingType] = useState<Type | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.category) {
      return
    }

    // Check for duplicate type name in the same category
    const duplicateType = types.find(type => 
      type.name.toLowerCase() === formData.name.toLowerCase() && 
      type.category === formData.category &&
      (!editingType || type.id !== editingType.id)
    )

    if (duplicateType) {
      alert(`A ${formData.category} type with the name "${formData.name}" already exists.`)
      return
    }

    try {
      if (editingType) {
        await updateType(editingType.id, {
          name: formData.name,
          category: formData.category
        })
        setEditingType(null)
      } else {
        await addType({
          name: formData.name,
          category: formData.category
        })
      }
      setFormData({ name: '', category: '' })
    } catch (error) {
      console.error('Error saving type:', error)
    }
  }

  const handleEdit = (type: Type) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      category: type.category
    })
  }

  const handleDelete = async (id: number) => {
    // Check if any items are using this type
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
        console.error('Error deleting type:', error)
      }
    }
  }

  const cancelEdit = () => {
    setEditingType(null)
    setFormData({ name: '', category: '' })
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
          {/* Add/Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {editingType ? 'Edit Type' : 'Add New Type'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Type Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter type name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: 'food' | 'place') => 
                        setFormData({ ...formData, category: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="place">Place</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
            </CardContent>
          </Card>

          {/* Food Types */}
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

          {/* Place Types */}
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