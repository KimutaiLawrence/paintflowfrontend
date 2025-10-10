"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { townCouncilsApi, type TownCouncil } from "@/lib/api"
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
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ButtonLoader } from "@/components/ui/custom-loader"
import { ServerDataTable } from "@/components/shared/server-data-table"
import { columns } from "./columns"

export default function TownCouncilsPage() {
  const { canManageUsers } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState("")
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedTC, setSelectedTC] = useState<TownCouncil | null>(null)
  const [formData, setFormData] = useState({ name: "", shortform: "" })

  const { data, isLoading } = useQuery({
    queryKey: ["townCouncils", page, perPage, search],
    queryFn: () => townCouncilsApi.getTownCouncils({ page, per_page: perPage, search }),
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; shortform: string }) =>
      townCouncilsApi.createTownCouncil(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["townCouncils"] })
      setIsCreateOpen(false)
      setFormData({ name: "", shortform: "" })
      toast.success("Success", { description: "Town council created successfully" })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to create town council"
      toast.error("Error", { description: errorMessage })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; shortform: string } }) =>
      townCouncilsApi.updateTownCouncil(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["townCouncils"] })
      setIsEditOpen(false)
      setSelectedTC(null)
      toast.success("Success", { description: "Town council updated successfully" })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to update town council"
      toast.error("Error", { description: errorMessage })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => townCouncilsApi.deleteTownCouncil(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["townCouncils"] })
      setIsDeleteOpen(false)
      setSelectedTC(null)
      toast.success("Success", { description: "Town council deleted successfully" })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete town council"
      toast.error("Error", { description: errorMessage })
    },
  })

  const handleEdit = (townCouncil: TownCouncil) => {
    setSelectedTC(townCouncil)
    setFormData({ name: townCouncil.name, shortform: townCouncil.shortform })
    setIsEditOpen(true)
  }

  const handleDelete = (townCouncil: TownCouncil) => {
    setSelectedTC(townCouncil)
    setIsDeleteOpen(true)
  }

  if (!canManageUsers()) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">
          You don't have permission to manage town councils.
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Town Councils</h1>
          <p className="text-muted-foreground mt-1">Manage town councils and their short forms</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Town Council
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Town Council</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Town Council Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Ang Mo Kio Town Council"
                />
              </div>
              <div>
                <Label htmlFor="shortform">Short Form</Label>
                <Input
                  id="shortform"
                  value={formData.shortform}
                  onChange={(e) => setFormData({ ...formData, shortform: e.target.value })}
                  placeholder="e.g., AMKTC"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false)
                  setFormData({ name: "", shortform: "" })
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={!formData.name || !formData.shortform || createMutation.isPending}
              >
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
        filterPlaceholder="Search town councils..."
        isLoading={isLoading}
        meta={{
          onEdit: handleEdit,
          onDelete: handleDelete,
        }}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Town Council</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Town Council Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-shortform">Short Form</Label>
              <Input
                id="edit-shortform"
                value={formData.shortform}
                onChange={(e) => setFormData({ ...formData, shortform: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false)
                setSelectedTC(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedTC &&
                updateMutation.mutate({ id: selectedTC.id, data: formData })
              }
              disabled={!formData.name || !formData.shortform || updateMutation.isPending}
            >
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

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Town Council</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTC?.name} ({selectedTC?.shortform})"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedTC && deleteMutation.mutate(selectedTC.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
