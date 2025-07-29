'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { Item, Type } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { MapPin, ExternalLink } from 'lucide-react'

interface ItemFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: 'food' | 'place'
  types: Type[]
  item?: Item
}

export function ItemForm({ open, onOpenChange, category, types, item }: ItemFormProps) {
  const { addItem, updateItem, loading } = useStore()
  const [formData, setFormData] = useState({
    nama: '',
    type_id: '',
    lokasi: '',
    link: '',
    status: false
  })

  useEffect(() => {
    if (item) {
      setFormData({
        nama: item.nama,
        type_id: item.type_id.toString(),
        lokasi: item.lokasi,
        link: item.link || '',
        status: item.status
      })
    } else {
      setFormData({
        nama: '',
        type_id: '',
        lokasi: '',
        link: '',
        status: false
      })
    }
  }, [item, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nama || !formData.type_id || !formData.lokasi) {
      return
    }

    try {
      if (item) {
        await updateItem(item.id, {
          nama: formData.nama,
          type_id: parseInt(formData.type_id),
          lokasi: formData.lokasi,
          link: formData.link || null,
          status: formData.status
        })
      } else {
        await addItem({
          nama: formData.nama,
          type_id: parseInt(formData.type_id),
          lokasi: formData.lokasi,
          link: formData.link || null,
          status: formData.status,
          category
        })
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving item:', error)
    }
  }

  const openGoogleMaps = () => {
    if (formData.lokasi) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.lokasi)}`
      window.open(url, '_blank')
    }
  }

  const openLink = () => {
    if (formData.link) {
      window.open(formData.link, '_blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Edit' : 'Add New'} {category === 'food' ? 'Food' : 'Place'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Name</Label>
            <Input
              id="nama"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder={`Enter ${category} name`}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type_id}
              onValueChange={(value) => setFormData({ ...formData, type_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lokasi">Location</Label>
            <div className="flex gap-2">
              <Input
                id="lokasi"
                value={formData.lokasi}
                onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                placeholder="Enter location"
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={openGoogleMaps}
                disabled={!formData.lokasi}
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Link (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="TikTok, Instagram, or review link"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={openLink}
                disabled={!formData.link}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="status"
              checked={formData.status}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, status: checked as boolean })
              }
            />
            <Label htmlFor="status">Already visited</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : item ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}