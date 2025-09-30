"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Mail, Phone, Briefcase } from "lucide-react"
import Link from "next/link"

export interface Worker {
  id: string
  username: string
  full_name: string
  email: string
  phone?: string
  role: string
  is_active: boolean
  active_jobs_count: number
  created_at: string
}

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "admin":
      return "bg-red-100 text-red-800 border-red-200"
    case "supervisor":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "worker":
      return "bg-green-100 text-green-800 border-green-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export const columns: ColumnDef<Worker>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    accessorKey: "full_name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-sm">{row.original.full_name}</span>
        <span className="text-xs text-gray-500">@{row.original.username}</span>
      </div>
    ),
    size: 200,
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.original.role
      return (
        <Badge className={getRoleBadgeColor(role)}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Badge>
      )
    },
    size: 120,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="flex items-center text-sm text-gray-600">
        <Mail className="h-4 w-4 mr-2 text-gray-400" />
        {row.original.email}
      </div>
    ),
    size: 250,
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <div className="flex items-center text-sm text-gray-600">
        <Phone className="h-4 w-4 mr-2 text-gray-400" />
        {row.original.phone || "-"}
      </div>
    ),
    size: 150,
  },
  {
    accessorKey: "active_jobs_count",
    header: "Active Jobs",
    cell: ({ row }) => (
      <div className="flex items-center text-sm">
        <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
        <span className="font-medium">{row.original.active_jobs_count}</span>
      </div>
    ),
    size: 120,
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={row.original.is_active ? "default" : "secondary"}
        className={
          row.original.is_active
            ? "bg-green-100 text-green-800 border-green-200"
            : "bg-gray-100 text-gray-800 border-gray-200"
        }
      >
        {row.original.is_active ? "Active" : "Inactive"}
      </Badge>
    ),
    size: 100,
  },
  {
    accessorKey: "created_at",
    header: "Joined",
    cell: ({ row }) => {
      const date = new Date(row.original.created_at)
      return (
        <span className="text-sm text-gray-600">
          {date.toLocaleDateString()}
        </span>
      )
    },
    size: 120,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => {
      const worker = row.original
      const meta = table.options.meta as any

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/workers/${worker.id}`}>View Worker</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/workers/${worker.id}/edit`}>Edit Worker</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => meta?.onDelete?.(worker.id)}
            >
              Delete Worker
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableHiding: false,
    size: 80,
  },
]
