"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { jobsApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { columns, essentialColumns } from "./columns"
import { ServerDataTable } from "@/components/shared/server-data-table"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { normalizePaginatedResponse } from "@/lib/pagination"
import { toast } from "sonner"

export default function JobsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showAllColumns, setShowAllColumns] = useState(true)

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", page, perPage, search],
    queryFn: () => jobsApi.getJobs({ page, per_page: perPage, search }),
  })

  const paginatedData = normalizePaginatedResponse(data || {})

  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobsApi.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      toast.success("Job deleted successfully")
      setDeleteId(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete job")
    },
  })

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
          <p className="text-muted-foreground">
            Manage and track all painting jobs with comprehensive details.
          </p>
        </div>
        <Button onClick={() => router.push("/jobs/create")} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Job
        </Button>
      </div>

      <ServerDataTable
        columns={showAllColumns ? columns : essentialColumns}
        data={paginatedData.data}
        total={paginatedData.total}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1) // Reset to first page on search
        }}
        onDelete={handleDelete}
        filterPlaceholder="Search by job number, location, or address..."
        isLoading={isLoading}
        toolbarContent={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAllColumns(!showAllColumns)}
            >
              {showAllColumns ? "Compact View" : "Full View"}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push("/jobs/create")}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </div>
        }
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Job"
        description="Are you sure you want to delete this job? This action cannot be undone and will also delete all associated job areas and documents."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
