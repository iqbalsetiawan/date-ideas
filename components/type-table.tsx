'use client'

import { Type } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface TypeTableProps {
  types: Type[]
  loading: boolean
}

export function TypeTable({ types, loading }: TypeTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (types.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-2">No types yet</div>
        <p className="text-sm text-muted-foreground">
          Create some types to organize your items
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {types.map((type) => (
            <TableRow key={type.id}>
              <TableCell className="font-medium">{type.name}</TableCell>
              <TableCell>
                <Badge variant={type.category === 'food' ? 'default' : 'secondary'}>
                  {type.category}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(type.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}