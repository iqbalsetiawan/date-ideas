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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ItemForm } from './item-form'
import { VisitForm } from './visit-form'
import { LocationVisitForm } from './location-visit-form'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { MapPin, Edit, Trash2, CheckCircle, GripVertical, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { ItemLocation } from '@/lib/supabase'

interface ItemTableProps {
  items: Item[]
  types: Type[]
  category: 'food' | 'place'
  loading: boolean
  allowDrag?: boolean
}

export function ItemTable({ items, types, category, loading, allowDrag = true }: ItemTableProps) {
  const { updateItem, deleteItem, reorderItems, locations, updateLocation, reorderLocations } = useStore()
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [visitedItem, setVisitedItem] = useState<Item | null>(null)
  const [showVisitedForm, setShowVisitedForm] = useState(false)
  const [visitedLocation, setVisitedLocation] = useState<ItemLocation | null>(null)
  const [showLocationVisitForm, setShowLocationVisitForm] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [locationItem, setLocationItem] = useState<Item | null>(null)

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

  const handleLocationStatusChange = async (location: ItemLocation, checked: boolean) => {
    try {
      if (checked) {
        setVisitedLocation(location)
        setShowLocationVisitForm(true)
      } else {
        await updateLocation(location.id, { status: false, visited_at: null })
      }
    } catch (error) {
      console.error('Error updating location status:', error)
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

  if (loading && items.length === 0) {
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
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id, disabled: !allowDrag })
    const itemBranches = locations.filter(l => l.item_id === item.id)
    const primaryUrl = itemBranches[0]?.url || item.location
    const hasMultipleBranches = itemBranches.length > 1

    // Check if all branches are visited
    const allBranchesVisited = hasMultipleBranches && itemBranches.length > 0 && itemBranches.every(b => b.status)
    const someBranchesVisited = hasMultipleBranches && itemBranches.some(b => b.status)
    const totalCount = hasMultipleBranches ? itemBranches.length : 1
    const visitedCount = hasMultipleBranches ? itemBranches.filter(b => b.status).length : (item.status ? 1 : 0)

    // Determine effective status (visual only)
    const isCompleted = hasMultipleBranches ? allBranchesVisited : item.status
    const visitedLabel = hasMultipleBranches
      ? (allBranchesVisited ? 'Completed' : (someBranchesVisited ? 'Visited' : 'Not visited'))
      : (item.status ? 'Visited' : 'Not visited')
    const visitedBadgeClasses =
      visitedLabel === 'Completed'
        ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-700/10'
        : visitedLabel === 'Visited'
          ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-700/10'
          : 'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-700/10'
    const latestBranchDateStr = hasMultipleBranches
      ? itemBranches
          .filter(b => !!b.visited_at)
          .map(b => b.visited_at as string)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null
      : item.visited_at
    const visitDateText = latestBranchDateStr ? formatDate(latestBranchDateStr) : '-'
    const progressBadgeClasses =
      visitedCount === totalCount && totalCount > 0
        ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-700/10'
        : visitedCount > 0
          ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-700/10'
          : 'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-700/10'

    return (
      <TableRow
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        key={item.id}
        {...attributes}
      >
        <TableCell className="w-10">
          <Button
            type="button"
            variant="ghost"
            title={allowDrag ? "Drag to reorder" : "Switch to Custom sort to reorder"}
            className={cn("h-8 w-8 flex items-center justify-center p-0", allowDrag ? "cursor-grab" : "cursor-not-allowed opacity-40")}
            {...(allowDrag ? listeners : {})}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
        </TableCell>
        <TableCell className="text-center p-0">
          <div className="flex items-center justify-center">
            {
              (hasMultipleBranches ? isCompleted : item.status) ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                !hasMultipleBranches && (
                  <Checkbox
                    checked={item.status}
                    onCheckedChange={(checked) =>
                      handleStatusChange(item, checked as boolean)
                    }
                  />
                )
              )
            }
          </div>
        </TableCell>
        <TableCell className="font-medium">
          <div className={cn(isCompleted ? 'line-through opacity-60' : '')}>
            {item.name}
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell text-center">
          <span className={cn('inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10', isCompleted ? 'opacity-60' : '')}>
            {getTypeName(item.type_id)}
          </span>
        </TableCell>
        <TableCell>
          <div className={cn('flex items-center gap-2')}>
            {hasMultipleBranches ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocationItem(item)}
                className="h-6 px-2 text-xs"
              >
                <MapPin className="h-3 w-3 mr-1" />
                {itemBranches.length} Locations
              </Button>
            ) : (
              <>
                <span className={cn('truncate max-w-[140px] md:max-w-[200px]', isCompleted ? 'opacity-60' : '')}>{primaryUrl}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openGoogleMaps(primaryUrl)}
                  className="h-6 w-6 p-0"
                >
                  <MapPin className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell text-center">
          <span className={cn('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', progressBadgeClasses)}>
            {visitedCount}/{totalCount}
          </span>
        </TableCell>
        <TableCell className="hidden md:table-cell text-center">
          <span className={cn('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', visitedBadgeClasses)}>
            {visitedLabel}
          </span>
        </TableCell>
        <TableCell className="hidden md:table-cell text-center">
          <span className="text-sm text-muted-foreground">{visitDateText}</span>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-center gap-1">
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
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id, disabled: !allowDrag })
    const itemBranches = locations.filter(l => l.item_id === item.id)
    const primaryUrl = itemBranches[0]?.url || item.location
    const hasMultipleBranches = itemBranches.length > 1

    // Check if all branches are visited
    const allBranchesVisited = hasMultipleBranches && itemBranches.length > 0 && itemBranches.every(b => b.status)
    const someBranchesVisited = hasMultipleBranches && itemBranches.some(b => b.status)
    const totalCount = hasMultipleBranches ? itemBranches.length : 1
    const visitedCount = hasMultipleBranches ? itemBranches.filter(b => b.status).length : (item.status ? 1 : 0)

    // Determine effective status (visual only)
    const isCompleted = hasMultipleBranches ? allBranchesVisited : item.status
    const visitedLabel = hasMultipleBranches
      ? (allBranchesVisited ? 'Completed' : (someBranchesVisited ? 'Visited' : 'Not visited'))
      : (item.status ? 'Visited' : 'Not visited')
    const visitedBadgeClasses =
      visitedLabel === 'Completed'
        ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-700/10'
        : visitedLabel === 'Visited'
          ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-700/10'
          : 'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-700/10'
    const progressBadgeClasses =
      visitedCount === totalCount && totalCount > 0
        ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-700/10'
        : visitedCount > 0
          ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-700/10'
          : 'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-700/10'

    return (
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        key={item.id}
        {...attributes}
        className="rounded-md border p-3 bg-background"
      >
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            title={allowDrag ? "Drag to reorder" : "Switch to Custom sort to reorder"}
            className={cn("h-8 w-8 flex items-center justify-center shrink-0 p-0", allowDrag ? "cursor-grab" : "cursor-not-allowed opacity-40")}
            {...(allowDrag ? listeners : {})}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
          <div className={cn('font-medium flex-1', isCompleted ? 'line-through opacity-60' : '')}>
            {item.name}
          </div>
          <span className={cn('inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10', isCompleted ? 'opacity-60' : '')}>
            {getTypeName(item.type_id)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-evenly gap-2">
          <div className="flex items-center gap-2">
            {
              (hasMultipleBranches ? isCompleted : item.status) ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                !hasMultipleBranches && (
                  <Checkbox
                    checked={item.status}
                    onCheckedChange={(checked) =>
                      handleStatusChange(item, checked as boolean)
                    }
                  />
                )
              )
            }
            <span className={cn('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', progressBadgeClasses)}>
              {visitedCount}/{totalCount}
            </span>
            <span className={cn('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', visitedBadgeClasses)}>
              {visitedLabel}
            </span>
          </div>
          {hasMultipleBranches ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocationItem(item)}
              className="h-8 px-2 text-xs"
            >
              <MapPin className="h-4 w-4 mr-1" />
              {itemBranches.length}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openGoogleMaps(primaryUrl)}
              className="h-8 w-8 p-0"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          )}
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

  const selectedItemBranches = locationItem
    ? locations.filter(l => l.item_id === locationItem.id)
    : []

  return (
    <>
      {allowDrag ? (
        <DndContext onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis, restrictToParentElement]}>
          {!isMobile && (
            <div className="rounded-md border overflow-x-auto md:overflow-visible">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-background hover:bg-background">
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="w-[50px] text-center">Complete</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell text-center">Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="hidden md:table-cell text-center">Progress</TableHead>
                    <TableHead className="hidden md:table-cell text-center">Visited</TableHead>
                    <TableHead className="hidden md:table-cell text-center">Date</TableHead>
                    <TableHead className="w-[120px] text-center">Actions</TableHead>
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
      ) : (
        <>
          {!isMobile && (
            <div className="rounded-md border overflow-x-auto md:overflow-visible">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-background hover:bg-background">
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="w-[50px] text-center">Complete</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell text-center">Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="hidden md:table-cell text-center">Progress</TableHead>
                    <TableHead className="hidden md:table-cell text-center">Visited</TableHead>
                    <TableHead className="hidden md:table-cell text-center">Date</TableHead>
                    <TableHead className="w-[120px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <Row key={item.id} item={item} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {isMobile && (
            <div className="space-y-2">
              {items.map((item) => (
                <MobileRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}

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

      <Dialog open={!!locationItem} onOpenChange={(open) => !open && setLocationItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Locations for {locationItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 mt-4">
            {selectedItemBranches.length > 0 ? (
              <DndContext
                onDragEnd={(event) => {
                  const { active, over } = event
                  if (!over || active.id === over.id || !locationItem) return
                  const ids = selectedItemBranches.map(b => b.id)
                  const oldIndex = ids.indexOf(active.id as number)
                  const newIndex = ids.indexOf(over.id as number)
                  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return
                  const newIds = arrayMove(ids, oldIndex, newIndex)
                  reorderLocations(locationItem.id, newIds)
                }}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              >
                <SortableContext items={selectedItemBranches.map(b => b.id)} strategy={verticalListSortingStrategy}>
                  {selectedItemBranches.map((branch) => (
                    <LocationRow
                      key={branch.id}
                      branch={branch}
                      onToggle={(checked) => handleLocationStatusChange(branch, checked)}
                      onOpenMap={() => openGoogleMaps(branch.url)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              <div className="flex items-center justify-between p-3 border rounded-md">
                <span className="font-medium">Main</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => locationItem && openGoogleMaps(locationItem.location)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Map
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {visitedLocation && (
        <LocationVisitForm
          open={showLocationVisitForm}
          onOpenChange={(open) => {
            setShowLocationVisitForm(open)
            if (!open) setVisitedLocation(null)
          }}
          location={visitedLocation}
        />
      )}
    </>
  )
}

function LocationRow({ branch, onToggle, onOpenMap }: { branch: ItemLocation, onToggle: (checked: boolean) => void, onOpenMap: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: branch.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center justify-between p-3 border rounded-md"
      {...attributes}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          title="Drag to reorder"
          className="h-6 w-6 flex items-center justify-center cursor-grab"
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Checkbox
          checked={branch.status || false}
          onCheckedChange={(checked) => onToggle(checked as boolean)}
        />
        <div className="flex flex-col">
          <span className={cn('font-medium', branch.status && 'line-through opacity-60')}>{branch.label}</span>
          {branch.status && branch.visited_at && (
            <span className="text-xs text-muted-foreground">Visited: {formatDate(branch.visited_at)}</span>
          )}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenMap}
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        Open Map
      </Button>
    </div>
  )
}
