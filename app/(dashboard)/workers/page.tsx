"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { PlusCircle, Users } from "lucide-react"
import { ServerDataTable } from "@/components/shared/server-data-table"
import { columns, type Worker } from "./columns"
import { workersApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { normalizePaginatedResponse } from "@/lib/pagination"

export default function WorkersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { canManageUsers, canDelete } = useAuth()
  
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState("")
  const [deleteWorkerId, setDeleteWorkerId] = useState<string | null>(null)

  // Fetch workers with pagination
  const { data, isLoading } = useQuery({
    queryKey: ["workers", page, perPage, search],
    queryFn: async () => {
      const response = await workersApi.getWorkers({
        page,
        per_page: perPage,
        search,
      })
      return response
    },
  })

  const paginatedData = normalizePaginatedResponse(data || {})

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (workerId: string) => {
      await workersApi.deleteWorker(workerId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] })
      toast.success("Success", { description: "Worker deleted successfully" })
      setDeleteWorkerId(null)
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete worker"
      toast.error("Error", { description: errorMessage })
    },
  })

  const handleDelete = (workerId: string) => {
    setDeleteWorkerId(workerId)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workers</h1>
          <p className="text-muted-foreground">Manage your team members and their assignments</p>
        </div>
        {canManageUsers() && (
          <Button onClick={() => router.push("/workers/create")} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Worker
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
        onDelete={canDelete() ? handleDelete : undefined}
        filterPlaceholder="Search workers by name, email, or username..."
        isLoading={isLoading}
      />

      <ConfirmDialog
        isOpen={!!deleteWorkerId}
        onClose={() => setDeleteWorkerId(null)}
        onConfirm={() => deleteWorkerId && deleteMutation.mutate(deleteWorkerId)}
        title="Delete Worker"
        description="Are you sure you want to delete this worker? This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
