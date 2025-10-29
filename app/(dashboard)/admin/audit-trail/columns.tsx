"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { AuditTrailEntry } from "@/lib/api"
import { format } from "date-fns"

// Helper function to get action color
const getActionColor = (action: string) => {
  switch (action.toLowerCase()) {
    case "create":
    case "create_job":
    case "create_user":
    case "create_role":
      return "bg-green-100 text-green-800 border-green-200"
    case "update":
    case "update_job":
    case "update_user":
    case "update_role":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "delete":
    case "delete_job":
    case "delete_user":
    case "delete_role":
      return "bg-red-100 text-red-800 border-red-200"
    case "login":
      return "bg-purple-100 text-purple-800 border-purple-200"
    case "logout":
      return "bg-gray-100 text-gray-800 border-gray-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

// Helper function to get resource type color
const getResourceTypeColor = (resourceType: string) => {
  switch (resourceType.toLowerCase()) {
    case "job":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "user":
      return "bg-green-50 text-green-700 border-green-200"
    case "role":
      return "bg-purple-50 text-purple-700 border-purple-200"
    case "audit":
      return "bg-orange-50 text-orange-700 border-orange-200"
    case "document":
      return "bg-yellow-50 text-yellow-700 border-yellow-200"
    default:
      return "bg-gray-50 text-gray-700 border-gray-200"
  }
}

// All columns
export const columns: ColumnDef<AuditTrailEntry>[] = [
  {
    accessorKey: "created_at",
    header: "Timestamp",
    cell: ({ row }) => {
      const timestamp = row.original.created_at
      if (!timestamp) return <div className="text-sm text-gray-400">-</div>
      return (
        <div className="text-sm text-gray-600 min-w-[140px]">
          <div className="font-medium">
            {format(new Date(timestamp), "MMM dd, yyyy")}
          </div>
          <div className="text-xs text-gray-500">
            {format(new Date(timestamp), "HH:mm:ss")}
          </div>
        </div>
      )
    },
    size: 140,
  },
  {
    accessorKey: "user_name",
    header: "User",
    cell: ({ row }) => {
      const userName = row.original.user_name
      const userEmail = row.original.user_email
      return (
        <div className="text-sm min-w-[120px]">
          <div className="font-medium text-gray-900">{userName || "Unknown"}</div>
          {userEmail && (
            <div className="text-xs text-gray-500 truncate">{userEmail}</div>
          )}
        </div>
      )
    },
    size: 120,
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => {
      const action = row.original.action
      const colorClass = getActionColor(action)
      return (
        <Badge variant="outline" className={`text-xs font-medium ${colorClass}`}>
          {action?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || "Unknown"}
        </Badge>
      )
    },
    size: 120,
  },
  {
    accessorKey: "resource_type",
    header: "Resource",
    cell: ({ row }) => {
      const resourceType = row.original.resource_type
      const colorClass = getResourceTypeColor(resourceType)
      return (
        <Badge variant="outline" className={`text-xs font-medium ${colorClass}`}>
          {resourceType?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || "Unknown"}
        </Badge>
      )
    },
    size: 100,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.original.description
      return (
        <div className="text-sm text-gray-700 min-w-[200px] max-w-[300px]">
          <div className="line-clamp-2">{description || "No description"}</div>
        </div>
      )
    },
    size: 200,
  },
  {
    accessorKey: "ip_address",
    header: "IP Address",
    cell: ({ row }) => {
      const ipAddress = row.original.ip_address
      return (
        <div className="text-sm text-gray-600 font-mono min-w-[120px]">
          {ipAddress || "Unknown"}
        </div>
      )
    },
    size: 120,
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => {
      const method = row.original.method
      const methodColors = {
        GET: "bg-blue-100 text-blue-800",
        POST: "bg-green-100 text-green-800",
        PUT: "bg-yellow-100 text-yellow-800",
        DELETE: "bg-red-100 text-red-800",
        PATCH: "bg-purple-100 text-purple-800"
      }
      const colorClass = methodColors[method as keyof typeof methodColors] || "bg-gray-100 text-gray-800"
      return (
        <Badge variant="outline" className={`text-xs font-bold ${colorClass}`}>
          {method || "Unknown"}
        </Badge>
      )
    },
    size: 80,
  },
  {
    accessorKey: "endpoint",
    header: "Endpoint",
    cell: ({ row }) => {
      const endpoint = row.original.endpoint
      return (
        <div className="text-sm text-gray-600 font-mono min-w-[150px] max-w-[200px]">
          <div className="truncate">{endpoint || "Unknown"}</div>
        </div>
      )
    },
    size: 150,
  },
  {
    accessorKey: "response_status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.response_status
      const statusColors = {
        200: "bg-green-100 text-green-800",
        201: "bg-green-100 text-green-800",
        204: "bg-green-100 text-green-800",
        400: "bg-yellow-100 text-yellow-800",
        401: "bg-red-100 text-red-800",
        403: "bg-red-100 text-red-800",
        404: "bg-gray-100 text-gray-800",
        500: "bg-red-100 text-red-800"
      }
      const colorClass = statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
      return (
        <Badge variant="outline" className={`text-xs font-bold ${colorClass}`}>
          {status || "Unknown"}
        </Badge>
      )
    },
    size: 80,
  }
]

// Essential columns (default view - most important fields)
export const essentialColumns: ColumnDef<AuditTrailEntry>[] = [
  {
    accessorKey: "created_at",
    header: "Timestamp",
    cell: ({ row }) => {
      const timestamp = row.original.created_at
      if (!timestamp) return <div className="text-sm text-gray-400">-</div>
      return (
        <div className="text-sm text-gray-600 min-w-[120px]">
          <div className="font-medium">
            {format(new Date(timestamp), "MMM dd, HH:mm")}
          </div>
        </div>
      )
    },
    size: 120,
  },
  {
    accessorKey: "user_name",
    header: "User",
    cell: ({ row }) => {
      const userName = row.original.user_name
      return (
        <div className="text-sm font-medium text-gray-900 min-w-[100px]">
          {userName || "Unknown"}
        </div>
      )
    },
    size: 100,
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => {
      const action = row.original.action
      const colorClass = getActionColor(action)
      return (
        <Badge variant="outline" className={`text-xs font-medium ${colorClass}`}>
          {action?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || "Unknown"}
        </Badge>
      )
    },
    size: 120,
  },
  {
    accessorKey: "resource_type",
    header: "Resource",
    cell: ({ row }) => {
      const resourceType = row.original.resource_type
      const colorClass = getResourceTypeColor(resourceType)
      return (
        <Badge variant="outline" className={`text-xs font-medium ${colorClass}`}>
          {resourceType?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || "Unknown"}
        </Badge>
      )
    },
    size: 100,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.original.description
      return (
        <div className="text-sm text-gray-700 min-w-[200px] max-w-[300px]">
          <div className="line-clamp-2">{description || "No description"}</div>
        </div>
      )
    },
    size: 200,
  },
  {
    accessorKey: "ip_address",
    header: "IP Address",
    cell: ({ row }) => {
      const ipAddress = row.original.ip_address
      return (
        <div className="text-sm text-gray-600 font-mono min-w-[100px]">
          {ipAddress || "Unknown"}
        </div>
      )
    },
    size: 100,
  }
]
