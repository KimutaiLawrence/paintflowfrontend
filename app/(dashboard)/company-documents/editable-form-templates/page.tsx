"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { formsApi, jobsApi, workersApi, locationsApi } from "@/lib/api"
import { DataTable } from "@/components/shared/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useMemo, useState, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { FormEntryEditor } from "@/components/forms/form-entry-editor"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { useToast } from "@/hooks/use-toast"
import { ChevronDown, ChevronUp, FileCode } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

type SubmissionRow = {
  id: string
  template_name: string
  job_area_name: string
  submitted_by: string
  submitted_at: string
}

export default function EditableFormTemplatesPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [currentId, setCurrentId] = useState<string>("")
  const [markdown, setMarkdown] = useState<string>("")
  const [originalMarkdown, setOriginalMarkdown] = useState<string>("")
  const [submissionData, setSubmissionData] = useState<Record<string, any>>({})
  const [showMarkdownEditor, setShowMarkdownEditor] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const { data: jobs } = useQuery({
    queryKey: ["jobs", "entries-editor"],
    queryFn: async () => {
      const res: any = await jobsApi.getJobs({ page: 1, per_page: 100 })
      return res.data || []
    },
  })

  const { data: workers } = useQuery({
    queryKey: ["workers", "entries-editor"],
    queryFn: async () => {
      const res: any = await workersApi.getWorkers({})
      return res.data || res || []
    },
  })

  const { data: locations } = useQuery({
    queryKey: ["locations", "entries-editor"],
    queryFn: async () => {
      const res: any = await locationsApi.getLocations({ page: 1, per_page: 100 })
      return res.data || []
    },
  })

  const { data } = useQuery({
    queryKey: ["formSubmissions"],
    queryFn: async () => {
      const res = await formsApi.listSubmissions()
      return (res.submissions || []) as SubmissionRow[]
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => formsApi.updateSubmission(currentId, { rendered_markdown: markdown, submission_data: submissionData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formSubmissions"] })
      toast.success("Entry saved successfully")
      setOpen(false)
    },
    onError: (error: any) => {
      toast.error("Failed to save: " + (error.response?.data?.message || error.message))
    },
  })

  // GitHub-style diff highlighting for markdown changes
  const markdownLines = useMemo(() => {
    if (!showMarkdownEditor || !originalMarkdown) return []
    const lines = markdown.split("\n")
    const originalLines = originalMarkdown.split("\n")
    const maxLines = Math.max(lines.length, originalLines.length)

    return Array.from({ length: maxLines }, (_, i) => {
      const currentLine = lines[i] || ""
      const originalLine = originalLines[i] || ""
      
      if (currentLine === originalLine) {
        return { line: currentLine, type: "unchanged" as const, hasChanges: false }
      } else if (!originalLine && currentLine) {
        return { line: currentLine, type: "added" as const, hasChanges: true }
      } else {
        return { line: currentLine, type: "modified" as const, hasChanges: true }
      }
    })
  }, [markdown, originalMarkdown, showMarkdownEditor])

  // Export to PDF
  async function handleExportPDF() {
    if (!previewRef.current) {
      toast.error("Preview not available")
      return
    }

    try {
      toast.success("Generating PDF...")
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`form-entry-${currentId}.pdf`)
      toast.success("PDF exported successfully")
    } catch (error: any) {
      toast.error("Failed to export PDF: " + error.message)
    }
  }

  const columns: ColumnDef<SubmissionRow>[] = [
    { accessorKey: "template_name", header: "Template" },
    { accessorKey: "job_area_name", header: "Job Area" },
    { accessorKey: "submitted_by", header: "Submitted By" },
    { accessorKey: "submitted_at", header: "Submitted At" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const s: any = await formsApi.getSubmission(row.original.id)
              setCurrentId(row.original.id)
              const rendered = s.rendered_markdown || s.template_content_markdown || ""
              setMarkdown(rendered)
              setOriginalMarkdown(rendered)
              setSubmissionData(s.form_data || s.submission_data || {})
              setShowMarkdownEditor(false)
              setOpen(true)
            }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Form Entries</h1>
      <DataTable columns={columns} data={data || []} filterColumn="template_name" meta={{}} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Edit Form Entry</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6">
            {/* Always visible: Fill Fields + Live Preview */}
            <div className="flex-1 overflow-hidden">
              <FormEntryEditor
                markdown={markdown}
                submissionData={submissionData}
                jobs={jobs || []}
                workers={workers || []}
                locations={locations || []}
                onChange={(newMarkdown, newData) => {
                  setMarkdown(newMarkdown)
                  setSubmissionData(newData)
                }}
                onSave={() => updateMutation.mutate()}
                onExportPDF={handleExportPDF}
                previewRef={previewRef}
              />
            </div>

            {/* Toggleable Markdown Editor with GitHub-style highlighting */}
            <Collapsible open={showMarkdownEditor} onOpenChange={setShowMarkdownEditor} className="mt-4 border-t pt-4">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    Markdown Editor
                  </span>
                  {showMarkdownEditor ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 text-sm font-medium">Markdown Editor</div>
                  <div className="relative">
                    <Textarea
                      value={markdown}
                      onChange={(e) => setMarkdown(e.target.value)}
                      className="min-h-[400px] max-h-[500px] font-mono text-sm resize-none border-0 rounded-none"
                      style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}
                    />
                    {/* GitHub-style diff overlay */}
                    {showMarkdownEditor && markdownLines.length > 0 && (
                      <div
                        className="absolute inset-0 pointer-events-none font-mono text-sm overflow-auto rounded-b-lg"
                        style={{
                          lineHeight: "1.6",
                          padding: "0.75rem",
                        }}
                      >
                        <div style={{ color: "transparent" }}>
                          {markdownLines.map((item, idx) => {
                            const bgColor = item.hasChanges ? (item.type === "added" ? "#d1fae5" : "#fef3c7") : "transparent"
                            const textColor = item.hasChanges ? (item.type === "added" ? "#065f46" : "#92400e") : "transparent"
                            return (
                              <div
                                key={idx}
                                style={{
                                  backgroundColor: bgColor,
                                  color: textColor,
                                  display: "block",
                                  minHeight: "1.6em",
                                  padding: "0 0.25rem",
                                  marginLeft: "-0.25rem",
                                  marginRight: "-0.25rem",
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                }}
                              >
                                {item.line || " "}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <div className="flex justify-end gap-2 pt-3 px-6 pb-6 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportPDF} variant="outline">
              Export PDF
            </Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
