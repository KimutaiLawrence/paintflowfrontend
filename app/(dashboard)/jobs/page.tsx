// This comment is added to force a Git commit.
"use client"

import { useQuery } from "@tanstack/react-query"
import { jobsApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { columns } from "./columns"
import { DataTable } from "@/components/shared/data-table"
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton"
import { useRouter } from "next/navigation"

export default function JobsPage() {
  const router = useRouter()
  const { data: jobsResponse, isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => jobsApi.getJobs(),
  })

  const jobs = jobsResponse?.data || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
          <p className="text-muted-foreground">
            Here's a list of all the jobs in your company.
          </p>
        </div>
        <Button onClick={() => router.push("/jobs/create")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Job
        </Button>
      </div>
      
      {isLoading ? (
        <DataTableSkeleton columnCount={columns.length} />
      ) : (
        <DataTable columns={columns} data={jobs} filterColumn="title" />
      )}
    </div>
  )
}
