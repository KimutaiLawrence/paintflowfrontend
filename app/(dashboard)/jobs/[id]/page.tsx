"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Building,
  Camera,
  Users,
  Clock,
  AlertCircle,
  Edit,
  Upload,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import api, { extractArrayData } from "@/lib/api"
import Link from "next/link"
import { cn } from "@/lib/utils"
import PhotoUpload from "@/components/features/photo-upload"

interface JobArea {
  id: string
  name: string
  status: string
  photos_count?: number
  assigned_workers?: any[]
}

interface Job {
  id: string
  title: string
  address: string
  // status: string // This property does not exist on the API response
  priority: string
  job_number: string
  client_name?: string
  management_company?: string
  description?: string
  created_at: string
  updated_at: string
  areas?: JobArea[]
  assigned_workers?: any[]
  photos?: any[]
}

const STATUS_OPTIONS = [
  { value: "pending_survey", label: "Pending Survey", color: "bg-gray-100 text-gray-800" },
  { value: "pending_primer", label: "Pending Primer", color: "bg-yellow-100 text-yellow-800" },
  { value: "pending_patch", label: "Pending Patch", color: "bg-yellow-100 text-yellow-800" },
  { value: "painting", label: "Painting", color: "bg-orange-100 text-orange-800" },
  { value: "done", label: "Completed", color: "bg-green-100 text-green-800" },
]

function StatusBadge({ status }: { status: string }) {
  const statusConfig = STATUS_OPTIONS.find((s) => s.value === status)
  return (
    <Badge className={cn("text-xs", statusConfig?.color || "bg-gray-100 text-gray-800")}>
      {statusConfig?.label || status}
    </Badge>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const getPriorityColor = (priority: string) => {
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

  return <Badge className={cn("text-xs border", getPriorityColor(priority))}>{priority}</Badge>
}

function AreaCard({
  area,
  jobId,
  onStatusUpdate,
}: {
  area: JobArea
  jobId: string
  onStatusUpdate: (areaId: string, newStatus: string) => void
}) {
  const { canManageJobs } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    if (!canManageJobs()) return
    setIsUpdating(true)
    try {
      await onStatusUpdate(area.id, newStatus)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h4 className="font-semibold">{area.name}</h4>
            <StatusBadge status={area.status} />
          </div>
          {canManageJobs() && (
            <Select value={area.status} onValueChange={handleStatusChange} disabled={isUpdating}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            {area.photos_count && area.photos_count > 0 && (
              <span className="flex items-center space-x-1">
                <Camera className="h-4 w-4" />
                <span>{area.photos_count} photos</span>
              </span>
            )}
            {area.assigned_workers && area.assigned_workers.length > 0 && (
              <span className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{area.assigned_workers.length} workers</span>
              </span>
            )}
          </div>
          <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload Photos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Photos for {area.name}</DialogTitle>
                <DialogDescription>
                  Upload progress photos for this specific area. Photos will be automatically organized by category.
                </DialogDescription>
              </DialogHeader>
              <PhotoUpload jobId={jobId} areaId={area.id} onUploadComplete={() => setShowPhotoUpload(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}

function PhotoGallery({ photos }: { photos: any[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const categories = ["all", "before", "during", "after"]
  const filteredPhotos =
    selectedCategory === "all" ? photos : photos.filter((photo) => photo.category === selectedCategory)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Filter by category:</span>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Photos
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Job Photos</DialogTitle>
              <DialogDescription>
                Upload photos for this job. You can organize them by category and area.
              </DialogDescription>
            </DialogHeader>
            <PhotoUpload jobId={photos[0]?.job || ""} />
          </DialogContent>
        </Dialog>
      </div>

      {filteredPhotos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="aspect-square bg-muted flex items-center justify-center">
                {photo.url ? (
                  <img
                    src={photo.url || "/placeholder.svg"}
                    alt={`${photo.category} photo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <CardContent className="p-2">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge className="text-xs capitalize">{photo.category}</Badge>
                    {photo.gps_latitude && photo.gps_longitude && (
                      <MapPin className="h-3 w-3" title="GPS location available" />
                    )}
                  </div>
                  <p>{new Date(photo.created_at).toLocaleDateString()}</p>
                  {photo.uploaded_by && <p>By: {photo.uploaded_by}</p>}
                  {photo.area_name && <p>Area: {photo.area_name}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Camera className="mx-auto h-12 w-12 mb-2" />
          <p>No photos in this category</p>
        </div>
      )}
    </div>
  )
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, canManageJobs } = useAuth()
  const queryClient = useQueryClient()
  const jobId = params.id as string

  const {
    data: job,
    isLoading,
    error,
  } = useQuery<Job>({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const response = await api.get(`/jobs/${jobId}/`)
      return response.data
    },
  })

  const updateAreaStatus = useMutation({
    mutationFn: async ({ areaId, status }: { areaId: string; status: string }) => {
      const response = await api.patch(`/areas/${areaId}/`, { status })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", jobId] })
    },
  })

  const handleAreaStatusUpdate = (areaId: string, newStatus: string) => {
    updateAreaStatus.mutate({ areaId, status: newStatus })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Job Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The job you're looking for doesn't exist or you don't have access to it.
        </p>
        <Link href="/jobs">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </Link>
      </div>
    )
  }

  const areas: JobArea[] = job.areas || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/jobs">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-3xl font-bold">{job.title}</h1>
              {/* <StatusBadge status={job.status} /> */}
              <PriorityBadge priority={job.priority} />
            </div>
            <div className="flex items-center space-x-4 text-muted-foreground">
              <span className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{job.address}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Created {new Date(job.created_at).toLocaleDateString()}</span>
              </span>
            </div>
          </div>
        </div>
        {canManageJobs() && (
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Job
            </Button>
          </div>
        )}
      </div>

      {/* Job Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <User className="mr-2 h-4 w-4" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {job.client_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Client Name</p>
                  <p className="font-medium">{job.client_name}</p>
                </div>
              )}
              {job.management_company && (
                <div>
                  <p className="text-sm text-muted-foreground">Management Company</p>
                  <p className="font-medium">{job.management_company}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Building className="mr-2 h-4 w-4" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Total Areas</p>
                <p className="font-medium">{areas.length} areas</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Photos</p>
                <p className="font-medium">N/A</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{new Date(job.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{new Date(job.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="areas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="areas">Areas ({areas.length})</TabsTrigger>
          {/* <TabsTrigger value="photos">Photos</TabsTrigger> */}
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="areas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Area Management</CardTitle>
              <CardDescription>Track progress and manage status for each area of this job</CardDescription>
            </CardHeader>
            <CardContent>
              {areas.length > 0 ? (
                <div className="space-y-4">
                  {areas.map((area) => (
                    <AreaCard key={area.id} area={area} jobId={jobId} onStatusUpdate={handleAreaStatusUpdate} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Building className="mx-auto h-12 w-12 mb-2" />
                  <p>No areas defined for this job</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* <TabsContent value="photos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Photo Gallery</CardTitle>
              <CardDescription>View all photos uploaded for this job, organized by category</CardDescription>
            </CardHeader>
            <CardContent>
              <PhotoGallery photos={photos} />
            </CardContent>
          </Card>
        </TabsContent> */}

        <TabsContent value="workers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Workers</CardTitle>
              <CardDescription>Manage worker assignments for this job</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-2" />
                <p>Worker management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Recent updates and changes to this job</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="mx-auto h-12 w-12 mb-2" />
                <p>Activity tracking coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
