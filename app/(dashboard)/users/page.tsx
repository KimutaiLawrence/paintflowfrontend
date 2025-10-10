"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usersApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { columns } from "./columns"
import { DataTable } from "@/components/shared/data-table"
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton"
import { CreateUserModal } from "@/components/modals/create-user-modal"
import { useToast } from "@/hooks/use-toast"

export default function UserManagementPage() {
  const { canManageUsers, isClient } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Allow both managers and clients to view users
  const canViewUsers = canManageUsers() || isClient()

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.getUsers,
    enabled: canViewUsers,
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => usersApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("User deleted successfully.")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete user.")
    },
  })

  const users = usersData || []

  if (!canViewUsers) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Access Denied. You do not have permission to view users.</p>
      </div>
    )
  }

  // Different titles for different roles
  const pageTitle = isClient() ? "My Team" : "User Management"
  const pageDescription = isClient() 
    ? "View and manage your team members."
    : "Create, update, and manage user accounts."

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{pageTitle}</h2>
          <p className="text-muted-foreground">
            {pageDescription}
          </p>
        </div>
        {canManageUsers() && (
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create User
          </Button>
        )}
      </div>

      {isLoading ? (
        <DataTableSkeleton columnCount={columns.length} />
      ) : (
        <DataTable
          columns={columns}
          data={users}
          filterColumn="full_name"
          meta={{
            onDelete: canManageUsers() ? (userId: string) => {
              if (confirm("Are you sure you want to delete this user?")) {
                deleteMutation.mutate(userId)
              }
            } : undefined
          }}
        />
      )}

      <CreateUserModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  )
}
