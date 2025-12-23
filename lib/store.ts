import { create } from 'zustand'
import { supabase, Item, Type, ItemInsert, TypeInsert, ItemLocation, ItemLocationInsert, hasValidCredentials } from './supabase'

interface Toast {
  id: string
  title?: string
  description?: string
  type?: 'success' | 'error' | 'info'
  duration?: number
}

interface Store {
  items: Item[]
  types: Type[]
  locations: ItemLocation[]
  loading: boolean
  error: string | null
  toasts: Toast[]

  fetchItems: () => Promise<void>
  addItem: (item: ItemInsert) => Promise<Item | null>
  updateItem: (id: number, item: Partial<Item>) => Promise<void>
  deleteItem: (id: number) => Promise<void>
  reorderItems: (orderedIds: number[]) => Promise<void>

  fetchTypes: () => Promise<void>
  fetchLocations: () => Promise<void>
  addType: (type: TypeInsert) => Promise<void>
  updateType: (id: number, type: Partial<Type>) => Promise<void>
  deleteType: (id: number) => Promise<void>

  addLocation: (location: ItemLocationInsert) => Promise<void>
  updateLocation: (id: number, location: Partial<ItemLocation>) => Promise<void>
  deleteLocation: (id: number) => Promise<void>
  migrateLegacyLocations: () => Promise<void>
  syncData: () => Promise<void>

  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useStore = create<Store>((set, get) => ({
  items: [],
  types: [],
  locations: [],
  loading: true,
  error: null,
  toasts: [],

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }))
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter(toast => toast.id !== id)
    }))
  },

  fetchItems: async () => {
    if (!hasValidCredentials) {
      set({
        items: [],
        loading: false,
        error: 'Please configure your Supabase credentials in .env.local'
      })
      return
    }

    try {
      set({ loading: true, error: null })
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          types!inner(id, name, category)
        `)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ items: data || [] })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  fetchLocations: async () => {
    if (!hasValidCredentials) return
    try {
      const { data, error } = await supabase
        .from('item_locations')
        .select('*')
        .order('item_id')
        .order('position', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error
      set({ locations: data || [] })
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  addItem: async (item) => {
    if (!hasValidCredentials) {
      set({ error: 'Please configure your Supabase credentials to add items' })
      return null
    }

    try {
      set({ loading: true, error: null })
      const { data, error } = await supabase
        .from('items')
        .insert(item)
        .select()
        .single()

      if (error) throw error

      const { items, addToast } = get()
      const minPos = items.length > 0 ? Math.min(...items.map(i => i.position || 0)) : 1
      const newPos = minPos - 1
      await supabase.from('items').update({ position: newPos }).eq('id', data.id)
      const updated = { ...data, position: newPos }
      set({ items: [updated, ...items] })
      addToast({
        title: 'Success!',
        description: `${data.name} has been added successfully.`,
        type: 'success'
      })
      return updated
    } catch (error) {
      const { addToast } = get()
      set({ error: (error as Error).message })
      addToast({
        title: 'Error',
        description: 'Failed to add item. Please try again.',
        type: 'error'
      })
      return null
    } finally {
      set({ loading: false })
    }
  },

  updateItem: async (id, updates) => {
    try {
      set({ loading: true, error: null })
      const { data, error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const { items, locations, updateLocation, addToast } = get()
      set({
        items: items.map(item => item.id === id ? { ...item, ...data } : item)
      })

      // Sync location if single location exists
      const itemLocations = locations.filter(l => l.item_id === id)
      if (itemLocations.length === 1) {
        const loc = itemLocations[0]
        if (loc.status !== data.status || loc.visited_at !== data.visited_at) {
          updateLocation(loc.id, {
            status: data.status,
            visited_at: data.visited_at
          })
        }
      }
      addToast({
        title: 'Updated!',
        description: `${data.name} has been updated successfully.`,
        type: 'success'
      })
    } catch (error) {
      const { addToast } = get()
      set({ error: (error as Error).message })
      addToast({
        title: 'Error',
        description: 'Failed to update item. Please try again.',
        type: 'error'
      })
    } finally {
      set({ loading: false })
    }
  },

  reorderItems: async (orderedIds) => {
    const { items } = get()
    const idToItem = new Map(items.map(i => [i.id, i]))
    if (orderedIds.length === 0) return
    const affectedCategory = idToItem.get(orderedIds[0])!.category
    const orderedSet = new Set(orderedIds)
    const reorderedSubset = orderedIds.map((id, idx) => ({
      ...idToItem.get(id)!,
      position: idx + 1
    }))
    const others = items.filter(i => i.category !== affectedCategory || !orderedSet.has(i.id))
    set({ items: [...others, ...reorderedSubset] })

    if (!hasValidCredentials) return
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i]
      const pos = i + 1
      await supabase.from('items').update({ position: pos }).eq('id', id)
    }
  },

  deleteItem: async (id) => {
    try {
      set({ loading: true, error: null })
      const { items } = get()
      const itemToDelete = items.find(item => item.id === id)

      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id)

      if (error) throw error

      const { addToast } = get()
      set({ items: items.filter(item => item.id !== id) })
      addToast({
        title: 'Deleted!',
        description: `${itemToDelete?.name || 'Item'} has been deleted successfully.`,
        type: 'success'
      })
    } catch (error) {
      const { addToast } = get()
      set({ error: (error as Error).message })
      addToast({
        title: 'Error',
        description: 'Failed to delete item. Please try again.',
        type: 'error'
      })
    } finally {
      set({ loading: false })
    }
  },

  fetchTypes: async () => {
    if (!hasValidCredentials) {
      set({
        types: [],
        loading: false,
        error: 'Please configure your Supabase credentials in .env.local'
      })
      return
    }

    try {
      set({ loading: true, error: null })
      const { data, error } = await supabase
        .from('types')
        .select('*')
        .order('name')

      if (error) throw error
      set({ types: data || [] })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  addType: async (type) => {
    if (!hasValidCredentials) {
      set({ error: 'Please configure your Supabase credentials to add types' })
      return
    }

    try {
      set({ loading: true, error: null })
      const { data, error } = await supabase
        .from('types')
        .insert(type)
        .select()
        .single()

      if (error) throw error

      const { types } = get()
      set({ types: [...types, data].sort((a, b) => a.name.localeCompare(b.name)) })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  updateType: async (id, updates) => {
    try {
      set({ loading: true, error: null })
      const { data, error } = await supabase
        .from('types')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const { types } = get()
      set({
        types: types.map(type => type.id === id ? { ...type, ...data } : type)
          .sort((a, b) => a.name.localeCompare(b.name))
      })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  deleteType: async (id) => {
    try {
      set({ loading: true, error: null })
      const { error } = await supabase
        .from('types')
        .delete()
        .eq('id', id)

      if (error) throw error

      const { types } = get()
      set({ types: types.filter(type => type.id !== id) })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  addLocation: async (location) => {
    if (!hasValidCredentials) return
    try {
      const { data, error } = await supabase
        .from('item_locations')
        .insert({ status: false, visited_at: null, ...location })
        .select()
        .single()

      if (error) throw error

      const { locations } = get()
      
      const others = locations.filter(l => l.item_id !== data.item_id)
      const currentItemLocations = locations.filter(l => l.item_id === data.item_id)
      const updatedList = [...others, ...currentItemLocations, data]
      set({ locations: updatedList.sort((a, b) => (a.item_id - b.item_id) || (a.position || 0) - (b.position || 0)) })
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  updateLocation: async (id, updates) => {
    if (!hasValidCredentials) return
    try {
      const { data, error } = await supabase
        .from('item_locations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const { locations } = get()
      set({
        locations: locations.map(loc => loc.id === id ? { ...loc, ...data } : loc)
      })
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  deleteLocation: async (id) => {
    if (!hasValidCredentials) return
    try {
      const { error } = await supabase
        .from('item_locations')
        .delete()
        .eq('id', id)

      if (error) throw error

      const { locations } = get()
      set({ locations: locations.filter(loc => loc.id !== id) })
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  migrateLegacyLocations: async () => {
    if (!hasValidCredentials) return
    try {
      set({ loading: true, error: null })
      const { items, locations, addLocation, addToast } = get()
      
      // Find items that have legacy location but no entries in item_locations
      const itemIdsWithLocations = new Set(locations.map(l => l.item_id))
      const itemsToMigrate = items.filter(item => item.location && !itemIdsWithLocations.has(item.id))

      let count = 0
      for (const item of itemsToMigrate) {
        if (!item.location) continue

        // Add to item_locations
        await addLocation({
          item_id: item.id,
          label: 'Main',
          url: item.location,
          status: item.status,
          visited_at: item.visited_at
        })
        count++
      }
      
      if (count > 0) {
        addToast({
            title: 'Migration Complete',
            description: `Successfully migrated ${count} items to the new location structure.`,
            type: 'success'
        })
      } else {
        addToast({
            title: 'Migration Skipped',
            description: 'No items needed migration.',
            type: 'info'
        })
      }
      
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  syncData: async () => {
    if (!hasValidCredentials) return
    try {
      const { items, locations, updateLocation, addToast } = get()
      let count = 0
      
      for (const item of items) {
        const itemLocs = locations.filter(l => l.item_id === item.id)
        if (itemLocs.length === 1) {
          const loc = itemLocs[0]
          // If item says visited but location says not, sync it.
          if (item.status && !loc.status) {
            await updateLocation(loc.id, {
              status: true,
              visited_at: item.visited_at
            })
            count++
          }
        }
      }
      
      if (count > 0) {
        addToast({
          title: 'Data Synced',
          description: `Synced visit status for ${count} items.`,
          type: 'success'
        })
      }
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }
}))
