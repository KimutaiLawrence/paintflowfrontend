// This comment is added to force a Git commit.
"use client"

import { useQuery } from "@tanstack/react-query"
import { jobsApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { PlusCircle, Columns3, Eye, Settings } from "lucide-react"
import { columns, essentialColumns, mobileColumns } from "./columns"
import { DataTable } from "@/components/shared/data-table"
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function JobsPage() {
  const router = useRouter()
  const [showAllColumns, setShowAllColumns] = useState(false)
  const [columnVisibility, setColumnVisibility] = useState({
    serial_no: true,
    location: true,
    block_no: false,
    tc: false,
    unit_no: false,
    area: true,
    priority: true,
    status: true,
    report_date: false,
    inspection_date: false,
    repair_schedule: false,
    ultra_schedule: false,
    repair_completion: false,
    resident_number: false,
    created_at: false,
    title: false,
  })
  
  const { data: jobsResponse, isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => jobsApi.getJobs(),
  })

  const jobs = jobsResponse?.data || []
  
  // Create dynamic columns based on visibility settings
  const getVisibleColumns = () => {
    return columns.filter(column => {
      if (column.id === "select" || column.id === "actions") return true
      return columnVisibility[column.accessorKey as keyof typeof columnVisibility] ?? true
    })
  }
  
  const currentColumns = showAllColumns ? columns : getVisibleColumns()
  
  // Debug logging
  console.log("Jobs response:", jobsResponse)
  console.log("Jobs data:", jobs)
  if (jobs.length > 0) {
    console.log("First job fields:", Object.keys(jobs[0]))
    console.log("First job sample:", jobs[0])
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
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Columns ({currentColumns.length - 2})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Show Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(columnVisibility).map(([key, value]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={value}
                  onCheckedChange={(checked) => 
                    setColumnVisibility(prev => ({ ...prev, [key]: checked }))
                  }
                >
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showAllColumns}
                onCheckedChange={setShowAllColumns}
              >
                Show All Columns
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Presets</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={false}
                onCheckedChange={() => {
                  setColumnVisibility({
                    serial_no: true,
                    location: true,
                    block_no: true,
                    tc: true,
                    unit_no: true,
                    area: true,
                    priority: true,
                    status: true,
                    report_date: true,
                    inspection_date: true,
                    repair_schedule: false,
                    ultra_schedule: false,
                    repair_completion: false,
                    resident_number: false,
                    created_at: false,
                    title: false,
                  })
                  setShowAllColumns(false)
                }}
              >
                Detailed View
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={false}
                onCheckedChange={() => {
                  setColumnVisibility({
                    serial_no: true,
                    location: true,
                    block_no: false,
                    tc: false,
                    unit_no: false,
                    area: true,
                    priority: true,
                    status: true,
                    report_date: false,
                    inspection_date: false,
                    repair_schedule: false,
                    ultra_schedule: false,
                    repair_completion: false,
                    resident_number: false,
                    created_at: false,
                    title: false,
                  })
                  setShowAllColumns(false)
                }}
              >
                Essential View
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={false}
                onCheckedChange={() => {
                  setColumnVisibility({
                    serial_no: true,
                    location: true,
                    block_no: false,
                    tc: false,
                    unit_no: false,
                    area: true,
                    priority: true,
                    status: true,
                    report_date: false,
                    inspection_date: false,
                    repair_schedule: false,
                    ultra_schedule: false,
                    repair_completion: false,
                    resident_number: false,
                    created_at: false,
                    title: false,
                  })
                  setShowAllColumns(false)
                }}
              >
                Reset to Default
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => router.push("/jobs/create")} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <DataTableSkeleton columnCount={currentColumns.length} />
      ) : (
        <div className="w-full">
          <div className="rounded-md border bg-white shadow-sm">
            <div className="overflow-x-auto">
              {/* Desktop: Full Excel-like table */}
              <div className="hidden lg:block">
                <DataTable 
                  columns={currentColumns} 
                  data={jobs} 
                  filterColumn="location"
                  className={showAllColumns ? "min-w-[1800px] text-xs" : "min-w-[800px] text-xs"}
                />
              </div>
              
              {/* Mobile/Tablet: Simplified table */}
              <div className="block lg:hidden">
                <DataTable 
                  columns={mobileColumns} 
                  data={jobs} 
                  filterColumn="location"
                  className="min-w-[600px] text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
