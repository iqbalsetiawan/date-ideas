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
import { Sun, Moon } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const MemoizedItemTable = memo(ItemTable)
const MemoizedItemForm = memo(ItemForm)
const MemoizedTypeForm = memo(TypeForm)

export default function Home() {
  const { fetchItems, fetchTypes, fetchLocations, migrateLegacyLocations, items, types, locations, loading, error, toasts, removeToast } = useStore()
  const [showItemForm, setShowItemForm] = useState(false)
  const [showTypeForm, setShowTypeForm] = useState(false)
  const [activeTab, setActiveTab] = useState('food')
  const [mounted, setMounted] = useState(false)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

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
      foodItems: items.filter(item => item.category === 'food'),
      placeItems: items.filter(item => item.category === 'place'),
      foodTypes: types.filter(type => type.category === 'food'),
      placeTypes: types.filter(type => type.category === 'place')
    }
  }, [items, types])

  const [sortBy, setSortBy] = useState<'custom' | 'name' | 'visited' | 'date'>('custom')

  const sortItems = useCallback((list: typeof items, locs: typeof locations) => {
    const withDerived = list.map(item => {
      const itemBranches = locs.filter(l => l.item_id === item.id)
      const hasMultiple = itemBranches.length > 1
      const allVisited = hasMultiple && itemBranches.length > 0 && itemBranches.every(b => b.status)
      const someVisited = hasMultiple && itemBranches.some(b => b.status)
      const statusRank = hasMultiple ? (allVisited ? 2 : (someVisited ? 1 : 0)) : (item.status ? 1 : 0)
      const latestDateStr = hasMultiple
        ? itemBranches.filter(b => !!b.visited_at).map(b => b.visited_at as string).sort((a, b) => (new Date(b).getTime() - new Date(a).getTime()))[0] || null
        : item.visited_at
      const latestDate = latestDateStr ? new Date(latestDateStr) : null
      return { item, statusRank, latestDate }
    })
    switch (sortBy) {
      case 'name':
        return withDerived
          .slice()
          .sort((a, b) => a.item.name.localeCompare(b.item.name))
          .map(d => d.item)
      case 'visited':
        return withDerived
          .slice()
          .sort((a, b) => b.statusRank - a.statusRank)
          .map(d => d.item)
      case 'date':
        return withDerived
          .slice()
          .sort((a, b) => {
            const at = a.latestDate ? a.latestDate.getTime() : -Infinity
            const bt = b.latestDate ? b.latestDate.getTime() : -Infinity
            return bt - at
          })
          .map(d => d.item)
      case 'custom':
      default:
        return withDerived
          .slice()
          .sort((a, b) => {
            const dateA = a.latestDate ? a.latestDate.getTime() : null
            const dateB = b.latestDate ? b.latestDate.getTime() : null
            const hasDateA = dateA !== null
            const hasDateB = dateB !== null

            if (hasDateA && hasDateB) {
              return dateB! - dateA!
            }
            if (hasDateA) return 1
            if (hasDateB) return -1

            return (a.item.position || 0) - (b.item.position || 0)
          })
          .map(d => d.item)
    }
  }, [sortBy])

  const sortedFoodItems = useMemo(() => sortItems(foodItems, locations), [foodItems, locations, sortItems])
  const sortedPlaceItems = useMemo(() => sortItems(placeItems, locations), [placeItems, locations, sortItems])

  const needsMigration = useMemo(() => {
    if (initializing || loading || items.length === 0) return false
    const itemIdsWithLocations = new Set(locations.map(l => l.item_id))
    return items.some(item => item.location && !itemIdsWithLocations.has(item.id))
  }, [items, locations, loading, initializing])

  const handleShowItemForm = useCallback(() => setShowItemForm(true), [])
  const handleHideItemForm = useCallback(() => setShowItemForm(false), [])
  const handleShowTypeForm = useCallback(() => setShowTypeForm(true), [])
  const handleHideTypeForm = useCallback(() => setShowTypeForm(false), [])
  const handleTabChange = useCallback((value: string) => setActiveTab(value), [])
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const pref = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
      if (pref === 'light' || pref === 'dark') return pref
      return (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    try {
      const root = document.documentElement
      if (theme === 'dark') root.classList.add('dark')
      else root.classList.remove('dark')
      localStorage.setItem('theme', theme)
    } catch (error) {
      console.error('Failed to apply theme. Please try again.', error)
    }
  }, [theme])

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <div className="container mx-auto p-6 pb-0 max-w-7xl flex-none">
        <div className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Date Ideas</h1>
              <p className="text-muted-foreground mt-2">
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
              <Button
                variant="outline"
                size="sm"
                aria-label="Toggle theme"
                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                disabled={loading}
                className="flex-none"
              >
                {mounted && theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Card className="border-orange-200 bg-orange-50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-orange-800">
                <div className="text-sm">
                  <strong>Configuration needed:</strong> {error}
                </div>
              </div>
              {error.includes('Supabase credentials') && (
                <div className="mt-2 text-xs text-orange-700">
                  1. Copy .env.local.example to .env.local<br />
                  2. Add your Supabase project URL and anon key<br />
                  3. Run the SQL schema in your Supabase dashboard<br />
                  4. Restart the development server
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="container mx-auto px-6 pb-6 max-w-7xl flex-1 flex flex-col overflow-hidden min-h-0">
        <LoadingOverlay isLoading={initializing || (loading && items.length === 0)} loadingText="Loading your date ideas..." className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="food">Food ({foodItems.length})</TabsTrigger>
              <TabsTrigger value="place">Places ({placeItems.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="food" className="flex-1 overflow-hidden mt-0">
              <Card className="h-full flex flex-col border-0 shadow-none bg-transparent">
                <CardHeader className="flex-none px-0 pt-0 flex flex-row items-center justify-between space-y-0">
                  <CardTitle>Food to Try</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sort</span>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'custom' | 'name' | 'visited' | 'date')}>
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="visited">Visited</SelectItem>
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
                      allowDrag={sortBy === 'custom'}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="place" className="flex-1 overflow-hidden mt-0">
              <Card className="h-full flex flex-col border-0 shadow-none bg-transparent">
                <CardHeader className="flex-none px-0 pt-0 flex flex-row items-center justify-between space-y-0">
                  <CardTitle>Places to Visit</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sort</span>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'custom' | 'name' | 'visited' | 'date')}>
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="visited">Visited</SelectItem>
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
                      allowDrag={sortBy === 'custom'}
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
