"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usersApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { columns } from "./columns"
import { DataTable } from "@/components/shared/data-table"
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function UserManagementPage() {
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.getUsers,
    enabled: user?.role === "admin",
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => usersApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("User deleted successfully.")
    },
    onError: () => {
      toast.error("Failed to delete user.")
    },
  })

  const users = usersData || []

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Access Denied. You must be an administrator to view this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Create, update, and manage user accounts.
          </p>
        </div>
        <Button onClick={() => router.push('/users/create')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      {isLoading ? (
        <DataTableSkeleton columnCount={columns.length} />
      ) : (
        <DataTable
          columns={columns}
          data={users}
          filterColumn="full_name"
          // Pass the delete function to the table
          // This requires modifying the DataTable and columns to handle actions
          // For now, we'll keep it simple and add it later if needed.
        />
      )}
    </div>
  )
}
