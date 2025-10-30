"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import SignaturePad from "react-signature-pad-wrapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Upload, X, Check, FileText, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
import { replaceMarkdownFields } from "@/lib/markdown-utils"

interface FormEntryEditorProps {
  markdown: string
  submissionData: Record<string, any>
  templateName?: string
  jobs?: any[]
  workers?: any[]
  locations?: any[]
  onChange: (markdown: string, submissionData: Record<string, any>) => void
  onSave?: () => void
  onExportPDF?: () => void
  previewRef?: React.RefObject<HTMLDivElement>
}

export function FormEntryEditor({
  markdown: initialMarkdown,
  submissionData: initialSubmissionData,
  templateName = "",
  jobs = [],
  workers = [],
  locations = [],
  onChange,
  onSave,
  onExportPDF,
  previewRef: externalPreviewRef,
}: FormEntryEditorProps) {
  const internalPreviewRef = useRef<HTMLDivElement>(null)
  const previewRef = externalPreviewRef || internalPreviewRef
  const [markdown, setMarkdown] = useState(initialMarkdown)
  const [submissionData, setSubmissionData] = useState<Record<string, any>>(initialSubmissionData || {})
  const [originalMarkdown, setOriginalMarkdown] = useState(initialMarkdown)
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false)
  const [currentSignatureField, setCurrentSignatureField] = useState<string>("")
  const signaturePadRef = useRef<any>(null)
  const [signatureZoomed, setSignatureZoomed] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setOriginalMarkdown(initialMarkdown)
    setMarkdown(initialMarkdown)
    setSubmissionData(initialSubmissionData || {})
  }, [initialMarkdown, initialSubmissionData])

  // Detect template type
  const templateType = useMemo(() => {
    const md = markdown.toLowerCase()
    if (md.includes("toolbox meeting")) return "TBM"
    if (md.includes("video surveillance system") || md.includes("vss")) return "VSS"
    if (md.includes("working-at-height personnel") || md.includes("work at height personnel")) return "WAH"
    if (md.includes("permit to work at height")) return "PTW"
    return "UNKNOWN"
  }, [markdown])

  // Extract fillable fields from markdown
  const fillableFields = useMemo(() => {
    const fields: Array<{
      key: string
      label: string
      type: "text" | "date" | "time" | "select" | "checkbox" | "signature" | "image" | "worker-row"
      placeholder?: string
      options?: Array<{ value: string; label: string }>
      required?: boolean
      pattern?: RegExp
    }> = []

    // TBM fields
    if (templateType === "TBM") {
      fields.push(
        { key: "tbm_project_title", label: "Project Title", type: "select", required: true, options: jobs.map((j: any) => ({ value: j.title, label: j.job_number ? j.title + " (#" + j.job_number + ")" : j.title })) },
        { key: "tbm_date_meeting", label: "Date of Meeting", type: "date", required: true },
        { key: "tbm_time_from", label: "Time From (Hrs)", type: "time", required: true },
        { key: "tbm_time_to", label: "Time To (Hrs)", type: "time", required: true },
        // TBM Subjects (20 total)
        { key: "tbm_subject_1", label: "1. Overhead and falling object hazards", type: "checkbox" as const },
        { key: "tbm_subject_2", label: "2. Falling from height hazard", type: "checkbox" as const },
        { key: "tbm_subject_3", label: "3. Tripping & slipping hazards", type: "checkbox" as const },
        { key: "tbm_subject_4", label: "4. Cutting & laceration hazards", type: "checkbox" as const },
        { key: "tbm_subject_5", label: "5. Hazards involving corrosive substance", type: "checkbox" as const },
        { key: "tbm_subject_6", label: "6. Eye protection", type: "checkbox" as const },
        { key: "tbm_subject_7", label: "7. Respiratory protection", type: "checkbox" as const },
        { key: "tbm_subject_8", label: "8. Hearing conservation", type: "checkbox" as const },
        { key: "tbm_subject_9", label: "9. Inspection and use of personal protective equipment", type: "checkbox" as const },
        { key: "tbm_subject_10", label: "10. Chemical hazard / SDS", type: "checkbox" as const },
        { key: "tbm_subject_11", label: "11. Heat stress", type: "checkbox" as const },
        { key: "tbm_subject_12", label: "12. Electrical hazard", type: "checkbox" as const },
        { key: "tbm_subject_13", label: "13. Fire hazard", type: "checkbox" as const },
        { key: "tbm_subject_14", label: "14. Hazards involving hot works", type: "checkbox" as const },
        { key: "tbm_subject_15", label: "15. Safe operation of machinery", type: "checkbox" as const },
        { key: "tbm_subject_16", label: "16. Registration, inspection, and usage of scaffold", type: "checkbox" as const },
        { key: "tbm_subject_17", label: "17. Hazards involving lifting operation", type: "checkbox" as const },
        { key: "tbm_subject_18", label: "18. Checking and clearing of stagnant water", type: "checkbox" as const },
        { key: "tbm_subject_19", label: "19. Housekeeping", type: "checkbox" as const },
        { key: "tbm_subject_20", label: "20. Dos & Don'ts", type: "checkbox" as const },
        { key: "tbm_supervisor_name", label: "Supervisor Name", type: "text", required: true },
        { key: "tbm_supervisor_signature", label: "Supervisor Signature", type: "signature", required: true },
        { key: "tbm_supervisor_designation", label: "Supervisor Designation", type: "text", required: true },
        { key: "tbm_supervisor_date", label: "Supervisor Date", type: "date", required: true },
        ...Array.from({ length: 26 }, (_, i) => ({
          key: `tbm_employee_${i + 1}`,
          label: `Employee ${i + 1}`,
          type: "worker-row" as const,
        }))
      )
    }

    // VSS fields
    if (templateType === "VSS") {
      fields.push(
        { key: "vss_project_location", label: "Project/Location", type: "select", required: true, options: locations.map((l: any) => ({ value: l.name, label: l.name })) },
        { key: "vss_contractor", label: "Contractor", type: "text", required: true },
        { key: "vss_ptw_no", label: "PTW No", type: "text", required: true },
        { key: "vss_serial_1", label: "VSS Serial No 1", type: "text" },
        { key: "vss_serial_2", label: "VSS Serial No 2", type: "text" },
        { key: "vss_serial_3", label: "VSS Serial No 3", type: "text" },
        ...Array.from({ length: 5 }, (_, i) => ({
          key: `vss_inspection_${i + 1}`,
          label: `Inspection ${i + 1}`,
          type: "checkbox" as const,
        })),
        ...["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
          key: `vss_supervisor_signature_${day.toLowerCase()}`,
          label: `Supervisor Signature (${day})`,
          type: "signature" as const,
        }))
      )
    }

    // WAH fields
    if (templateType === "WAH") {
      fields.push(
        { key: "wah_date", label: "Date", type: "date", required: true },
        { key: "wah_location_block", label: "Location/Block", type: "select", options: locations.map((l: any) => ({ value: l.name, label: l.name })) },
        { key: "wah_wp_no", label: "WP No", type: "text" },
        ...Array.from({ length: 28 }, (_, i) => ({
          key: `wah_personnel_${i + 1}`,
          label: `Personnel ${i + 1}`,
          type: "worker-row" as const,
        })),
        { key: "wah_supervisor_name", label: "Supervisor Name", type: "text", required: true },
        { key: "wah_supervisor_signature", label: "Supervisor Signature", type: "signature", required: true },
        { key: "wah_supervisor_date", label: "Supervisor Date", type: "date", required: true }
      )
    }

    // PTW fields
    if (templateType === "PTW") {
      fields.push(
        { key: "ptw_permit_no", label: "Permit No", type: "text", required: true },
        { key: "ptw_project_title", label: "Project Title", type: "select", required: true, options: jobs.map((j: any) => ({ value: j.title, label: j.job_number ? j.title + " (#" + j.job_number + ")" : j.title })) },
        { key: "ptw_task_description", label: "Task Description", type: "text", required: true },
        { key: "ptw_location_wah", label: "Location of WAH", type: "select", required: true, options: locations.map((l: any) => ({ value: l.name, label: l.name })) },
        { key: "ptw_start_date", label: "Start Date", type: "date", required: true },
        { key: "ptw_end_date", label: "End Date", type: "date", required: true },
        { key: "ptw_num_supervisors", label: "No. of Supervisors", type: "text", required: true },
        { key: "ptw_num_workers", label: "No. of Workers", type: "text", required: true },
        ...Array.from({ length: 11 }, (_, i) => ({
          key: `ptw_control_${i + 1}`,
          label: `Control Measure ${i + 1}`,
          type: "checkbox" as const,
        })),
        // Section 1 Supervisor
        { key: "ptw_s1_name", label: "Section 1 - Name", type: "text", required: true },
        { key: "ptw_s1_signature", label: "Section 1 - Signature", type: "signature", required: true },
        { key: "ptw_s1_designation", label: "Section 1 - Designation", type: "text", required: true },
        { key: "ptw_s1_date", label: "Section 1 - Date", type: "date", required: true },
        // Section 2 Assessor
        { key: "ptw_s2_name", label: "Section 2 - Name", type: "text", required: true },
        { key: "ptw_s2_signature", label: "Section 2 - Signature", type: "signature", required: true },
        { key: "ptw_s2_designation", label: "Section 2 - Designation", type: "text", required: true },
        { key: "ptw_s2_date", label: "Section 2 - Date", type: "date", required: true },
        // Section 3 Manager
        { key: "ptw_s3_name", label: "Section 3 - Name", type: "text", required: true },
        { key: "ptw_s3_signature", label: "Section 3 - Signature", type: "signature", required: true },
        { key: "ptw_s3_designation", label: "Section 3 - Designation", type: "text", required: true },
        { key: "ptw_s3_date", label: "Section 3 - Date", type: "date", required: true },
        // Daily inspections
        ...Array.from({ length: 6 }, (_, i) => ({
          key: `ptw_daily_${i + 2}_date`,
          label: `Day ${i + 2} - Date & Time`,
          type: "text" as const,
        })),
        // Section 5 Completion
        { key: "ptw_s5_completed", label: "Task Completed", type: "checkbox" },
        { key: "ptw_s5_suspended", label: "Suspended due to expiry", type: "checkbox" },
        { key: "ptw_s5_terminated", label: "Terminated due to condition change", type: "checkbox" },
        { key: "ptw_s5_remarks", label: "Completion Remarks", type: "text" },
        { key: "ptw_s5_name", label: "Section 5 - Name", type: "text", required: true },
        { key: "ptw_s5_signature", label: "Section 5 - Signature", type: "signature", required: true },
        { key: "ptw_s5_designation", label: "Section 5 - Designation", type: "text", required: true },
        { key: "ptw_s5_date", label: "Section 5 - Date", type: "date", required: true }
      )
    }

    return fields
  }, [templateType, jobs, workers, locations])

  // Apply values to markdown with highlighting
  function applyValueToMarkdown(fieldKey: string, value: any): string {
    let updated = markdown
    const field = fillableFields.find((f) => f.key === fieldKey)
    if (!field) return updated

    // Pattern matching for different field types in markdown
    const patterns: Record<string, RegExp> = {
      tbm_project_title: /(\*\*Project Title:\*\* \|) `[^`]*`/i,
      tbm_date_meeting: /(\*\*Date of Meeting:\*\* \|) `[^`]*`/i,
      tbm_time_from: /(\*\*Time of Meeting:\*\* \| From) `[^`]*`/i,
      tbm_time_to: /(\*\*Time of Meeting:\*\* \| From .* Hrs\. To) `[^`]*`/i,
      ptw_project_title: /(\*\*Project Title\*\* \|) `[^`]*`/i,
      ptw_permit_no: /(\*\*Permit No\.\*\* \|) `[^`]*`/i,
      vss_project_location: /(\*\*Project\/ Location :\*\* \|) `[^`]*`/i,
      wah_date: /(\*\*DATE :\*\* \|) `[^`]*`/i,
    }

    if (patterns[fieldKey]) {
      const match = updated.match(patterns[fieldKey])
      if (match) {
        updated = updated.replace(patterns[fieldKey], `$1 ${value || "`____________________________`"}`)
      }
    }

    // Checkbox replacements
    if (field.type === "checkbox") {
      const checked = value ? "☑" : "☐"
      updated = updated.replace(/`☐`/g, (m, offset) => {
        // Context-aware replacement would go here
        return m
      })
    }

    // Signature replacements (insert image markdown)
    if (field.type === "signature" && value) {
      updated = updated.replace(new RegExp(`(\\*\\*${field.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\*\\*|Signature.*\\|) \`[^\`]*\``, "i"), `$1 ![${field.label}](${value})`)
    }

    setMarkdown(updated)
    onChange(updated, { ...submissionData, [fieldKey]: value })
    return updated
  }

  // Handle field changes
  function handleFieldChange(fieldKey: string, value: any) {
    const updated = { ...submissionData, [fieldKey]: value }
    setSubmissionData(updated)
    const newMarkdown = applyValueToMarkdown(fieldKey, value)
    onChange(newMarkdown, updated)
  }

  // Signature pad handlers
  function openSignaturePad(fieldKey: string) {
    setCurrentSignatureField(fieldKey)
    setSignatureDialogOpen(true)
    setTimeout(() => setSignatureZoomed(true), 100)
  }

  function saveSignature() {
    if (!signaturePadRef.current) return
    const dataURL = signaturePadRef.current.toDataURL("image/png")
    handleFieldChange(currentSignatureField, dataURL)
    setSignatureDialogOpen(false)
    setSignatureZoomed(false)
    toast.success("Signature saved")
  }

  function clearSignature() {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear()
    }
  }

  // Image upload handler
  async function handleImageUpload(fieldKey: string, file: File) {
    setImageUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await api.post("/company-documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      const imageUrl = res.data.url || res.data.cloudinary_url || res.data.secure_url
      handleFieldChange(fieldKey, imageUrl)
      toast.success("Image uploaded")
    } catch (error: any) {
      toast.error("Failed to upload image: " + (error.response?.data?.message || error.message))
    } finally {
      setImageUploading(false)
    }
  }

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = []
    fillableFields.forEach((field) => {
      if (field.required && !submissionData[field.key]) {
        errors.push(`${field.label} is required`)
      }
    })
    return errors
  }, [fillableFields, submissionData])

  // Highlight changes in markdown (green background for additions)
  const highlightedMarkdown = useMemo(() => {
    // Simple diff: compare original vs current
    // This is a simplified version - for production, use a proper diff library
    return markdown
  }, [markdown, originalMarkdown])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Fill Fields Panel */}
      <div className="lg:col-span-1 space-y-4 border rounded-lg p-4 bg-muted/30 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Fill Fields</h3>
          <Badge variant="outline">{templateType}</Badge>
        </div>

        {fillableFields.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label className="text-xs">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
              {submissionData[field.key] && <Check className="inline-block w-3 h-3 text-green-600 ml-1" />}
            </Label>

            {field.type === "text" && (
              <Input
                value={submissionData[field.key] || ""}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                className={submissionData[field.key] ? "bg-green-50 border-green-300" : ""}
              />
            )}

            {field.type === "date" && (
              <Input
                type="date"
                value={submissionData[field.key] || ""}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                className={submissionData[field.key] ? "bg-green-50 border-green-300" : ""}
              />
            )}

            {field.type === "time" && (
              <Input
                type="time"
                value={submissionData[field.key] || ""}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                className={submissionData[field.key] ? "bg-green-50 border-green-300" : ""}
              />
            )}

            {field.type === "select" && field.options && (
              <Select
                value={submissionData[field.key] || ""}
                onValueChange={(value) => handleFieldChange(field.key, value)}
              >
                <SelectTrigger className={submissionData[field.key] ? "bg-green-50 border-green-300" : ""}>
                  <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.type === "checkbox" && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={!!submissionData[field.key]}
                  onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
                />
                <span className="text-sm">{field.label}</span>
              </div>
            )}

            {field.type === "signature" && (
              <div className="space-y-2">
                {submissionData[field.key] ? (
                  <div className="relative">
                    <img src={submissionData[field.key]} alt="Signature" className="border rounded h-20 object-contain" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-0 right-0"
                      onClick={() => openSignaturePad(field.key)}
                    >
                      <FileText className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => openSignaturePad(field.key)} className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Sign Here
                  </Button>
                )}
              </div>
            )}

            {field.type === "image" && (
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(field.key, file)
                  }}
                  disabled={imageUploading}
                />
                {submissionData[field.key] && (
                  <img src={submissionData[field.key]} alt="Uploaded" className="border rounded h-20 object-contain" />
                )}
              </div>
            )}

            {field.type === "worker-row" && (
              <div className="space-y-2 border rounded p-2">
                <Select
                  value={submissionData[`${field.key}_worker_id`] || ""}
                  onValueChange={(value) => {
                    const worker = workers.find((w: any) => w.id === value)
                    handleFieldChange(`${field.key}_worker_id`, value)
                    handleFieldChange(`${field.key}_name`, worker?.full_name || "")
                    handleFieldChange(`${field.key}_nric`, worker?.nric || worker?.work_permit_no || "")
                    handleFieldChange(`${field.key}_company`, worker?.company || "")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select worker" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((w: any) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.full_name} {w.work_permit_no ? `(${w.work_permit_no.slice(-4)})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {submissionData[`${field.key}_name`] && (
                  <div className="text-xs text-muted-foreground">
                    {submissionData[`${field.key}_name`]} | {submissionData[`${field.key}_nric`] || "N/A"}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {validationErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm font-medium text-red-800">Required fields missing:</p>
            <ul className="text-xs text-red-600 mt-1 list-disc list-inside">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>)}
        )}
      </div>

      {/* Live Preview */}
      <div className="lg:col-span-2 space-y-4">
        <div ref={previewRef} className="border rounded-lg p-4 bg-white min-h-[600px] max-h-[80vh] overflow-y-auto">
          <div className="prose max-w-none prose-sm md:prose-base">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ children, ...props }) => (
                  <table {...props} className="border-collapse border border-gray-900 w-full mb-4" style={{ fontSize: '0.875rem' }}>
                    {children}
                  </table>
                ),
                thead: ({ children, ...props }) => (
                  <thead {...props} className="bg-gray-100">
                    {children}
                  </thead>
                ),
                tbody: ({ children, ...props }) => (
                  <tbody {...props}>
                    {children}
                  </tbody>
                ),
                tr: ({ children, ...props }) => (
                  <tr {...props} className="border-b border-gray-900">
                    {children}
                  </tr>
                ),
                th: ({ children, ...props }) => (
                  <th {...props} className="border border-gray-900 px-2 py-1 text-left font-bold bg-gray-100">
                    {children}
                  </th>
                ),
                td: ({ children, ...props }) => {
                  const content = String(children)
                  const isFilled = !content.includes("`___`") && !content.includes("`____________________________`") && !content.match(/`\s*`/)
                  const isEmpty = content.match(/`[_\s]{4,}`/)
                  return (
                    <td
                      {...props}
                      className={`border border-gray-900 px-2 py-1 ${isFilled && !isEmpty ? "bg-green-50" : isEmpty ? "bg-yellow-50" : ""}`}
                    >
                      {children}
                    </td>
                  )
                },
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {onExportPDF && (
            <Button variant="outline" onClick={onExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          )}
          {onSave && (
            <Button onClick={onSave} disabled={validationErrors.length > 0}>
              <Check className="w-4 h-4 mr-2" />
              Save {validationErrors.length > 0 && `(${validationErrors.length} errors)`}
            </Button>
          )}
        </div>
      </div>

      {/* Signature Dialog */}
      <Dialog open={signatureDialogOpen} onOpenChange={(open) => {
        setSignatureDialogOpen(open)
        if (!open) setSignatureZoomed(false)
      }}>
        <DialogContent className={`max-w-2xl transition-all duration-300 ${signatureZoomed ? "max-w-4xl" : ""}`}>
          <DialogHeader>
            <DialogTitle>Sign: {fillableFields.find((f) => f.key === currentSignatureField)?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className={`border rounded-lg p-4 bg-white transition-all duration-300 ${signatureZoomed ? "min-h-[400px]" : "min-h-[200px]"}`}>
              <SignaturePad ref={signaturePadRef} options={{ backgroundColor: "rgb(255, 255, 255)", penColor: "rgb(0, 0, 0)" }} />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={clearSignature}>
                Clear
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSignatureDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveSignature}>Save Signature</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

