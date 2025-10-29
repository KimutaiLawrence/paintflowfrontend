"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { jobsApi, type JobDetail } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { PageLoader } from "@/components/ui/custom-loader"
import { columns, essentialColumns } from "./columns"
import { ServerDataTable } from "@/components/shared/server-data-table"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { normalizePaginatedResponse } from "@/lib/pagination"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"

export default function JobsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showAllColumns, setShowAllColumns] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", page, perPage, search],
    queryFn: () => jobsApi.getJobs({ page, per_page: perPage, search }),
  })

  const paginatedData = normalizePaginatedResponse(data || {})

  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobsApi.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      // Refresh notifications after job deletion
      if ((window as any).refreshNotifications) {
        (window as any).refreshNotifications()
      }
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
    <div className="w-full space-y-4 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Jobs</h2>
          <p className="text-muted-foreground">
            Manage and track all painting jobs with comprehensive details.
          </p>
        </div>
        {user?.role !== "worker" && (
          <Button onClick={() => router.push("/jobs/create")} className="flex items-center gap-2 w-full sm:w-auto">
            <PlusCircle className="h-4 w-4" />
            Create Job
          </Button>
        )}
      </div>

      <ServerDataTable<JobDetail, any>
        columns={showAllColumns ? columns : essentialColumns}
        data={paginatedData.data as JobDetail[]}
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
              {showAllColumns ? "Compact View" : "Show All Columns"}
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
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Job"
        description="Are you sure you want to delete this job? This action cannot be undone and will also delete all associated job areas and documents."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
