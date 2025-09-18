"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Eye, Users, MapPin, Calendar } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import api from "@/lib/api"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Job {
  id: string
  job_number: string
  title: string
  description: string
  address: string
  priority: string
  priority_color: string
  management_company: string
  created_at: string
  updated_at: string
  areas: Array<{
    id: string
    name: string
    description: string
    status: string
    estimated_hours: string
    actual_hours: string
  }>
  assigned_workers: Array<{
    id: string
    full_name: string
    role: string
  }>
}

const STATUS_COLUMNS = [
  {
    id: "pending_survey",
    title: "Pending Survey",
    color: "bg-gray-50 border-gray-200",
    badgeColor: "bg-gray-100 text-gray-800",
    description: "Awaiting initial site survey",
  },
  {
    id: "pending_primer",
    title: "Pending Primer",
    color: "bg-yellow-50 border-yellow-200",
    badgeColor: "bg-yellow-100 text-yellow-800",
    description: "Ready for primer application",
  },
  {
    id: "pending_patch",
    title: "Pending Patch",
    color: "bg-orange-50 border-orange-200",
    badgeColor: "bg-orange-100 text-orange-800",
    description: "Patch work required",
  },
  {
    id: "painting",
    title: "Painting",
    color: "bg-blue-50 border-blue-200",
    badgeColor: "bg-blue-100 text-blue-800",
    description: "Painting in progress",
  },
  {
    id: "done",
    title: "Completed",
    color: "bg-green-50 border-green-200",
    badgeColor: "bg-green-100 text-green-800",
    description: "Job completed successfully",
  },
]

function JobCard({ job, onStatusUpdate }: { job: Job; onStatusUpdate: (jobId: string, newStatus: string) => void }) {
  const getPriorityColor = (priority: string, priorityColor?: string) => {
    if (priorityColor) {
      return `border-l-[${priorityColor}] bg-opacity-10`
    }
    switch (priority) {
      case "P1":
        return "border-l-red-500 bg-red-50"
      case "P2":
        return "border-l-orange-500 bg-orange-50"
      case "P3":
        return "border-l-green-500 bg-green-50"
      default:
        return "border-l-gray-500 bg-gray-50"
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "P1":
        return "bg-red-100 text-red-800 border-red-200"
      case "P2":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "P3":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card
      className={cn(
        "mb-3 border-l-4 hover:shadow-md transition-all cursor-pointer",
        getPriorityColor(job.priority, job.priority_color),
      )}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-mono">{job.job_number}</p>
              <h4 className="font-semibold text-sm leading-tight">{job.title}</h4>
            </div>
            <Badge className={cn("text-xs px-2 py-1", getPriorityBadge(job.priority))}>{job.priority}</Badge>
          </div>

          <div className="flex items-start space-x-1">
            <MapPin className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600 leading-tight">{job.address}</p>
          </div>

          {job.management_company && (
            <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{job.management_company}</p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              {job.areas && job.areas.length > 0 && (
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>{job.areas.length} areas</span>
                </span>
              )}
              {job.assigned_workers && job.assigned_workers.length > 0 && (
                <span className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{job.assigned_workers.length}</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(job.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <Link href={`/jobs/${job.id}`}>
            <Button variant="outline" size="sm" className="w-full text-xs bg-transparent">
              <Eye className="mr-1 h-3 w-3" />
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusColumn({
  column,
  jobs,
  onStatusUpdate,
}: {
  column: (typeof STATUS_COLUMNS)[0]
  jobs: Job[]
  onStatusUpdate: (jobId: string, newStatus: string) => void
}) {
  return (
    <div className={cn("rounded-lg border-2 border-dashed p-4 min-h-[600px]", column.color)}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <Badge className={cn("text-xs", column.badgeColor)}>{jobs.length}</Badge>
        </div>
        <p className="text-xs text-gray-600">{column.description}</p>
      </div>

      <div className="space-y-2">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onStatusUpdate={onStatusUpdate} />
        ))}

        {jobs.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
              <div className="w-6 h-6 bg-gray-300 rounded"></div>
            </div>
            <p className="text-xs">No jobs in this stage</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to determine the overall status of a job based on its areas
const getJobStatus = (job: Job) => {
  if (!job.areas || job.areas.length === 0) {
    return "No Areas"
  }
  if (job.areas.every((area) => area.status === "done")) {
    return "Completed"
  }
  if (job.areas.some((area) => area.status !== "pending_survey" && area.status !== "done")) {
    return "In Progress"
  }
  return "Pending"
}

export default function JobsPage() {
  const { canManageJobs } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"kanban" | "table">("table")
  const queryClient = useQueryClient()

  const { data: jobsResponse, isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const response = await api.get("/jobs/")
      return response.data
    },
  })

  const jobs = jobsResponse?.data || []

  const updateJobStatus = useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: string }) => {
      const response = await api.patch(`/jobs/${jobId}/`, { status })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
  })

  const handleStatusUpdate = (jobId: string, newStatus: string) => {
    updateJobStatus.mutate({ jobId, status: newStatus })
  }

  const filteredJobs =
    jobs?.filter((job: Job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.management_company && job.management_company.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesPriority = priorityFilter === "all" || job.priority === priorityFilter

      return matchesSearch && matchesPriority
    }) || []

  const jobsByStatus = STATUS_COLUMNS.reduce(
    (acc, column) => {
      acc[column.id] = filteredJobs.filter((job: Job) => {
        if (job.areas && job.areas.length > 0) {
          return job.areas.some((area) => area.status === column.id)
        }
        return false
      })
      return acc
    },
    {} as Record<string, Job[]>,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Jobs Management</h1>
          <p className="text-muted-foreground">Visual workflow for painting operations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={viewMode} onValueChange={(value: "kanban" | "table") => setViewMode(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kanban">Kanban</SelectItem>
              <SelectItem value="table">Table</SelectItem>
            </SelectContent>
          </Select>
          {canManageJobs() && (
            <Link href="/jobs/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Job
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by title, address, or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="P1">P1 (High)</SelectItem>
                <SelectItem value="P2">P2 (Medium)</SelectItem>
                <SelectItem value="P3">P3 (Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {viewMode === "kanban" ? (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-5 gap-4 min-w-[1200px] pb-4">
            {STATUS_COLUMNS.map((column) => (
              <StatusColumn
                key={column.id}
                column={column}
                jobs={jobsByStatus[column.id] || []}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Number</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="text-center">
                      <div className="h-8 bg-muted animate-pulse rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredJobs.length > 0 ? (
                filteredJobs.map((job: Job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono">{job.job_number}</TableCell>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.address}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{getJobStatus(job)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No jobs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
