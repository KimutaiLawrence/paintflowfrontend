"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { jobTitlesApi, JobTitle } from "@/lib/api"
import { createJobTitleColumns } from "./columns"
import { ServerDataTable } from "@/components/shared/server-data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { ButtonLoader } from "@/components/ui/custom-loader"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function JobTitlesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState("")

  // Dialogs state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedJobTitle, setSelectedJobTitle] = useState<JobTitle | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    is_default: false,
  })

  // Fetch job titles
  const { data, isLoading } = useQuery({
    queryKey: ["jobTitles", page, perPage, search],
    queryFn: () => jobTitlesApi.getJobTitles({ page, per_page: perPage, search }),
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: jobTitlesApi.createJobTitle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobTitles"] })
      setCreateDialogOpen(false)
      resetForm()
      toast.success("Success", { description: "Job title created successfully" })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to create job title"
      toast.error("Error", { description: errorMessage })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JobTitle> }) =>
      jobTitlesApi.updateJobTitle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobTitles"] })
      setEditDialogOpen(false)
      setSelectedJobTitle(null)
      resetForm()
      toast.success("Success", { description: "Job title updated successfully" })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to update job title"
      toast.error("Error", { description: errorMessage })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: jobTitlesApi.deleteJobTitle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobTitles"] })
      setDeleteDialogOpen(false)
      setSelectedJobTitle(null)
      toast.success("Success", { description: "Job title deleted successfully" })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete job title"
      toast.error("Error", { description: errorMessage })
    },
  })

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      is_default: false,
    })
  }

  const handleCreate = () => {
    createMutation.mutate(formData)
  }

  const handleEdit = (jobTitle: JobTitle) => {
    setSelectedJobTitle(jobTitle)
    setFormData({
      title: jobTitle.title,
      description: jobTitle.description || "",
      is_default: jobTitle.is_default || false,
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = () => {
    if (!selectedJobTitle) return
    updateMutation.mutate({
      id: selectedJobTitle.id,
      data: formData,
    })
  }

  const handleDelete = (jobTitle: JobTitle) => {
    setSelectedJobTitle(jobTitle)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (!selectedJobTitle) return
    deleteMutation.mutate(selectedJobTitle.id)
  }

  const columns = createJobTitleColumns(handleEdit, handleDelete)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Titles</h1>
          <p className="text-muted-foreground">
            Manage job title templates for quick job creation
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Job Title
        </Button>
      </div>

      <ServerDataTable
        columns={columns}
        data={data?.data || []}
        total={data?.total || 0}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        onSearchChange={setSearch}
        filterPlaceholder="Search job titles..."
        isLoading={isLoading}
      />

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Job Title</DialogTitle>
            <DialogDescription>
              Add a new job title template. This will be available when creating jobs.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Waterproofing Repair Works"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this job type"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
              <Label htmlFor="is_default" className="cursor-pointer">
                Set as default (auto-fill when creating jobs)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.title || createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <ButtonLoader />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Job Title</DialogTitle>
            <DialogDescription>
              Update the job title details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
              <Label htmlFor="edit-is_default" className="cursor-pointer">
                Set as default
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.title || updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <ButtonLoader />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the job title &quot;{selectedJobTitle?.title}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <ButtonLoader />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

