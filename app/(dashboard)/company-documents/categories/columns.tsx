"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Tag
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Define the structure of a document category
export interface DocumentCategory {
  id: string
  company_id: string
  code: string
  name: string
  description?: string
  color?: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string
}

export const columns: ColumnDef<DocumentCategory>[] = [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => {
      const category = row.original
      return (
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: category.color || '#3B82F6' }}
          />
          <span className="font-medium">{category.code}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("name")}</div>
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description") as string
      return (
        <div className="max-w-[300px] truncate">
          {description || <span className="text-muted-foreground">No description</span>}
        </div>
      )
    },
  },
  {
    accessorKey: "created_by",
    header: "Created By",
    cell: ({ row }) => {
      return <div className="text-sm">{row.getValue("created_by")}</div>
    },
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return <div className="text-sm">{date.toLocaleDateString()}</div>
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row, table }) => {
      const category = row.original
      const meta = table.options.meta as any

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(category.id)}
            >
              Copy category ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => meta?.onEdit?.(category)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit category
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => meta?.onDelete?.(category.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete category
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export const essentialColumns: ColumnDef<DocumentCategory>[] = [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => {
      const category = row.original
      return (
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: category.color || '#3B82F6' }}
          />
          <span className="font-medium">{category.code}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("name")}</div>
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description") as string
      return (
        <div className="max-w-[200px] truncate">
          {description || <span className="text-muted-foreground">No description</span>}
        </div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row, table }) => {
      const category = row.original
      const meta = table.options.meta as any

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(category.id)}
            >
              Copy category ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => meta?.onEdit?.(category)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit category
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => meta?.onDelete?.(category.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete category
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
