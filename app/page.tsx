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

// Memoized components for better performance
const MemoizedItemTable = memo(ItemTable)
const MemoizedItemForm = memo(ItemForm)
const MemoizedTypeForm = memo(TypeForm)

export default function Home() {
  const { fetchItems, fetchTypes, items, types, loading, error, toasts, removeToast } = useStore()
  const [showItemForm, setShowItemForm] = useState(false)
  const [showTypeForm, setShowTypeForm] = useState(false)
  const [activeTab, setActiveTab] = useState('food')

  useEffect(() => {
    fetchItems()
    fetchTypes()
  }, [fetchItems, fetchTypes])

  // Memoized filtered data to prevent unnecessary re-computations
  const { foodItems, placeItems, foodTypes, placeTypes } = useMemo(() => {
    return {
      foodItems: items.filter(item => item.category === 'food'),
      placeItems: items.filter(item => item.category === 'place'),
      foodTypes: types.filter(type => type.category === 'food'),
      placeTypes: types.filter(type => type.category === 'place')
    }
  }, [items, types])

  // Memoized callbacks to prevent unnecessary re-renders
  const handleShowItemForm = useCallback(() => setShowItemForm(true), [])
  const handleHideItemForm = useCallback(() => setShowItemForm(false), [])
  const handleShowTypeForm = useCallback(() => setShowTypeForm(true), [])
  const handleHideTypeForm = useCallback(() => setShowTypeForm(false), [])
  const handleTabChange = useCallback((value: string) => setActiveTab(value), [])

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Date Ideas</h1>
          <p className="text-muted-foreground mt-2">
            Manage your list of places to visit and food to try
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShowTypeForm}
            disabled={loading}
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Types
          </Button>
          <Button
            size="sm"
            onClick={handleShowItemForm}
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-800">
              <div className="text-sm">
                <strong>Configuration needed:</strong> {error}
              </div>
            </div>
            {error.includes('Supabase credentials') && (
              <div className="mt-2 text-xs text-orange-700">
                1. Copy .env.local.example to .env.local<br/>
                2. Add your Supabase project URL and anon key<br/>
                3. Run the SQL schema in your Supabase dashboard<br/>
                4. Restart the development server
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <LoadingOverlay isLoading={loading && items.length === 0} loadingText="Loading your date ideas...">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="food">Food ({foodItems.length})</TabsTrigger>
            <TabsTrigger value="place">Places ({placeItems.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="food" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Food to Try</CardTitle>
              </CardHeader>
              <CardContent>
                {loading && foodItems.length === 0 ? (
                  <TableLoadingSkeleton />
                ) : (
                  <MemoizedItemTable 
                    items={foodItems} 
                    types={foodTypes}
                    category="food"
                    loading={loading}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="place" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Places to Visit</CardTitle>
              </CardHeader>
              <CardContent>
                {loading && placeItems.length === 0 ? (
                  <TableLoadingSkeleton />
                ) : (
                  <MemoizedItemTable 
                    items={placeItems} 
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
