"use client"

import * as React from "react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { documentCategoriesApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { 
  Plus, 
  Tag
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useAuth } from "@/hooks/use-auth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ServerDataTable } from "@/components/shared/server-data-table"
import { columns, essentialColumns, type DocumentCategory } from "./columns"

// Category Form Component
const CategoryForm = ({ 
  category, 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  category?: DocumentCategory
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) => {
  const [formData, setFormData] = React.useState({
    code: '',
    name: '',
    description: '',
    color: '#3B82F6'
  })

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Reset form when category changes
  React.useEffect(() => {
    if (category) {
      setFormData({
        code: category.code,
        name: category.name,
        description: category.description || '',
        color: category.color || '#3B82F6'
      })
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        color: '#3B82F6'
      })
    }
  }, [category])

  const createMutation = useMutation({
    mutationFn: documentCategoriesApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-categories"] })
      toast.success("Category created successfully")
      onSuccess()
    },
    onError: (error: any) => {
      toast.error("Failed to create category: " + (error.response?.data?.message || "Please try again"))
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      documentCategoriesApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-categories"] })
      toast.success("Category updated successfully")
      onSuccess()
    },
    onError: (error: any) => {
      toast.error("Failed to update category: " + (error.response?.data?.message || "Please try again"))
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (category) {
      updateMutation.mutate({ 
        id: category.id, 
        data: formData 
      })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Edit Category' : 'Create New Category'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., FPP, SWP"
                maxLength={10}
                required
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Fall Prevention Plan"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description of this category"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (category ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function DocumentCategoriesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<DocumentCategory | undefined>()
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const [showAllColumns, setShowAllColumns] = useState(false)
  
  const { canManageJobs } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["document-categories"],
    queryFn: documentCategoriesApi.getCategories,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: documentCategoriesApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-categories"] })
      toast.success("Category deleted successfully")
      setDeletingCategoryId(null)
    },
    onError: (error: any) => {
      toast.error("Failed to delete category: " + (error.response?.data?.message || "Please try again"))
    }
  })

  const handleEdit = (category: DocumentCategory) => {
    setEditingCategory(category)
    setIsFormOpen(true)
  }

  const handleDelete = (categoryId: string) => {
    setDeletingCategoryId(categoryId)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingCategory(undefined)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingCategory(undefined)
  }

  const handleConfirmDelete = () => {
    if (deletingCategoryId) {
      deleteMutation.mutate(deletingCategoryId)
    }
  }

  if (!canManageJobs()) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don't have permission to manage document categories.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Document Categories</h2>
          <p className="text-muted-foreground">
            Manage document categories for your company.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <ServerDataTable<DocumentCategory, any>
        columns={showAllColumns ? columns : essentialColumns}
        data={categories}
        total={categories.length}
        page={1}
        perPage={categories.length}
        onPageChange={() => {}}
        onPerPageChange={() => {}}
        onSearchChange={() => {}}
        onDelete={handleDelete}
        filterPlaceholder="Search categories..."
        isLoading={isLoading}
        toolbarContent={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAllColumns(!showAllColumns)}
            >
              {showAllColumns ? "Compact View" : "Show All Columns"}
            </Button>
          </div>
        }
        meta={{
          onEdit: handleEdit,
          onDelete: handleDelete
        }}
      />

      <CategoryForm
        category={editingCategory}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        isOpen={deletingCategoryId !== null}
        onClose={() => setDeletingCategoryId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
