"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { JobDetail } from "@/lib/api"
import Link from "next/link"

// Helper function to format dates like Excel (DD-MMM-YY)
const formatExcelDate = (dateString: string | null) => {
  if (!dateString) return ""
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: '2-digit' 
  })
}

// Helper function to get status color coding like Excel
const getStatusColor = (status: string | null) => {
  if (!status) return "bg-gray-100 text-gray-800"
  
  switch (status.toLowerCase()) {
    case "done":
    case "repair_completed":
      return "bg-green-200 text-green-900 border-green-300 font-bold"
    case "pending_survey":
    case "pending_repair":
      return "bg-yellow-200 text-yellow-900 border-yellow-300 font-bold"
    case "left_primer":
    case "left_ultra":
    case "left_top_coat_cover_slab":
      return "bg-orange-200 text-orange-900 border-orange-300 font-bold"
    default:
      return "bg-gray-200 text-gray-900 border-gray-300"
  }
}

// Mobile-responsive columns (show only essential fields on small screens)
export const mobileColumns: ColumnDef<JobDetail>[] = [
  {
    accessorKey: "serial_no",
    header: "No.",
    cell: ({ row }) => (
      <div className="font-bold text-sm bg-gray-50 px-2 py-1 rounded text-center">
        {row.original.serial_no || row.original.job_number}
      </div>
    ),
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => (
      <div className="text-sm font-medium">
        {row.original.location || row.original.address}
      </div>
    ),
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.original.priority
      const priorityStyles = {
        P1: "bg-red-100 text-red-800 border-red-200 font-bold",
        P2: "bg-orange-100 text-orange-800 border-orange-200 font-bold", 
        P3: "bg-yellow-100 text-yellow-800 border-yellow-200 font-bold"
      }
      return (
        <div className={`text-xs px-2 py-1 rounded border ${priorityStyles[priority as keyof typeof priorityStyles] || "bg-gray-100 text-gray-800"}`}>
          {priority}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      const colorClass = getStatusColor(status)
      return (
        <div className={`text-xs px-2 py-1 rounded font-medium ${colorClass}`}>
          {status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || "Pending"}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const job = row.original
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
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(job.id)}
            >
              Copy Job ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/jobs/${job.id}`}>View Job Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/jobs/${job.id}/edit`}>Edit Job</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

// Essential columns (default view - most important fields)
export const essentialColumns: ColumnDef<JobDetail>[] = [
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
    accessorKey: "serial_no",
    header: "No.",
    cell: ({ row }) => (
      <div className="font-bold text-sm min-w-[60px] text-center bg-gray-50 px-2 py-1 rounded">
        {row.original.serial_no || row.original.job_number}
      </div>
    ),
    size: 80,
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => (
      <div className="text-sm min-w-[100px] font-medium">
        {row.original.location || row.original.address}
      </div>
    ),
    size: 120,
  },
  {
    accessorKey: "area",
    header: "Work Area",
    cell: ({ row }) => (
      <div className="text-sm min-w-[120px] font-medium text-gray-700">
        {row.original.area || row.original.title}
      </div>
    ),
    size: 130,
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.original.priority
      const priorityStyles = {
        P1: "bg-red-100 text-red-800 border-red-200 font-bold",
        P2: "bg-orange-100 text-orange-800 border-orange-200 font-bold", 
        P3: "bg-yellow-100 text-yellow-800 border-yellow-200 font-bold"
      }
      return (
        <div className={`text-xs px-2 py-1 rounded border ${priorityStyles[priority as keyof typeof priorityStyles] || "bg-gray-100 text-gray-800"}`}>
          {priority}
        </div>
      )
    },
    size: 80,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      const colorClass = getStatusColor(status)
      return (
        <div className={`text-xs px-2 py-1 rounded font-medium ${colorClass}`}>
          {status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || "Pending"}
        </div>
      )
    },
    size: 140,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const job = row.original
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
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(job.id)}
            >
              Copy Job ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/jobs/${job.id}`}>View Job Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/jobs/${job.id}/edit`}>Edit Job</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
]

// Full desktop columns (Excel-like with all fields)
export const columns: ColumnDef<JobDetail>[] = [
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
    accessorKey: "serial_no",
    header: "No.",
    cell: ({ row }) => (
      <div className="font-bold text-sm min-w-[60px] text-center bg-gray-50 px-2 py-1 rounded">
        {row.original.serial_no || row.original.job_number}
      </div>
    ),
    size: 80,
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => (
      <div className="text-sm min-w-[100px] font-medium">
        {row.original.location || row.original.address}
      </div>
    ),
    size: 120,
  },
  {
    accessorKey: "block_no",
    header: "Block",
    cell: ({ row }) => (
      <div className="text-sm min-w-[60px] text-center font-medium">
        {row.original.block_no || "-"}
      </div>
    ),
    size: 80,
  },
  {
    accessorKey: "tc",
    header: "TC",
    cell: ({ row }) => (
      <div className="font-bold text-sm min-w-[70px] text-center bg-blue-50 text-blue-700 px-2 py-1 rounded">
        {row.original.tc || "-"}
      </div>
    ),
    size: 80,
  },
  {
    accessorKey: "unit_no",
    header: "Unit",
    cell: ({ row }) => (
      <div className="text-sm min-w-[80px] font-mono">
        {row.original.unit_no || "-"}
      </div>
    ),
    size: 90,
  },
  {
    accessorKey: "area",
    header: "Area",
    cell: ({ row }) => (
      <div className="text-sm min-w-[120px] font-medium text-gray-700">
        {row.original.area || row.original.title}
      </div>
    ),
    size: 130,
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.original.priority
      const priorityStyles = {
        P1: "bg-red-100 text-red-800 border-red-200 font-bold",
        P2: "bg-orange-100 text-orange-800 border-orange-200 font-bold", 
        P3: "bg-yellow-100 text-yellow-800 border-yellow-200 font-bold"
      }
      return (
        <div className={`text-xs px-2 py-1 rounded border ${priorityStyles[priority as keyof typeof priorityStyles] || "bg-gray-100 text-gray-800"}`}>
          {priority}
        </div>
      )
    },
    size: 80,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      const colorClass = getStatusColor(status)
      return (
        <div className={`text-xs px-2 py-1 rounded font-medium ${colorClass}`}>
          {status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || "Pending"}
        </div>
      )
    },
    size: 140,
  },
  {
    accessorKey: "report_date",
    header: "Report Date",
    cell: ({ row }) => {
      const date = row.original.report_date
      return (
        <div className="text-sm min-w-[90px] font-mono text-gray-600">
          {formatExcelDate(date)}
        </div>
      )
    },
    size: 110,
  },
  {
    accessorKey: "inspection_date",
    header: "Inspection",
    cell: ({ row }) => {
      const date = row.original.inspection_date
      return (
        <div className="text-sm min-w-[90px] font-mono text-gray-600">
          {formatExcelDate(date)}
        </div>
      )
    },
    size: 110,
  },
  {
    accessorKey: "repair_schedule",
    header: "Repair Schedule",
    cell: ({ row }) => {
      const date = row.original.repair_schedule
      return (
        <div className="text-sm min-w-[90px] font-mono text-gray-600">
          {formatExcelDate(date)}
        </div>
      )
    },
    size: 120,
  },
  {
    accessorKey: "ultra_schedule",
    header: "Ultra Schedule",
    cell: ({ row }) => {
      const date = row.original.ultra_schedule
      return (
        <div className="text-sm min-w-[90px] font-mono text-gray-600">
          {formatExcelDate(date)}
        </div>
      )
    },
    size: 120,
  },
  {
    accessorKey: "repair_completion",
    header: "Completion",
    cell: ({ row }) => {
      const date = row.original.repair_completion
      return (
        <div className="text-sm min-w-[90px] font-mono text-gray-600">
          {formatExcelDate(date)}
        </div>
      )
    },
    size: 110,
  },
  {
    accessorKey: "resident_number",
    header: "Resident",
    cell: ({ row }) => (
      <div className="text-sm min-w-[100px] font-mono text-gray-600">
        {row.original.resident_number || "-"}
      </div>
    ),
    size: 120,
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => {
      const date = row.original.created_at
      return (
        <div className="text-sm min-w-[90px] font-mono text-gray-600">
          {formatExcelDate(date)}
        </div>
      )
    },
    size: 110,
  },
  {
    accessorKey: "title",
    header: "Job Title",
    cell: ({ row }) => (
      <div className="text-sm min-w-[150px] font-medium text-gray-700">
        {row.original.title}
      </div>
    ),
    size: 160,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const job = row.original
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
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(job.id)}
            >
              Copy Job ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/jobs/${job.id}`}>View Job Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/jobs/${job.id}/edit`}>Edit Job</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    size: 80,
  },
]
