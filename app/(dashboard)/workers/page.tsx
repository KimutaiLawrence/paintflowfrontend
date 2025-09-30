"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { PlusCircle, Users } from "lucide-react"
import { ServerDataTable } from "@/components/shared/server-data-table"
import { columns, type Worker } from "./columns"
import api from "@/lib/api"
import { normalizePaginatedResponse } from "@/lib/pagination"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import type { PaginationParams } from "@/lib/pagination"

export default function WorkersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuth()

  // Fetcher function for server pagination
  const fetchWorkers = async (params: PaginationParams) => {
    const response = await api.get("/workers/", { params })
    return normalizePaginatedResponse<Worker>(response.data)
  }

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (workerId: string) => {
      await api.delete(`/workers/${workerId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] })
      toast({
        title: "Worker deleted",
        description: "The worker has been successfully deactivated.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete worker",
        variant: "destructive",
      })
    },
  })

  const handleDelete = async (workerId: string) => {
    if (confirm("Are you sure you want to deactivate this worker?")) {
      await deleteMutation.mutateAsync(workerId)
    }
  }

  const canManageWorkers = user?.role === "admin" || user?.role === "supervisor"

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workers</h1>
          <p className="text-muted-foreground">Manage your team members and their assignments</p>
        </div>
        {canManageWorkers && (
          <Button onClick={() => router.push("/workers/create")} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Worker
          </Button>
        )}
      </div>

      <ServerDataTable
        columns={columns}
        queryKey={["workers"]}
        fetcher={fetchWorkers}
        onDelete={handleDelete}
        searchPlaceholder="Search workers by name, email, or username..."
        emptyState={{
          icon: <Users className="h-12 w-12 text-muted-foreground" />,
          title: "No workers found",
          description: "Get started by adding your first worker.",
        }}
      />
    </div>
  )
}
