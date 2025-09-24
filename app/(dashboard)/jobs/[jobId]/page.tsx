"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { jobsApi, JobDetail } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, ArrowLeft, Edit, Trash2, Briefcase, MapPin, Flag, Calendar, ListChecks } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

const priorityStyles: { [key: string]: string } = {
  P1: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
  P2: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
  P3: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [isConfirmOpen, setConfirmOpen] = useState(false)

  const { data: job, isLoading, error } = useQuery<JobDetail>({
    queryKey: ["job", jobId],
    queryFn: () => jobsApi.getJob(jobId),
    enabled: !!jobId,
  })

  const deleteMutation = useMutation({
    mutationFn: () => jobsApi.deleteJob(jobId),
    onSuccess: () => {
      toast.success("Job deleted successfully.")
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      router.push("/jobs")
    },
    onError: (error) => {
      toast.error("Failed to delete job.", error.message)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">Job Not Found</h1>
        <p className="text-muted-foreground">The job you are looking for does not exist.</p>
        <Link href="/jobs">
          <Button className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete the job and all its data."
        isLoading={deleteMutation.isPending}
      />
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/jobs">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{job?.title}</h1>
              <p className="text-muted-foreground">Job #{job?.job_number}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/jobs/${jobId}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        <Separator />

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-3 mt-1 flex-shrink-0 text-muted-foreground" />
                  <span>{job?.address}</span>
                </div>
                <div className="flex items-center">
                  <Flag className="h-4 w-4 mr-3 flex-shrink-0 text-muted-foreground" />
                  <Badge className={priorityStyles[job?.priority || "P3"]}>{job?.priority}</Badge>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-3 flex-shrink-0 text-muted-foreground" />
                  <span>Created on {new Date(job?.created_at || "").toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{job?.description || "No description provided."}</p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Areas */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ListChecks className="mr-2 h-5 w-5" />
                  Job Areas
                </CardTitle>
                <CardDescription>
                  Track the status of individual work areas for this job.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {job?.areas.map(area => (
                    <li key={area.id} className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                      <span className="font-medium">{area.name}</span>
                      <Badge variant="outline">{area.status}</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
