'use client'

import { useEffect, useState, useMemo, useCallback, memo } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ItemForm } from '../components/item-form'
import { TypeForm } from '../components/type-form'
import { ItemTable } from '../components/item-table'
import { ToastContainer } from '@/components/ui/toast'
import { LoadingOverlay, TableLoadingSkeleton } from '@/components/loading'
import { Plus, Settings } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { displayAreaLabel } from '@/lib/branch-label'

const MemoizedItemTable = memo(ItemTable)
const MemoizedItemForm = memo(ItemForm)
const MemoizedTypeForm = memo(TypeForm)

export default function Home() {
  const {
    fetchItems,
    fetchTypes,
    fetchLocations,
    migrateLegacyLocations,
    syncData,
    items,
    types,
    locations,
    loading,
    error,
    toasts,
    removeToast,
  } = useStore()
  const [showItemForm, setShowItemForm] = useState(false)
  const [showTypeForm, setShowTypeForm] = useState(false)
  const [activeTab, setActiveTab] = useState('food')
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([fetchItems(), fetchTypes(), fetchLocations()])
      } finally {
        setInitializing(false)
      }
    }
    init()
  }, [fetchItems, fetchTypes, fetchLocations])

  const { foodItems, placeItems, foodTypes, placeTypes } = useMemo(() => {
    return {
      foodItems: items.filter((item) => item.category === 'food'),
      placeItems: items.filter((item) => item.category === 'place'),
      foodTypes: types.filter((type) => type.category === 'food'),
      placeTypes: types.filter((type) => type.category === 'place'),
    }
  }, [items, types])

  const [sortBy, setSortBy] = useState<'name' | 'area' | 'type' | 'date'>('name')

  const sortItems = useCallback(
    (list: typeof items, locs: typeof locations) => {
      const typeName = (typeId: number) => types.find((t) => t.id === typeId)?.name ?? ''

      const primaryLocationLabel = (branches: typeof locs) => displayAreaLabel(branches)

      const compareLocationLabel = (a: string, b: string) => {
        const ae = !a
        const be = !b
        if (ae && be) return 0
        if (ae) return 1
        if (be) return -1
        return a.localeCompare(b)
      }

      const withDerived = list.map((item) => {
        const itemBranches = locs.filter((l) => l.item_id === item.id)
        const hasMultiple = itemBranches.length > 1
        const allVisited =
          hasMultiple && itemBranches.length > 0 && itemBranches.every((b) => b.status)
        const isFullyVisited = hasMultiple ? allVisited : item.status
        const latestDateStr = hasMultiple
          ? itemBranches
              .filter((b) => !!b.visited_at)
              .map((b) => b.visited_at as string)
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null
          : item.visited_at
        const latestDate = latestDateStr ? new Date(latestDateStr) : null
        return {
          item,
          latestDate,
          isFullyVisited,
          primaryLocationLabel: primaryLocationLabel(itemBranches),
        }
      })

      const doneRank = (fully: boolean) => (fully ? 1 : 0)

      switch (sortBy) {
        case 'name':
          return withDerived
            .slice()
            .sort((a, b) => {
              const da = doneRank(a.isFullyVisited)
              const db = doneRank(b.isFullyVisited)
              if (da !== db) return da - db
              return a.item.name.localeCompare(b.item.name)
            })
            .map((d) => d.item)
        case 'type':
          return withDerived
            .slice()
            .sort((a, b) => {
              const da = doneRank(a.isFullyVisited)
              const db = doneRank(b.isFullyVisited)
              if (da !== db) return da - db
              const byType = typeName(a.item.type_id).localeCompare(typeName(b.item.type_id))
              if (byType !== 0) return byType
              return a.item.name.localeCompare(b.item.name)
            })
            .map((d) => d.item)
        case 'area':
          return withDerived
            .slice()
            .sort((a, b) => {
              const da = doneRank(a.isFullyVisited)
              const db = doneRank(b.isFullyVisited)
              if (da !== db) return da - db
              const byLbl = compareLocationLabel(a.primaryLocationLabel, b.primaryLocationLabel)
              if (byLbl !== 0) return byLbl
              return a.item.name.localeCompare(b.item.name)
            })
            .map((d) => d.item)
        case 'date':
          return withDerived
            .slice()
            .sort((a, b) => {
              const da = doneRank(a.isFullyVisited)
              const db = doneRank(b.isFullyVisited)
              if (da !== db) return da - db
              const at = a.latestDate ? a.latestDate.getTime() : -Infinity
              const bt = b.latestDate ? b.latestDate.getTime() : -Infinity
              return bt - at
            })
            .map((d) => d.item)
      }
    },
    [sortBy, types]
  )

  const sortedFoodItems = useMemo(
    () => sortItems(foodItems, locations),
    [foodItems, locations, sortItems]
  )
  const sortedPlaceItems = useMemo(
    () => sortItems(placeItems, locations),
    [placeItems, locations, sortItems]
  )

  const needsMigration = useMemo(() => {
    if (initializing || loading || items.length === 0) return false
    const itemIdsWithLocations = new Set(locations.map((l) => l.item_id))
    return items.some((item) => item.location && !itemIdsWithLocations.has(item.id))
  }, [items, locations, loading, initializing])

  const needsSync = useMemo(() => {
    if (initializing || loading || items.length === 0) return false
    return items.some((item) => {
      const locs = locations.filter((l) => l.item_id === item.id)
      if (locs.length !== 1) return false
      return item.status && !locs[0].status
    })
  }, [items, locations, loading, initializing])

  const handleShowItemForm = useCallback(() => setShowItemForm(true), [])
  const handleHideItemForm = useCallback(() => setShowItemForm(false), [])
  const handleShowTypeForm = useCallback(() => setShowTypeForm(true), [])
  const handleHideTypeForm = useCallback(() => setShowTypeForm(false), [])
  const handleTabChange = useCallback((value: string) => setActiveTab(value), [])
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <div className="container mx-auto p-4 pb-0 max-w-7xl flex-none">
        <div className="mb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Date Ideas</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage your list of places to visit and food to try
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto items-center">
              {needsMigration && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => migrateLegacyLocations()}
                  disabled={loading}
                  className="hidden md:flex bg-amber-100 text-amber-900 hover:bg-amber-200"
                >
                  Migrate Data
                </Button>
              )}
              {needsSync && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => syncData()}
                  disabled={loading}
                  className="hidden md:flex bg-blue-100 text-blue-900 hover:bg-blue-200"
                >
                  Sync Status
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleShowItemForm}
                disabled={loading}
                className="flex-1 md:flex-none"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowTypeForm}
                disabled={loading}
                className="flex-1 md:flex-none"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Types
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Card className="border-orange-200 bg-orange-50 mb-4">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-orange-800">
                <div className="text-sm">
                  <strong>Configuration needed:</strong> {error}
                </div>
              </div>
              {error.includes('Supabase credentials') && (
                <div className="mt-2 text-xs text-orange-700">
                  1. Copy .env.local.example to .env.local
                  <br />
                  2. Add your Supabase project URL and anon key
                  <br />
                  3. Run the SQL schema in your Supabase dashboard
                  <br />
                  4. Restart the development server
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="container mx-auto px-4 pb-4 max-w-7xl flex-1 flex flex-col overflow-hidden min-h-0">
        <LoadingOverlay
          isLoading={initializing || (loading && items.length === 0)}
          loadingText="Loading your date ideas..."
          className="flex-1 flex flex-col min-h-0"
        >
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="food">Food ({foodItems.length})</TabsTrigger>
              <TabsTrigger value="place">Places ({placeItems.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="food" className="flex-1 overflow-hidden mt-0">
              <Card className="h-full flex flex-col border-0 shadow-none bg-transparent">
                <CardHeader className="flex-none px-0 pt-0 pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">Food to Try</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sort</span>
                    <Select
                      value={sortBy}
                      onValueChange={(v) => setSortBy(v as 'name' | 'area' | 'type' | 'date')}
                    >
                      <SelectTrigger className="w-[148px] h-8 text-xs">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="area">Area</SelectItem>
                        <SelectItem value="type">Type</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto min-h-0 px-0">
                  {loading && foodItems.length === 0 ? (
                    <TableLoadingSkeleton />
                  ) : (
                    <MemoizedItemTable
                      items={sortedFoodItems}
                      types={foodTypes}
                      category="food"
                      loading={loading}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="place" className="flex-1 overflow-hidden mt-0">
              <Card className="h-full flex flex-col border-0 shadow-none bg-transparent">
                <CardHeader className="flex-none px-0 pt-0 pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">Places to Visit</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sort</span>
                    <Select
                      value={sortBy}
                      onValueChange={(v) => setSortBy(v as 'name' | 'area' | 'type' | 'date')}
                    >
                      <SelectTrigger className="w-[148px] h-8 text-xs">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="area">Area</SelectItem>
                        <SelectItem value="type">Type</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto min-h-0 px-0">
                  {loading && placeItems.length === 0 ? (
                    <TableLoadingSkeleton />
                  ) : (
                    <MemoizedItemTable
                      items={sortedPlaceItems}
                      types={placeTypes}
                      category="place"
                      loading={loading}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </LoadingOverlay>
      </div>

      <MemoizedItemForm
        open={showItemForm}
        onOpenChange={handleHideItemForm}
        category={activeTab as 'food' | 'place'}
        types={activeTab === 'food' ? foodTypes : placeTypes}
      />

      <MemoizedTypeForm
        open={showTypeForm}
        onOpenChange={handleHideTypeForm}
        types={types}
        items={items}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
