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

// Helper function to determine the overall status of a job
const getJobStatus = (job: JobDetail) => {
  if (!job.areas || job.areas.length === 0) {
    return "No Areas"
  }
  if (job.areas.every((area) => area.status === "repair_completed")) {
    return "Completed"
  }
  if (job.areas.some((area) => area.status !== "pending_survey")) {
    return "In Progress"
  }
  return "Pending"
}

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
  },
  {
    accessorKey: "job_number",
    header: "Job Number",
    cell: ({ row }) => <div>{row.getValue("job_number")}</div>,
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <Link href={`/jobs/${row.original.id}`} className="hover:underline">
          {row.getValue("title")}
        </Link>
      )
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string
      const variant =
        priority === "P1"
          ? "destructive"
          : priority === "P2"
          ? "secondary"
          : "outline"
      return <Badge variant={variant}>{priority}</Badge>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = getJobStatus(row.original)
      
      const statusStyles: { [key: string]: string } = {
        "Completed": "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
        "In Progress": "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
        "Pending": "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
        "No Areas": "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
      }

      return <Badge className={`${statusStyles[status] || statusStyles['No Areas']} transition-colors`}>{status}</Badge>
    },
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => <div>{row.getValue("address")}</div>,
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return <div>{date.toLocaleDateString()}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const job = row.original
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
              onClick={() => navigator.clipboard.writeText(job.id)}
            >
              Copy Job ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/jobs/${job.id}`}>View Job Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Edit Job</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
