"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { jobsApi, areasApi, workersApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Trash, UserPlus, UserMinus, ArrowLeft } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
// Assume modals for editing area and assigning workers are created
// import { EditAreaModal } from "@/components/modals/edit-area-modal"
// import { AssignWorkerModal } from "@/components/modals/assign-worker-modal"
import { FloorPlan, DailySubmission } from '@/lib/types'; // Assuming types are defined
import { FloorPlanManager } from '@/components/jobs/floor-plan-manager';
import { DailySubmissionsViewer } from '@/components/jobs/daily-submissions-viewer';

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // State for modals and dialogs
  const [isDeleteAreaOpen, setDeleteAreaOpen] = useState(false)
  const [isUnassignWorkerOpen, setUnassignWorkerOpen] = useState(false)
  const [selectedArea, setSelectedArea] = useState(null)
  const [selectedAssignment, setSelectedAssignment] = useState(null)

  const { data: job, isLoading, isError } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => jobsApi.getJob(jobId),
    enabled: !!jobId,
  })

  // Mutations
  const deleteAreaMutation = useMutation({
    mutationFn: (areaId: string) => areasApi.deleteArea(areaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", jobId] })
      setDeleteAreaOpen(false)
    },
  })

  const unassignWorkerMutation = useMutation({
    mutationFn: (assignmentId: string) => workersApi.unassignWorker(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", jobId] })
      setUnassignWorkerOpen(false)
    },
  })

  // Handlers
  const openDeleteAreaDialog = (area) => {
    setSelectedArea(area)
    setDeleteAreaOpen(true)
  }
  
  const openUnassignWorkerDialog = (assignment) => {
    setSelectedAssignment(assignment)
    setUnassignWorkerOpen(true)
  }

  const canManage = user?.role && ['admin', 'manager', 'supervisor'].includes(user.role)

  if (isLoading) return <div className="p-4">Loading job details...</div>
  if (isError || !job) return <div className="p-4">Job not found.</div>

  return (
    <>
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>{job.title}</CardTitle>
            <CardDescription>{job.job_number} - {job.address}</CardDescription>
          </CardHeader>
          <CardContent>
             <p>Priority: <Badge>{job.priority}</Badge></p>
             <p className="mt-2">{job.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {job.areas?.map((area) => (
                <Card key={area.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{area.name}</p>
                      <Badge>{area.status}</Badge>
                    </div>
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem> {/* Add onClick for Edit Modal */}
                            <Edit className="mr-2 h-4 w-4" /> Edit Area
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteAreaDialog(area)} className="text-red-600">
                            <Trash className="mr-2 h-4 w-4" /> Delete Area
                          </DropdownMenuItem>
                          <DropdownMenuItem> {/* Add onClick for Assign Modal */}
                            <UserPlus className="mr-2 h-4 w-4" /> Assign Worker
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Assigned Workers</CardTitle></CardHeader>
          <CardContent>
            {job.assigned_workers?.map((worker) => (
              <div key={worker.id} className="flex justify-between items-center p-2">
                <p>{worker.full_name} ({worker.role})</p>
                {canManage && (
                  <Button variant="ghost" size="sm" onClick={() => openUnassignWorkerDialog(worker.assignment_id)}> {/* Assuming assignment_id is available */}
                    <UserMinus className="mr-2 h-4 w-4" /> Un-assign
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={isDeleteAreaOpen}
        onClose={() => setDeleteAreaOpen(false)}
        onConfirm={() => deleteAreaMutation.mutate(selectedArea.id)}
        title="Delete Job Area"
        description={`Are you sure you want to delete the area "${selectedArea?.name}"? This cannot be undone.`}
      />
      
      <ConfirmDialog
        isOpen={isUnassignWorkerOpen}
        onClose={() => setUnassignWorkerOpen(false)}
        onConfirm={() => unassignWorkerMutation.mutate(selectedAssignment)}
        title="Un-assign Worker"
        description="Are you sure you want to un-assign this worker from the job area?"
      />
    </>
  )
}
