'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Item, Type } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ItemForm } from './item-form'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { MapPin, ExternalLink, Edit, Trash2, CheckCircle } from 'lucide-react'

interface ItemTableProps {
  items: Item[]
  types: Type[]
  category: 'food' | 'place'
  loading: boolean
}

export function ItemTable({ items, types, category, loading }: ItemTableProps) {
  const { updateItem, deleteItem } = useStore()
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const getTypeName = (typeId: number) => {
    const type = types.find(t => t.id === typeId)
    return type?.name || 'Unknown'
  }

  const handleStatusChange = async (item: Item, checked: boolean) => {
    try {
      await updateItem(item.id, { status: checked })
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleEdit = (item: Item) => {
    setEditingItem(item)
    setShowEditForm(true)
  }

  const handleDelete = (item: Item) => {
    setItemToDelete(item)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteItem(itemToDelete.id)
      } catch (error) {
        console.error('Error deleting item:', error)
      }
    }
  }

  const openGoogleMaps = (location: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
    window.open(url, '_blank')
  }

  const openLink = (link: string) => {
    window.open(link, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-2">
          No {category} items yet
        </div>
        <p className="text-sm text-muted-foreground">
          Click &quot;Add New&quot; to create your first {category} item
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Link</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className={item.status ? 'opacity-60' : ''}>
                <TableCell>
                  <div className="flex items-center justify-center">
                    {item.status ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Checkbox
                        checked={item.status}
                        onCheckedChange={(checked) => 
                          handleStatusChange(item, checked as boolean)
                        }
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <div className={item.status ? 'line-through' : ''}>
                    {item.nama}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    {getTypeName(item.type_id)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[200px]">{item.lokasi}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openGoogleMaps(item.lokasi)}
                      className="h-6 w-6 p-0"
                    >
                      <MapPin className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  {item.link ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openLink(item.link!)}
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ItemForm
        open={showEditForm}
        onOpenChange={(open) => {
          setShowEditForm(open)
          if (!open) setEditingItem(null)
        }}
        category={category}
        types={types}
        item={editingItem || undefined}
      />
      
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open)
          if (!open) setItemToDelete(null)
        }}
        title="Delete Item"
        description={`Are you sure you want to delete "${itemToDelete?.nama}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </>
  )
}