"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { jobsApi, JobDetail } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowLeft, Edit, Trash2, Briefcase, MapPin, Flag, Calendar, ListChecks, Shield, Search, TrendingUp, FileText, Upload, Download, Eye } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

const priorityStyles: { [key: string]: string } = {
  P1: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
  P2: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
  P3: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
}

// Helper function to format status
const formatStatus = (status: any): string => {
  if (!status) return 'Pending'
  if (typeof status === 'string') {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  return String(status)
}

// Helper function to get status color
const getStatusColor = (status: any): string => {
  if (!status) return "bg-gray-100 text-gray-800 border-gray-200"
  const statusStr = String(status).toLowerCase()
  
  if (statusStr.includes('completed') || statusStr.includes('done')) {
    return "bg-green-200 text-green-900 border-green-300 font-bold"
  }
  if (statusStr.includes('pending')) {
    return "bg-yellow-200 text-yellow-900 border-yellow-300 font-bold"
  }
  if (statusStr.includes('left')) {
    return "bg-orange-200 text-orange-900 border-orange-300 font-bold"
  }
  return "bg-gray-100 text-gray-800 border-gray-200"
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
      <div className="max-w-7xl mx-auto space-y-6">
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

        {/* 4-Tab Structure as requested by client */}
        <Tabs defaultValue="safety" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="safety" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Safety Documents
            </TabsTrigger>
            <TabsTrigger value="inspection" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Inspection
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="completion" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Completion Report
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Safety Documents */}
          <TabsContent value="safety" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Safety Documents
                </CardTitle>
                <CardDescription>
                  Daily safety submissions and reference documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Daily Submissions</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload PTW, TBM, WAH records, photos, and VSS checklist
                    </p>
                    <Button className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Safety Documents
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">Reference Documents</h4>
                    <p className="text-sm text-muted-foreground">
                      View SWP, SDS, FPP, RA, MS, ERP documents (View Only)
                    </p>
                    <Button variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View Reference Documents
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Inspection */}
          <TabsContent value="inspection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Site Inspection
                </CardTitle>
                <CardDescription>
                  Inspection forms, floor plan drawings, and site photos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Inspection Status</h4>
                    <p className="text-sm text-muted-foreground">
                      {job?.inspection_date ? `Completed on ${new Date(job.inspection_date).toLocaleDateString()}` : 'No inspection scheduled'}
                    </p>
                    <Button className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Inspection Form
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">Floor Plan Drawings</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload and view floor plan drawings
                    </p>
                    <Button variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Floor Plans
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Site Photos</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload photos from site inspection
                  </p>
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Site Photos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Progress */}
          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Work Progress
                </CardTitle>
                <CardDescription>
                  Track work stages, team assignments, and progress updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Current Status</h4>
                    <Badge className={getStatusColor(job?.status)}>
                      {formatStatus(job?.status)}
                    </Badge>
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Next Steps:</h5>
                      <p className="text-sm text-muted-foreground">
                        {String(job?.status) === 'pending_survey' && 'Schedule site inspection'}
                        {String(job?.status) === 'pending_repair' && 'Begin repair work'}
                        {String(job?.status) === 'left_primer' && 'Apply primer coating'}
                        {String(job?.status) === 'left_ultra' && 'Apply ultra coating'}
                        {String(job?.status) === 'left_top_coat_cover_slab' && 'Apply top coat'}
                        {String(job?.status) === 'repair_completed' && 'Job completed'}
                        {!job?.status && 'Schedule initial survey'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">Work Schedule</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Report Date:</span>
                        <span className="font-medium">
                          {job?.report_date ? new Date(job.report_date).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Inspection:</span>
                        <span className="font-medium">
                          {job?.inspection_date ? new Date(job.inspection_date).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Repair Start:</span>
                        <span className="font-medium">
                          {job?.repair_schedule ? new Date(job.repair_schedule).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ultra Schedule:</span>
                        <span className="font-medium">
                          {job?.ultra_schedule ? new Date(job.ultra_schedule).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Progress Updates</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload photos and updates for each work stage (Patch Work, Primer, Painting, Touch Up, Top Coat)
                  </p>
                  <Button className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Progress Photos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Completion Report */}
          <TabsContent value="completion" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Completion Report
                </CardTitle>
                <CardDescription>
                  Final completion documentation and before/after photos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Job Status</h4>
                    <Badge variant={String(job?.status) === 'repair_completed' ? "default" : "secondary"}>
                      {String(job?.status) === 'repair_completed' ? 'Completed' : 'In Progress'}
                    </Badge>
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Work Location:</h5>
                      <p className="text-sm text-muted-foreground">
                        {job?.location} - Block {job?.block_no} - Unit {job?.unit_no}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">Completion Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Completion Date:</span>
                        <span className="font-medium">
                          {job?.repair_completion ? new Date(job.repair_completion).toLocaleDateString() : 'Not completed'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Work Area:</span>
                        <span className="font-medium">{job?.area || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Completion Report</h4>
                  <p className="text-sm text-muted-foreground">
                    {String(job?.status) === 'repair_completed' 
                      ? 'Generate completion report with inspection forms and painted areas'
                      : 'Complete all work stages before generating report'
                    }
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      disabled={String(job?.status) !== 'repair_completed'}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Completion Report
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Before/After Photos
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
