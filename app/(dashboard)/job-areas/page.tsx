"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { jobAreasApi, type JobArea } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ButtonLoader } from "@/components/ui/custom-loader"
import { ServerDataTable } from "@/components/shared/server-data-table"

import { columns } from "./columns"

export default function JobAreasPage() {
  const { canManageUsers } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState("")
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedJobArea, setSelectedJobArea] = useState<JobArea | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "" })

  const { data, isLoading } = useQuery({
    queryKey: ["jobAreas", page, perPage, search],
    queryFn: () => jobAreasApi.getJobAreas({ page, per_page: perPage, search }),
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => jobAreasApi.createJobArea(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobAreas"] })
      setIsCreateOpen(false)
      setFormData({ name: "", description: "" })
      toast({
        title: "Success",
        description: "Job area created successfully",
      })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to create job area"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description?: string } }) =>
      jobAreasApi.updateJobArea(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobAreas"] })
      setIsEditOpen(false)
      setSelectedJobArea(null)
      toast({
        title: "Success",
        description: "Job area updated successfully",
      })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to update job area"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobAreasApi.deleteJobArea(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobAreas"] })
      setIsDeleteOpen(false)
      setSelectedJobArea(null)
      toast({
        title: "Success",
        description: "Job area deleted successfully",
      })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete job area"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    },
  })

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      })
      return
    }
    createMutation.mutate(formData)
  }

  const handleEdit = (jobArea: JobArea) => {
    setSelectedJobArea(jobArea)
    setFormData({ name: jobArea.name, description: jobArea.description || "" })
    setIsEditOpen(true)
  }

  const handleUpdate = () => {
    if (!formData.name.trim() || !selectedJobArea) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      })
      return
    }
    updateMutation.mutate({ id: selectedJobArea.id, data: formData })
  }

  const handleDelete = (jobArea: JobArea) => {
    setSelectedJobArea(jobArea)
    setIsDeleteOpen(true)
  }

  const confirmDelete = () => {
    if (selectedJobArea) {
      deleteMutation.mutate(selectedJobArea.id)
    }
  }

  const tableMeta = {
    onEdit: handleEdit,
    onDelete: handleDelete,
  }

  if (!canManageUsers) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <ButtonLoader />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Job Areas</h1>
          <p className="text-muted-foreground mt-1">Manage predefined job areas for job creation</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Job Area
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Job Area</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Area Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Kitchen, Master Bedroom"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this area"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false)
                  setFormData({ name: "", description: "" })
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <span className="flex items-center">
                    <ButtonLoader className="mr-2" />
                    Creating...
                  </span>
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search job areas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
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
          filterPlaceholder="Search job areas..."
          meta={tableMeta}
        />
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Job Area</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Area Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Kitchen, Master Bedroom"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this area"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false)
                setSelectedJobArea(null)
                setFormData({ name: "", description: "" })
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <span className="flex items-center">
                  <ButtonLoader className="mr-2" />
                  Updating...
                </span>
              ) : (
                "Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job area{" "}
              <strong>{selectedJobArea?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <span className="flex items-center">
                  <ButtonLoader className="mr-2" />
                  Deleting...
                </span>
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
