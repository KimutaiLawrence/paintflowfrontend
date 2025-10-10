'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Filter, Eye, Edit, Trash2, Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { floorPlanTemplatesApi, FloorPlanTemplate } from '@/lib/api'
import { ServerDataTable } from '@/components/shared/server-data-table'
import { ButtonLoader } from '@/components/ui/custom-loader'
import { formatFileSize } from '@/lib/utils'
import Link from 'next/link'

const categories = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail' },
  { value: 'other', label: 'Other' }
]

export default function FloorPlansPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<FloorPlanTemplate | null>(null)
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    category: '',
    file: null as File | null
  })
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    category: '',
    is_active: true
  })

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch floor plan templates
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['floor-plan-templates', page, search, category],
    queryFn: () => floorPlanTemplatesApi.getFloorPlanTemplates({
      page,
      per_page: 10,
      search: search || undefined,
      category: category === 'all' ? undefined : category
    })
  })

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: (formData: FormData) => floorPlanTemplatesApi.createFloorPlanTemplate(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floor-plan-templates'] })
      setShowCreateDialog(false)
      setCreateForm({ name: '', description: '', category: '', file: null })
      toast("Floor plan template created successfully")
    },
    onError: (error: any) => {
      toast.error("Failed to create floor plan template", {
        description: error.message
      })
    }
  })

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      floorPlanTemplatesApi.updateFloorPlanTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floor-plan-templates'] })
      setShowEditDialog(false)
      setSelectedTemplate(null)
      toast("Floor plan template updated successfully")
    },
    onError: (error: any) => {
      toast.error("Failed to update floor plan template", {
        description: error.message
      })
    }
  })

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => floorPlanTemplatesApi.deleteFloorPlanTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floor-plan-templates'] })
      toast("Floor plan template deleted successfully")
    },
    onError: (error: any) => {
      toast.error("Failed to delete floor plan template", {
        description: error.message
      })
    }
  })

  const handleCreate = () => {
    if (!createForm.name || !createForm.file) {
      toast.error("Name and file are required")
      return
    }

    const formData = new FormData()
    formData.append('name', createForm.name)
    formData.append('description', createForm.description)
    formData.append('category', createForm.category)
    formData.append('file', createForm.file)

    createMutation.mutate(formData)
  }

  const handleEdit = (template: FloorPlanTemplate) => {
    setSelectedTemplate(template)
    setEditForm({
      name: template.name,
      description: template.description || '',
      category: template.category || '',
      is_active: template.is_active
    })
    setShowEditDialog(true)
  }

  const handleUpdate = () => {
    if (!selectedTemplate) return

    updateMutation.mutate({
      id: selectedTemplate.id,
      data: editForm
    })
  }

  const handleDelete = (template: FloorPlanTemplate) => {
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      deleteMutation.mutate(template.id)
    }
  }

  const columns = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }: { row: any }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      )
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }: { row: any }) => {
        const category = row.getValue('category')
        return category ? (
          <Badge variant="secondary">{category}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      }
    },
    {
      accessorKey: 'file_name',
      header: 'File',
      cell: ({ row }: { row: any }) => (
        <div className="text-sm text-muted-foreground">
          {row.getValue('file_name')}
        </div>
      )
    },
    {
      accessorKey: 'file_size',
      header: 'Size',
      cell: ({ row }: { row: any }) => {
        const size = row.getValue('file_size')
        return size ? formatFileSize(size) : '-'
      }
    },
    {
      accessorKey: 'usage_count',
      header: 'Usage',
      cell: ({ row }: { row: any }) => (
        <Badge variant="outline">{row.getValue('usage_count')} times</Badge>
      )
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }: { row: any }) => (
        <Badge variant={row.getValue('is_active') ? 'default' : 'secondary'}>
          {row.getValue('is_active') ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: any }) => {
        const template = row.original as FloorPlanTemplate
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(template.image_url, '_blank')}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(template)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(template)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Link href={`/floor-plans/canvas?template=${template.id}`}>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Floor Plans</h1>
          <p className="text-muted-foreground">
            Manage reusable floor plan templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/floor-plans/canvas">
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Floor Plan Canvas
            </Button>
          </Link>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Floor Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Floor Plan Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Enter floor plan name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={createForm.category} onValueChange={(value) => setCreateForm({ ...createForm, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="file">Floor Plan File *</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setCreateForm({ ...createForm, file: e.target.files?.[0] || null })}
                  />
                </div>
                <Button 
                  onClick={handleCreate} 
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending && <ButtonLoader />}
                  Create Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search floor plans..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ServerDataTable
            columns={columns}
            data={templatesData?.data || []}
            total={templatesData?.total || 0}
            page={page}
            perPage={templatesData?.per_page || 10}
            onPageChange={setPage}
            isLoading={isLoading}
            filterPlaceholder="Search floor plans..."
            onSearchChange={setSearch}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Floor Plan Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select value={editForm.category} onValueChange={(value) => setEditForm({ ...editForm, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={editForm.is_active}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
            <Button 
              onClick={handleUpdate} 
              disabled={updateMutation.isPending}
              className="w-full"
            >
              {updateMutation.isPending && <ButtonLoader />}
              Update Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
