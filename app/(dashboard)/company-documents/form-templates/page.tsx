"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { formsApi, jobsApi } from "@/lib/api"
import { DataTable } from "@/components/shared/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Pencil, FilePlus2, Save } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type TemplateRow = {
  id: string
  name: string
  description?: string
  created_at: string
}

export default function FormTemplatesPage() {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<TemplateRow | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isUseOpen, setIsUseOpen] = useState(false)
  const [draft, setDraft] = useState<{ id?: string; name: string; description?: string; content_markdown: string }>({ name: "", description: "", content_markdown: "" })
  const [selectedTemplateForUse, setSelectedTemplateForUse] = useState<TemplateRow | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string>("")
  const [selectedJobAreaId, setSelectedJobAreaId] = useState<string>("")

  const { data, isLoading } = useQuery({
    queryKey: ["formTemplates"],
    queryFn: async () => {
      const res = await formsApi.getTemplates()
      return (res.templates || []) as TemplateRow[]
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => formsApi.deleteTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["formTemplates"] }),
  })

  const createMutation = useMutation({
    mutationFn: () => formsApi.createTemplate({ name: draft.name, description: draft.description, form_schema: [], content_markdown: draft.content_markdown }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formTemplates"] })
      setIsEditorOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => selected?.id ? formsApi.updateTemplate(selected.id, { name: draft.name, description: draft.description, content_markdown: draft.content_markdown }) : Promise.resolve(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formTemplates"] })
      setIsEditorOpen(false)
    },
  })

  const { data: jobsData } = useQuery({
    queryKey: ["jobs", "for-use-template"],
    queryFn: async () => {
      const res: any = await jobsApi.getJobs({ page: 1, per_page: 50 })
      return res.data || []
    },
  })

  const selectedJob = useMemo(() => {
    return (jobsData || []).find((j: any) => j.id === selectedJobId)
  }, [jobsData, selectedJobId])

  useEffect(() => {
    if (selected) {
      setDraft({ id: selected.id, name: selected.name, description: selected.description || "", content_markdown: (selected as any).content_markdown || "" })
    } else {
      setDraft({ name: "", description: "", content_markdown: "" })
    }
  }, [selected])

  const columns: ColumnDef<TemplateRow>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "description", header: "Description" },
    { accessorKey: "created_at", header: "Created" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelected(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteMutation.mutate(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedTemplateForUse(row.original)
              setIsUseOpen(true)
            }}
            title="Use Template"
          >
            <FilePlus2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Form Templates</h1>
        <Button onClick={() => { setSelected(null); setIsEditorOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> New Template
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        filterColumn="name"
        meta={{}}
      />

      {/* Create/Edit Modal */}
      <Dialog open={isEditorOpen || !!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setIsEditorOpen(false) } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selected?.id ? 'Edit Template' : 'New Template'}</DialogTitle>
            <DialogDescription>Manage template name, description, and markdown content.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="tpl-name">Name</Label>
              <Input id="tpl-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-desc">Description</Label>
              <Input id="tpl-desc" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-md">Markdown</Label>
              <Textarea id="tpl-md" value={draft.content_markdown} onChange={(e) => setDraft({ ...draft, content_markdown: e.target.value })} rows={16} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setSelected(null); setIsEditorOpen(false) }}>Cancel</Button>
              <Button onClick={() => selected?.id ? updateMutation.mutate() : createMutation.mutate()}>
                <Save className="h-4 w-4 mr-2" /> {selected?.id ? 'Save Changes' : 'Create Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Use Template Modal */}
      <Dialog open={isUseOpen} onOpenChange={setIsUseOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Use Template</DialogTitle>
            <DialogDescription>Select a Job and Area to create a form entry from this template.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Input value={selectedTemplateForUse?.name || ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Job</Label>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-auto">
                  {(jobsData || []).map((j: any) => (
                    <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Job Area</Label>
              <Select value={selectedJobAreaId} onValueChange={setSelectedJobAreaId} disabled={!selectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job area" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-auto">
                  {(selectedJob?.areas || []).map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUseOpen(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!selectedTemplateForUse?.id || !selectedJobAreaId) return
                  await formsApi.submitForm({
                    template_id: selectedTemplateForUse.id,
                    job_area_id: selectedJobAreaId,
                    rendered_markdown: (selectedTemplateForUse as any).content_markdown || '',
                    form_data: {},
                  })
                  setIsUseOpen(false)
                }}
                disabled={!selectedTemplateForUse?.id || !selectedJobAreaId}
              >
                Create Entry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


