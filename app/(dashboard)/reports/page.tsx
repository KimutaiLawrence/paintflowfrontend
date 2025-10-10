'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Eye, Edit, Trash2, Download, FileText, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { completionReportsApi, CompletionReport } from '@/lib/api'
import { ServerDataTable } from '@/components/shared/server-data-table'
import { ButtonLoader } from '@/components/ui/custom-loader'
import { format } from 'date-fns'
import Link from 'next/link'

export default function ReportsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedReport, setSelectedReport] = useState<CompletionReport | null>(null)
  const [createForm, setCreateForm] = useState({
    job_id: '',
    completion_date: '',
    final_inspection_date: '',
    inspector_name: '',
    completion_notes: '',
    areas_painted: [] as string[]
  })
  const [editForm, setEditForm] = useState({
    completion_date: '',
    final_inspection_date: '',
    inspector_name: '',
    completion_notes: '',
    areas_painted: [] as string[]
  })

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch completion reports
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['completion-reports', page, search],
    queryFn: () => completionReportsApi.getCompletionReports({
      page,
      per_page: 10,
      search: search || undefined
    })
  })

  // Create report mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => completionReportsApi.createCompletionReport(createForm.job_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completion-reports'] })
      setShowCreateDialog(false)
      setCreateForm({
        job_id: '',
        completion_date: '',
        final_inspection_date: '',
        inspector_name: '',
        completion_notes: '',
        areas_painted: []
      })
      toast("Completion report created successfully")
    },
    onError: (error: any) => {
      toast.error("Failed to create completion report", {
        description: error.message
      })
    }
  })

  // Update report mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      completionReportsApi.updateCompletionReport(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completion-reports'] })
      setShowEditDialog(false)
      setSelectedReport(null)
      toast("Completion report updated successfully")
    },
    onError: (error: any) => {
      toast.error("Failed to update completion report", {
        description: error.message
      })
    }
  })

  // Delete report mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => completionReportsApi.deleteCompletionReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completion-reports'] })
      toast("Completion report deleted successfully")
    },
    onError: (error: any) => {
      toast.error("Failed to delete completion report", {
        description: error.message
      })
    }
  })

  const handleCreate = () => {
    if (!createForm.job_id || !createForm.completion_date) {
      toast.error("Job ID and completion date are required")
      return
    }

    createMutation.mutate(createForm)
  }

  const handleEdit = (report: CompletionReport) => {
    setSelectedReport(report)
    setEditForm({
      completion_date: report.completion_date.split('T')[0], // Convert to date input format
      final_inspection_date: report.final_inspection_date?.split('T')[0] || '',
      inspector_name: report.inspector_name || '',
      completion_notes: report.completion_notes || '',
      areas_painted: report.areas_painted || []
    })
    setShowEditDialog(true)
  }

  const handleUpdate = () => {
    if (!selectedReport) return

    updateMutation.mutate({
      id: selectedReport.id,
      data: editForm
    })
  }

  const handleDelete = (report: CompletionReport) => {
    if (confirm(`Are you sure you want to delete the completion report for "${report.job_title}"?`)) {
      deleteMutation.mutate(report.id)
    }
  }

  const handleDownload = (report: CompletionReport) => {
    // Here you would implement the download functionality
    toast("Download functionality coming soon")
  }

  const columns = [
    {
      accessorKey: 'job_title',
      header: 'Job Title',
      cell: ({ row }: { row: any }) => (
        <div className="font-medium">{row.getValue('job_title')}</div>
      )
    },
    {
      accessorKey: 'job_number',
      header: 'Job Number',
      cell: ({ row }: { row: any }) => (
        <Badge variant="outline">{row.getValue('job_number')}</Badge>
      )
    },
    {
      accessorKey: 'completion_date',
      header: 'Completion Date',
      cell: ({ row }: { row: any }) => (
        <div className="text-sm">
          {format(new Date(row.getValue('completion_date')), 'MMM dd, yyyy')}
        </div>
      )
    },
    {
      accessorKey: 'inspector_name',
      header: 'Inspector',
      cell: ({ row }: { row: any }) => (
        <div className="text-sm">
          {row.getValue('inspector_name') || '-'}
        </div>
      )
    },
    {
      accessorKey: 'areas_painted',
      header: 'Areas Painted',
      cell: ({ row }: { row: any }) => {
        const areas = row.getValue('areas_painted') || []
        return (
          <div className="text-sm">
            {areas.length > 0 ? `${areas.length} areas` : 'No areas'}
          </div>
        )
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: any }) => {
        const report = row.original as CompletionReport
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(report)}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(report)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(report)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Link href={`/jobs/${report.job_id}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
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
          <h1 className="text-3xl font-bold">Completion Reports</h1>
          <p className="text-muted-foreground">
            View and manage job completion reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Completion Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="job_id">Job ID *</Label>
                  <Input
                    id="job_id"
                    value={createForm.job_id}
                    onChange={(e) => setCreateForm({ ...createForm, job_id: e.target.value })}
                    placeholder="Enter job ID"
                  />
                </div>
                <div>
                  <Label htmlFor="completion_date">Completion Date *</Label>
                  <Input
                    id="completion_date"
                    type="date"
                    value={createForm.completion_date}
                    onChange={(e) => setCreateForm({ ...createForm, completion_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="final_inspection_date">Final Inspection Date</Label>
                  <Input
                    id="final_inspection_date"
                    type="date"
                    value={createForm.final_inspection_date}
                    onChange={(e) => setCreateForm({ ...createForm, final_inspection_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="inspector_name">Inspector Name</Label>
                  <Input
                    id="inspector_name"
                    value={createForm.inspector_name}
                    onChange={(e) => setCreateForm({ ...createForm, inspector_name: e.target.value })}
                    placeholder="Enter inspector name"
                  />
                </div>
                <div>
                  <Label htmlFor="completion_notes">Completion Notes</Label>
                  <Textarea
                    id="completion_notes"
                    value={createForm.completion_notes}
                    onChange={(e) => setCreateForm({ ...createForm, completion_notes: e.target.value })}
                    placeholder="Enter completion notes"
                  />
                </div>
                <Button 
                  onClick={handleCreate} 
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending && <ButtonLoader />}
                  Create Report
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
                placeholder="Search completion reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ServerDataTable
            columns={columns}
            data={reportsData?.data || []}
            total={reportsData?.total || 0}
            page={page}
            perPage={reportsData?.per_page || 10}
            onPageChange={setPage}
            isLoading={isLoading}
            filterPlaceholder="Search completion reports..."
            onSearchChange={setSearch}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Completion Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-completion_date">Completion Date</Label>
              <Input
                id="edit-completion_date"
                type="date"
                value={editForm.completion_date}
                onChange={(e) => setEditForm({ ...editForm, completion_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-final_inspection_date">Final Inspection Date</Label>
              <Input
                id="edit-final_inspection_date"
                type="date"
                value={editForm.final_inspection_date}
                onChange={(e) => setEditForm({ ...editForm, final_inspection_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-inspector_name">Inspector Name</Label>
              <Input
                id="edit-inspector_name"
                value={editForm.inspector_name}
                onChange={(e) => setEditForm({ ...editForm, inspector_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-completion_notes">Completion Notes</Label>
              <Textarea
                id="edit-completion_notes"
                value={editForm.completion_notes}
                onChange={(e) => setEditForm({ ...editForm, completion_notes: e.target.value })}
              />
            </div>
            <Button 
              onClick={handleUpdate} 
              disabled={updateMutation.isPending}
              className="w-full"
            >
              {updateMutation.isPending && <ButtonLoader />}
              Update Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}