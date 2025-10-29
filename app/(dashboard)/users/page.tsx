"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usersApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { columns } from "./columns"
import { ServerDataTable } from "@/components/shared/server-data-table"
import { CreateUserModal } from "@/components/modals/create-user-modal"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useToast } from "@/hooks/use-toast"
import { normalizePaginatedResponse } from "@/lib/pagination"

export default function UserManagementPage() {
  const { canManageUsers, isClient } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState("")

  // Allow both managers and clients to view users
  const canViewUsers = canManageUsers() || isClient()

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users", page, perPage, search],
    queryFn: () => usersApi.getUsers({ page, per_page: perPage, search }),
    enabled: canViewUsers,
  })

  const paginatedData = normalizePaginatedResponse(usersData || {})

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => usersApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("User deleted successfully.")
      setDeleteUserId(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete user.")
    },
  })

  const handleDelete = (userId: string) => {
    setDeleteUserId(userId)
  }

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

      <ServerDataTable
        columns={columns}
        data={paginatedData.data}
        total={paginatedData.total}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        onDelete={canManageUsers() ? handleDelete : undefined}
        filterPlaceholder="Search by name, username, or email..."
        isLoading={isLoading}
      />

      <CreateUserModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />

      <ConfirmDialog
        isOpen={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={() => deleteUserId && deleteMutation.mutate(deleteUserId)}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
