import { create } from 'zustand'
import { supabase, Item, Type, ItemInsert, TypeInsert, hasValidCredentials } from './supabase'

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
  loading: boolean
  error: string | null
  toasts: Toast[]
  
  // Items actions
  fetchItems: () => Promise<void>
  addItem: (item: ItemInsert) => Promise<void>
  updateItem: (id: number, item: Partial<Item>) => Promise<void>
  deleteItem: (id: number) => Promise<void>
  
  // Types actions
  fetchTypes: () => Promise<void>
  addType: (type: TypeInsert) => Promise<void>
  updateType: (id: number, type: Partial<Type>) => Promise<void>
  deleteType: (id: number) => Promise<void>
  
  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  
  // Utility actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useStore = create<Store>((set, get) => ({
  items: [],
  types: [],
  loading: true,
  error: null,
  toasts: [],
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9)
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
        .order('created_at', { ascending: false })
      
      if (error) throw error
      set({ items: data || [] })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },
  
  addItem: async (item) => {
    if (!hasValidCredentials) {
      set({ error: 'Please configure your Supabase credentials to add items' })
      return
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
      set({ items: [data, ...items] })
      addToast({
        title: 'Success!',
        description: `${data.nama} has been added successfully.`,
        type: 'success'
      })
    } catch (error) {
      const { addToast } = get()
      set({ error: (error as Error).message })
      addToast({
        title: 'Error',
        description: 'Failed to add item. Please try again.',
        type: 'error'
      })
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
      
      const { items, addToast } = get()
      set({ 
        items: items.map(item => item.id === id ? { ...item, ...data } : item)
      })
      addToast({
        title: 'Updated!',
        description: `${data.nama} has been updated successfully.`,
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
        description: `${itemToDelete?.nama || 'Item'} has been deleted successfully.`,
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
  }
}))