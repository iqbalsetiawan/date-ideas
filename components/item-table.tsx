'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { Item, Type } from '@/lib/supabase'
import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ItemForm } from './item-form'
import { VisitForm } from './visit-form'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { MapPin, ExternalLink, Edit, Trash2, CheckCircle, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

interface ItemTableProps {
  items: Item[]
  types: Type[]
  category: 'food' | 'place'
  loading: boolean
}

export function ItemTable({ items, types, category, loading }: ItemTableProps) {
  const { updateItem, deleteItem, reorderItems } = useStore()
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [visitedItem, setVisitedItem] = useState<Item | null>(null)
  const [showVisitedForm, setShowVisitedForm] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)')
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const matches = 'matches' in e ? e.matches : (e as MediaQueryList).matches
      setIsMobile(matches)
    }
    setIsMobile(mql.matches)
    mql.addEventListener('change', onChange as (e: MediaQueryListEvent) => void)
    return () => {
      mql.removeEventListener('change', onChange as (e: MediaQueryListEvent) => void)
    }
  }, [])

  const getTypeName = (typeId: number) => {
    const type = types.find(t => t.id === typeId)
    return type?.name || 'Unknown'
  }

  const handleStatusChange = async (item: Item, checked: boolean) => {
    try {
      if (checked) {
        setVisitedItem(item)
        setShowVisitedForm(true)
      } else {
        await updateItem(item.id, { status: false, visited_at: null })
      }
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

  const openGoogleMaps = (url: string) => {
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

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = items.map(i => i.id)
    const oldIndex = ids.indexOf(active.id as number)
    const newIndex = ids.indexOf(over.id as number)
    const newIds = arrayMove(ids, oldIndex, newIndex)
    reorderItems(newIds)
  }

  const Row = ({ item }: { item: Item }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
    return (
      <TableRow
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        key={item.id}
        {...attributes}
      >
        <TableCell className="w-10">
          <button
            type="button"
            title="Drag to reorder"
            className="h-8 w-8 flex items-center justify-center cursor-grab"
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </TableCell>
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
          <div className={cn(item.status ? 'line-through opacity-60' : '')}>
            {item.name}
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <span className={cn('inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10', item.status ? 'opacity-60' : '')}>
            {getTypeName(item.type_id)}
          </span>
        </TableCell>
        <TableCell>
          <div className={cn('flex items-center gap-2')}>
            <span className={cn('truncate max-w-[140px] md:max-w-[200px]', item.status ? 'opacity-60' : '')}>{item.location}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openGoogleMaps(item.location)}
              className="h-6 w-6 p-0"
            >
              <MapPin className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {item.link ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openLink(item.link!)}
              className={cn('h-6 w-6 p-0', item.status ? 'opacity-60' : '')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          ) : (
            <span className={cn('text-muted-foreground text-sm', item.status ? 'opacity-60' : '')}>-</span>
          )}
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <span className="text-sm text-muted-foreground">
            {item.status && item.visited_at ? formatDate(item.visited_at) : '-'}
          </span>
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
    )
  }

  const MobileRow = ({ item }: { item: Item }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
    return (
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        key={item.id}
        {...attributes}
        className="rounded-md border p-3 bg-background"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Drag to reorder"
            className="h-8 w-8 flex items-center justify-center cursor-grab shrink-0"
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className={cn('font-medium flex-1', item.status ? 'line-through opacity-60' : '')}>
            {item.name}
          </div>
          <span className={cn('inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10', item.status ? 'opacity-60' : '')}>
            {getTypeName(item.type_id)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-evenly gap-2">
          <div className="flex items-center gap-2">
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
            <span className="text-sm text-muted-foreground">
              {item.status && item.visited_at ? formatDate(item.visited_at) : 'Not visited'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openGoogleMaps(item.location)}
            className="h-8 w-8 p-0"
          >
            <MapPin className="h-4 w-4" />
          </Button>
          {item.link ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openLink(item.link!)}
              className={cn('h-8 w-8 p-0', item.status ? 'opacity-60' : '')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          ) : null}
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
      </div>
    )
  }

  return (
    <>
      <DndContext onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis, restrictToParentElement]}>
        {!isMobile && (
          <div className="rounded-md border overflow-x-auto md:overflow-visible">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-[50px]">Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="hidden md:table-cell">Link</TableHead>
                  <TableHead className="hidden md:table-cell">Visited</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <TableBody>
                  {items.map((item) => (
                    <Row key={item.id} item={item} />
                  ))}
                </TableBody>
              </SortableContext>
            </Table>
          </div>
        )}
        {isMobile && (
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item) => (
                <MobileRow key={item.id} item={item} />
              ))}
            </div>
          </SortableContext>
        )}
      </DndContext>

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

      {visitedItem && (
        <VisitForm
          open={showVisitedForm}
          onOpenChange={(open) => {
            setShowVisitedForm(open)
            if (!open) setVisitedItem(null)
          }}
          item={visitedItem}
        />
      )}

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open)
          if (!open) setItemToDelete(null)
        }}
        title="Delete Item"
        description={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </>
  )
}
