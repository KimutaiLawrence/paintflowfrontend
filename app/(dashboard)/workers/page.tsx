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

export default function WorkersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { canManageUsers, canDelete } = useAuth()
  
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState("")

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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (workerId: string) => {
      await workersApi.deleteWorker(workerId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] })
      toast.success("Success", { description: "Worker deleted successfully" })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete worker"
      toast.error("Error", { description: errorMessage })
    },
  })

  const handleDelete = async (workerId: string) => {
    if (confirm("Are you sure you want to deactivate this worker?")) {
      await deleteMutation.mutateAsync(workerId)
    }
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
        data={data?.data || []}
        total={data?.total || 0}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        onSearchChange={setSearch}
        filterPlaceholder="Search workers by name, email, or username..."
        isLoading={isLoading}
        meta={{
          onDelete: canDelete() ? handleDelete : undefined
        }}
      />
    </div>
  )
}
