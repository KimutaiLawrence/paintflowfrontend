"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { jobsApi, JobDetail, sitePhotosApi, jobSafetyDocsApi, jobInspectionsApi, companyDocumentsApi, documentCategoriesApi, jobFloorPlansApi, floorPlanTemplatesApi, jobEditableDocsApi, type SitePhoto, type JobSafetyDocument, type JobInspection } from "@/lib/api"
import { usePreferences } from "@/hooks/use-preferences"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Trash2, Briefcase, MapPin, Flag, Calendar, ListChecks, Shield, Search, TrendingUp, FileText, Upload, Download, Eye, X, Plus } from "lucide-react"
import { PageLoader } from "@/components/ui/custom-loader"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ButtonLoader } from "@/components/ui/custom-loader"
import { PDFEditor } from "@/components/pdf-editor"

const priorityStyles: { [key: string]: string } = {
  P1: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
  P2: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
  P3: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
}

// Helper function to format status
const formatStatus = (status: any): string => {
  if (!status) return 'Pending'
  if (typeof status === 'string') {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  return String(status)
}

// Helper function to get status color
const getStatusColor = (status: any): string => {
  if (!status) return "bg-gray-100 text-gray-800 border-gray-200"
  const statusStr = String(status).toLowerCase()
  
  if (statusStr.includes('completed') || statusStr.includes('done')) {
    return "bg-green-200 text-green-900 border-green-300 font-bold"
  }
  if (statusStr.includes('pending')) {
    return "bg-yellow-200 text-yellow-900 border-yellow-300 font-bold"
  }
  if (statusStr.includes('left')) {
    return "bg-orange-200 text-orange-900 border-orange-300 font-bold"
  }
  return "bg-gray-100 text-gray-800 border-gray-200"
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [isConfirmOpen, setConfirmOpen] = useState(false)
  const { preferences } = usePreferences()
  
  // Tab-specific state
  const [showSitePhotoDialog, setShowSitePhotoDialog] = useState(false)
  const [showSafetyDocDialog, setShowSafetyDocDialog] = useState(false)
  const [showInspectionDialog, setShowInspectionDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [photoStage, setPhotoStage] = useState<string>("survey")
  const [safetyDocType, setSafetyDocType] = useState<string>("")
  const [selectedCompanyDoc, setSelectedCompanyDoc] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  
  // Floor plan state
  const [showFloorPlanDialog, setShowFloorPlanDialog] = useState(false)
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<string>("")
  
  // Document editor state
  const [showDocumentEditor, setShowDocumentEditor] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [signatureData, setSignatureData] = useState<string>("")
  const [showPDFEditor, setShowPDFEditor] = useState(false)

  const { data: job, isLoading, error } = useQuery<JobDetail>({
    queryKey: ["job", jobId],
    queryFn: () => jobsApi.getJob(jobId),
    enabled: !!jobId,
  })

  // Tab-specific data queries
  const { data: sitePhotos, isLoading: sitePhotosLoading } = useQuery<SitePhoto[]>({
    queryKey: ["site-photos", jobId],
    queryFn: async () => {
      try {
        return await sitePhotosApi.getSitePhotos(jobId)
      } catch (error: any) {
        console.error("Error fetching site photos:", error)
        return []
      }
    },
    enabled: !!jobId,
    retry: false,
  })

  const { data: safetyDocuments, isLoading: safetyDocsLoading } = useQuery<JobSafetyDocument[]>({
    queryKey: ["safety-docs", jobId],
    queryFn: async () => {
      try {
        return await jobSafetyDocsApi.getSafetyDocuments(jobId)
      } catch (error: any) {
        console.error("Error fetching safety documents:", error)
        return []
      }
    },
    enabled: !!jobId,
    retry: false,
  })

  const { data: inspection, isLoading: inspectionLoading } = useQuery<JobInspection | null>({
    queryKey: ["inspection", jobId],
    queryFn: async () => {
      try {
        return await jobInspectionsApi.getInspection(jobId)
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null
        }
        throw error
      }
    },
    enabled: !!jobId,
    retry: false,
  })

  const { data: companyDocuments } = useQuery({
    queryKey: ["company-documents"],
    queryFn: () => companyDocumentsApi.getDocuments(),
  })

  const { data: categories } = useQuery({
    queryKey: ["document-categories"],
    queryFn: documentCategoriesApi.getCategories,
  })

  // Sort categories to prioritize required safety documents
  const sortedCategories = React.useMemo(() => {
    if (!categories) return []
    
    const userOrder = preferences.safety_documents_order || ['PTW', 'TBM', 'WAH', 'VSS']
    const priorityCategories: any[] = []
    const otherCategories: any[] = []
    
    categories.forEach((category: any) => {
      if (userOrder.includes(category.code)) {
        priorityCategories.push(category)
      } else {
        otherCategories.push(category)
      }
    })
    
    // Sort priority categories by user-defined order
    priorityCategories.sort((a, b) => {
      return userOrder.indexOf(a.code) - userOrder.indexOf(b.code)
    })
    
    // Sort other categories alphabetically
    otherCategories.sort((a, b) => a.name.localeCompare(b.name))
    
    return [...priorityCategories, ...otherCategories]
  }, [categories, preferences.safety_documents_order])

  // Sort company documents to prioritize required safety documents
  const sortedCompanyDocuments = React.useMemo(() => {
    if (!companyDocuments) return []
    
    const userOrder = preferences.safety_documents_order || ['PTW', 'TBM', 'WAH', 'VSS']
    const priorityDocs: any[] = []
    const otherDocs: any[] = []
    
    companyDocuments.forEach((doc: any) => {
      if (userOrder.includes(doc.category)) {
        priorityDocs.push(doc)
      } else {
        otherDocs.push(doc)
      }
    })
    
    // Sort priority documents by user-defined order, then by name
    priorityDocs.sort((a, b) => {
      const categoryOrder = userOrder.indexOf(a.category) - userOrder.indexOf(b.category)
      if (categoryOrder !== 0) return categoryOrder
      return a.name.localeCompare(b.name)
    })
    
    // Sort other documents alphabetically by name
    otherDocs.sort((a, b) => a.name.localeCompare(b.name))
    
    return [...priorityDocs, ...otherDocs]
  }, [companyDocuments, preferences.safety_documents_order])

  const { data: floorPlanTemplates } = useQuery({
    queryKey: ["floor-plan-templates"],
    queryFn: () => floorPlanTemplatesApi.getFloorPlanTemplates(),
  })

  const { data: jobFloorPlan } = useQuery({
    queryKey: ["job-floor-plan", jobId],
    queryFn: () => jobFloorPlansApi.getFloorPlan(jobId),
    enabled: !!jobId,
  })

  const { data: editableDocuments } = useQuery({
    queryKey: ["editable-documents", jobId],
    queryFn: () => jobEditableDocsApi.getEditableDocuments(jobId),
    enabled: !!jobId,
  })

  const deleteMutation = useMutation({
    mutationFn: () => jobsApi.deleteJob(jobId),
    onSuccess: () => {
      toast.success("Job deleted successfully.")
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      router.push("/jobs")
    },
    onError: (error: any) => {
      toast.error("Failed to delete job.", { description: error.message })
    },
  })

  // Site photo upload mutation
  const uploadSitePhotoMutation = useMutation({
    mutationFn: ({ file, stage }: { file: File; stage: string }) => 
      sitePhotosApi.uploadSitePhoto(jobId, file, stage),
    onSuccess: () => {
      toast.success("Site photo uploaded successfully.")
      queryClient.invalidateQueries({ queryKey: ["site-photos", jobId] })
      queryClient.invalidateQueries({ queryKey: ["job", jobId] })
      setShowSitePhotoDialog(false)
      setSelectedFile(null)
    },
    onError: (error: any) => {
      toast.error("Failed to upload site photo.", error.response?.data?.message || error.message)
    },
  })

  // Safety document attachment mutation
  const attachSafetyDocMutation = useMutation({
    mutationFn: ({ docType, companyDocId }: { docType: string; companyDocId?: string }) => 
      jobSafetyDocsApi.attachSafetyDocument(jobId, { document_type: docType, company_doc_id: companyDocId }),
    onSuccess: () => {
      toast.success("Safety document attached successfully.")
      queryClient.invalidateQueries({ queryKey: ["safety-docs", jobId] })
      setShowSafetyDocDialog(false)
    },
    onError: (error: any) => {
      toast.error("Failed to attach safety document.", error.response?.data?.message || error.message)
    },
  })

  // Safety document deletion mutation
  const deleteSafetyDocMutation = useMutation({
    mutationFn: (docId: string) => jobSafetyDocsApi.deleteSafetyDocument(jobId, docId),
    onSuccess: () => {
      toast.success("Safety document removed successfully.")
      queryClient.invalidateQueries({ queryKey: ["safety-docs", jobId] })
    },
    onError: (error: any) => {
      toast.error("Failed to remove safety document.", error.response?.data?.message || error.message)
    },
  })

  // Floor plan mutations
  const attachFloorPlanMutation = useMutation({
    mutationFn: (floorPlanId: string) => jobFloorPlansApi.attachFloorPlan(jobId, floorPlanId),
    onSuccess: () => {
      toast.success("Floor plan attached successfully.")
      queryClient.invalidateQueries({ queryKey: ["job-floor-plan", jobId] })
      queryClient.invalidateQueries({ queryKey: ["job", jobId] })
      setShowFloorPlanDialog(false)
    },
    onError: (error: any) => {
      toast.error("Failed to attach floor plan.", error.response?.data?.message || error.message)
    },
  })

  const removeFloorPlanMutation = useMutation({
    mutationFn: () => jobFloorPlansApi.removeFloorPlan(jobId),
    onSuccess: () => {
      toast.success("Floor plan removed successfully.")
      queryClient.invalidateQueries({ queryKey: ["job-floor-plan", jobId] })
      queryClient.invalidateQueries({ queryKey: ["job", jobId] })
    },
    onError: (error: any) => {
      toast.error("Failed to remove floor plan.", error.response?.data?.message || error.message)
    },
  })

  // Inspection save mutation
  const saveInspectionMutation = useMutation({
    mutationFn: (data: { inspection_date: string; inspector_name: string; inspection_notes?: string }) => 
      jobInspectionsApi.saveInspection(jobId, data),
    onSuccess: () => {
      toast.success("Inspection data saved successfully.")
      queryClient.invalidateQueries({ queryKey: ["inspection", jobId] })
      setShowInspectionDialog(false)
    },
    onError: (error: any) => {
      toast.error("Failed to save inspection data.", error.response?.data?.message || error.message)
    },
  })

  // Editable documents mutations
  const createEditableDocMutation = useMutation({
    mutationFn: (originalDocumentId: string) => jobEditableDocsApi.createEditableDocument(jobId, originalDocumentId),
    onSuccess: () => {
      toast.success("Editable document created successfully.")
      queryClient.invalidateQueries({ queryKey: ["editable-documents", jobId] })
      setSelectedCompanyDoc("")
    },
    onError: (error: any) => {
      toast.error("Failed to create editable document.", error.response?.data?.message || error.message)
    },
  })

  const deleteEditableDocMutation = useMutation({
    mutationFn: (docId: string) => jobEditableDocsApi.deleteEditableDocument(docId),
    onSuccess: () => {
      toast.success("Editable document deleted successfully.")
      queryClient.invalidateQueries({ queryKey: ["editable-documents", jobId] })
    },
    onError: (error: any) => {
      toast.error("Failed to delete editable document.", error.response?.data?.message || error.message)
    },
  })

  // Handler functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleSitePhotoUpload = () => {
    if (selectedFile && photoStage) {
      uploadSitePhotoMutation.mutate({ file: selectedFile, stage: photoStage })
    }
  }

  const handleAttachSafetyDoc = () => {
    if (safetyDocType) {
      attachSafetyDocMutation.mutate({ 
        docType: safetyDocType, 
        companyDocId: selectedCompanyDoc || undefined 
      })
    }
  }

  const handleDocumentTypeChange = (value: string) => {
    setSafetyDocType(value)
    setSelectedCompanyDoc("") // Clear selected company doc when type changes
  }

  const handleDeleteSafetyDoc = (docId: string) => {
    deleteSafetyDocMutation.mutate(docId)
  }

  const handleAttachFloorPlan = () => {
    if (selectedFloorPlan) {
      attachFloorPlanMutation.mutate(selectedFloorPlan)
    }
  }

  const handleRemoveFloorPlan = () => {
    removeFloorPlanMutation.mutate()
  }

  const handleSaveInspection = (data: { inspection_date: string; inspector_name: string; inspection_notes?: string }) => {
    saveInspectionMutation.mutate(data)
  }

  if (isLoading) {
    return <PageLoader className="h-64" />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">Job Not Found</h1>
        <p className="text-muted-foreground">The job you are looking for does not exist.</p>
        <Link href="/jobs">
          <Button className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete the job and all its data."
        isLoading={deleteMutation.isPending}
      />
      <div className="w-full space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/jobs">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{job?.title}</h1>
              <p className="text-muted-foreground">Job #{job?.job_number}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href={`/jobs/${jobId}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
            <Button variant="destructive" onClick={() => setConfirmOpen(true)} className="w-full sm:w-auto">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        <Separator />

        {/* 4-Tab Structure as requested by client */}
        <Tabs defaultValue="safety" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="safety" className="flex items-center gap-2 text-xs md:text-sm">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Safety Documents</span>
              <span className="sm:hidden">Safety</span>
            </TabsTrigger>
            <TabsTrigger value="inspection" className="flex items-center gap-2 text-xs md:text-sm">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Inspection</span>
              <span className="sm:hidden">Inspect</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2 text-xs md:text-sm">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Progress</span>
              <span className="sm:hidden">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="completion" className="flex items-center gap-2 text-xs md:text-sm">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Completion Report</span>
              <span className="sm:hidden">Complete</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Safety Documents */}
          <TabsContent value="safety" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Safety Documents
                </CardTitle>
                <CardDescription>
                  Daily safety submissions and reference documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Attached Safety Documents */}
                {safetyDocuments && safetyDocuments.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Attached Safety Documents</h4>
                    <div className="grid gap-2">
                      {safetyDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{doc.title}</p>
                              <p className="text-sm text-muted-foreground truncate">{doc.document_type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {doc.cloudinary_url && (
                              <>
                            <Button variant="outline" size="sm" asChild>
                                  <a href={doc.cloudinary_url} target="_blank" rel="noopener noreferrer" title="View document">
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                  <a href={doc.cloudinary_url} download title="Download document">
                                <Download className="h-4 w-4" />
                              </a>
                                </Button>
                              </>
                            )}
                            <Button variant="outline" size="sm" title="Edit document">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteSafetyDoc(doc.id)}
                              disabled={deleteSafetyDocMutation.isPending}
                              title="Remove document"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Attach from Company Documents</h4>
                    <p className="text-sm text-muted-foreground">
                      Select from existing company safety documents
                    </p>
                    <Dialog open={showSafetyDocDialog} onOpenChange={setShowSafetyDocDialog}>
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Attach Safety Document
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Attach Safety Document</DialogTitle>
                          <DialogDescription>
                            Select a document type and optionally choose from company documents.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="doc-type">Document Type *</Label>
                            <Select value={safetyDocType} onValueChange={handleDocumentTypeChange}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select document type" />
                              </SelectTrigger>
                              <SelectContent className="max-h-48 overflow-y-auto">
                                {sortedCategories?.map((category: any) => {
                                  const isPriority = ['PTW', 'TBM', 'WAH', 'VSS'].includes(category.code)
                                  return (
                                    <SelectItem key={category.id} value={category.code}>
                                      <div className="flex items-center space-x-2 py-1">
                                        <div 
                                          className="w-2 h-2 rounded-full flex-shrink-0" 
                                          style={{ backgroundColor: category.color || '#3B82F6' }}
                                        />
                                        <span className="truncate">{category.code} - {category.name}</span>
                                        {isPriority && (
                                          <Badge variant="secondary" className="text-xs px-1 py-0 ml-1">
                                            Required
                                          </Badge>
                                        )}
                                      </div>
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="company-doc">Company Document (Optional)</Label>
                            <Select value={selectedCompanyDoc} onValueChange={setSelectedCompanyDoc}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select from company documents" />
                              </SelectTrigger>
                              <SelectContent className="max-h-48 overflow-y-auto">
                                {sortedCompanyDocuments
                                  ?.filter((doc: any) => !safetyDocType || doc.category === safetyDocType)
                                  ?.map((doc: any) => {
                                    const isPriority = ['PTW', 'TBM', 'WAH', 'VSS'].includes(doc.category)
                                    return (
                                      <SelectItem key={doc.id} value={doc.id}>
                                        <div className="flex flex-col py-1 max-w-xs">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium truncate">{doc.name}</span>
                                            {isPriority && (
                                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                                Required
                                              </Badge>
                                            )}
                                          </div>
                                          <span className="text-sm text-muted-foreground truncate">{doc.category} - {doc.description}</span>
                                        </div>
                                      </SelectItem>
                                    )
                                  })}
                                {(!sortedCompanyDocuments || sortedCompanyDocuments.filter((doc: any) => !safetyDocType || doc.category === safetyDocType).length === 0) && (
                                  <div className="p-2 text-sm text-muted-foreground">
                                    {safetyDocType ? `No documents found for category ${safetyDocType}` : "No company documents available"}
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setShowSafetyDocDialog(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleAttachSafetyDoc}
                              disabled={!safetyDocType || attachSafetyDocMutation.isPending}
                            >
                              {attachSafetyDocMutation.isPending && <ButtonLoader className="mr-2" />}
                              Attach Document
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Inspection */}
          <TabsContent value="inspection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Site Inspection
                </CardTitle>
                <CardDescription>
                  Inspection forms, floor plan drawings, and site photos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Job Floor Plan Section */}
                <div className="space-y-3">
                  <h4 className="font-medium">Job Floor Plan</h4>
                  {jobFloorPlan ? (
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{jobFloorPlan.name}</p>
                            <p className="text-sm text-muted-foreground">{jobFloorPlan.category} - {jobFloorPlan.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={jobFloorPlan.job_floor_plan_url || jobFloorPlan.image_url} target="_blank" rel="noopener noreferrer" title="View floor plan">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={jobFloorPlan.job_floor_plan_url || jobFloorPlan.image_url} download title="Download floor plan">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleRemoveFloorPlan}
                            disabled={removeFloorPlanMutation.isPending}
                            title="Remove floor plan"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border rounded-lg bg-muted/20">
                      <p className="text-sm text-muted-foreground mb-3">No floor plan attached to this job</p>
                      <Dialog open={showFloorPlanDialog} onOpenChange={setShowFloorPlanDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Attach Floor Plan
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Attach Floor Plan</DialogTitle>
                            <DialogDescription>
                              Select a floor plan template to attach to this job.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="floor-plan">Floor Plan Template *</Label>
                              <Select value={selectedFloorPlan} onValueChange={setSelectedFloorPlan}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select floor plan template" />
                                </SelectTrigger>
                                <SelectContent className="max-h-48 overflow-y-auto">
                                  {floorPlanTemplates?.data?.map((template: any) => (
                                    <SelectItem key={template.id} value={template.id}>
                                      <div className="flex flex-col py-1 max-w-xs">
                                        <span className="font-medium truncate">{template.name}</span>
                                        <span className="text-sm text-muted-foreground truncate">{template.category} - {template.description}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                              <Button variant="outline" onClick={() => setShowFloorPlanDialog(false)}>
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleAttachFloorPlan}
                                disabled={!selectedFloorPlan || attachFloorPlanMutation.isPending}
                              >
                                {attachFloorPlanMutation.isPending && <ButtonLoader className="mr-2" />}
                                Attach Floor Plan
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>

                {/* Inspection Data Display */}
                {inspection && (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-medium">Inspection Details</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Inspector:</span> {inspection.inspector_name}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {new Date(inspection.inspection_date).toLocaleDateString()}
                      </div>
                      {inspection.inspection_notes && (
                        <div className="md:col-span-2">
                          <span className="font-medium">Notes:</span> {inspection.inspection_notes}
                        </div>
                      )}
                    </div>
                    {inspection.floor_plan_url && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={inspection.floor_plan_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4 mr-2" />
                            View Inspection Floor Plan
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={inspection.floor_plan_url} download>
                            <Download className="h-4 w-4 mr-2" />
                            Download Inspection Floor Plan
                          </a>
                        </Button>
                      </div>
                    )}
                    {inspection.inspection_form_url && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={inspection.inspection_form_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4 mr-2" />
                            View Inspection Form
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={inspection.inspection_form_url} download>
                            <Download className="h-4 w-4 mr-2" />
                            Download Form
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Site Photos by Stage */}
                {sitePhotos && sitePhotos.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Site Photos by Stage</h4>
                    <div className="grid gap-3">
                      {['survey', 'repair', 'primer', 'ultra', 'topcoat', 'completion'].map((stage) => {
                        const stagePhotos = sitePhotos.filter(photo => photo.photo_stage === stage)
                        if (stagePhotos.length === 0) return null
                        
                        return (
                          <div key={stage} className="space-y-2">
                            <h5 className="text-sm font-medium capitalize">{stage} Photos ({stagePhotos.length})</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {stagePhotos.map((photo) => (
                                <div key={photo.id} className="relative group">
                                  <img 
                                    src={photo.cloudinary_url} 
                                    alt={photo.original_file_name}
                                    className="w-full h-20 object-cover rounded border"
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={photo.cloudinary_url} target="_blank" rel="noopener noreferrer">
                                        <Eye className="h-3 w-3" />
                                      </a>
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={photo.cloudinary_url} download>
                                        <Download className="h-3 w-3" />
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Inspection Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Record inspection details and upload forms
                    </p>
                    <Dialog open={showInspectionDialog} onOpenChange={setShowInspectionDialog}>
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          {inspection ? 'Update Inspection' : 'Record Inspection'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{inspection ? 'Update' : 'Record'} Inspection</DialogTitle>
                          <DialogDescription>
                            Record inspection details for this job.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 max-h-[80vh] overflow-y-auto">
                          <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="inspector-name">Inspector Name</Label>
                            <Input 
                              id="inspector-name"
                              placeholder="Enter inspector name"
                              defaultValue={inspection?.inspector_name || ''}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="inspection-date">Inspection Date</Label>
                            <Input 
                              id="inspection-date"
                              type="datetime-local"
                              defaultValue={inspection?.inspection_date ? new Date(inspection.inspection_date).toISOString().slice(0, 16) : ''}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="inspection-notes">Inspection Notes</Label>
                            <Textarea 
                              id="inspection-notes"
                              placeholder="Enter inspection notes..."
                              defaultValue={inspection?.inspection_notes || ''}
                              rows={3}
                            />
                          </div>
                          </div>

                          {/* Interactive Company Documents Section */}
                          <div className="space-y-4 border-t pt-4">
                            <div className="space-y-2">
                              <Label>Interactive Company Documents</Label>
                              <p className="text-sm text-muted-foreground">
                                Create and manage editable copies of company documents for this inspection
                              </p>
                            </div>

                            {/* Show existing editable documents first */}
                            {(editableDocuments?.data && editableDocuments.data.length > 0) || (editableDocuments && Array.isArray(editableDocuments) && editableDocuments.length > 0) ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Existing Editable Documents</Label>
                                  <Badge variant="outline" className="text-xs">
                                    {(editableDocuments.data || editableDocuments).length} document{(editableDocuments.data || editableDocuments).length !== 1 ? 's' : ''}
                                  </Badge>
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                                  {(editableDocuments.data || editableDocuments).map((doc: any) => (
                                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                                      <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                        <div className="flex-1">
                                          <p className="text-sm font-medium">{doc.document_name}</p>
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{doc.original_file_name}</span>
                                            <span>•</span>
                                            <span className={doc.is_signed ? 'text-green-600' : 'text-orange-600'}>
                                              {doc.is_signed ? 'Signed' : 'Not signed'}
                                            </span>
                                            <span>•</span>
                                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            console.log('Opening PDF editor for document:', doc)
                                            setSelectedDocument(doc)
                                            setShowPDFEditor(true)
                                          }}
                                          title="View/Edit Document"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            // TODO: Open signature dialog
                                            toast.info("Signature functionality coming soon!")
                                          }}
                                          title="Add Signature"
                                          disabled={doc.is_signed}
                                        >
                                          <FileText className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            deleteEditableDocMutation.mutate(doc.id)
                                          }}
                                          disabled={deleteEditableDocMutation.isPending}
                                          title="Delete Document"
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {/* Add new document section */}
                            <div className="space-y-3 border-t pt-3">
                              <Label className="text-sm font-medium">Add New Editable Document</Label>
                            
                            {/* Company Documents Selection */}
                            <div className="space-y-2">
                              <Label htmlFor="company-document">Select Document</Label>
                              <Select value={selectedCompanyDoc} onValueChange={setSelectedCompanyDoc}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a company document" />
                                </SelectTrigger>
                                <SelectContent className="max-h-48 overflow-y-auto">
                                  {companyDocuments?.map((doc: any) => (
                                    <SelectItem key={doc.id} value={doc.id}>
                                      <div className="flex flex-col py-1 max-w-xs">
                                        <span className="font-medium truncate">{doc.name}</span>
                                        <span className="text-sm text-muted-foreground truncate">{doc.category} - {doc.description}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Create Editable Document Button */}
                            {selectedCompanyDoc && (
                              <Button 
                                onClick={() => {
                                  if (selectedCompanyDoc) {
                                    createEditableDocMutation.mutate(selectedCompanyDoc)
                                  }
                                }}
                                disabled={createEditableDocMutation.isPending}
                                className="w-full"
                              >
                                {createEditableDocMutation.isPending && <ButtonLoader className="mr-2" />}
                                <FileText className="h-4 w-4 mr-2" />
                                Create Editable Copy
                              </Button>
                            )}

                          </div>

                          <div className="flex justify-end gap-2 border-t pt-4">
                            <Button variant="outline" onClick={() => setShowInspectionDialog(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => {
                                const inspectorName = (document.getElementById('inspector-name') as HTMLInputElement)?.value
                                const inspectionDate = (document.getElementById('inspection-date') as HTMLInputElement)?.value
                                const inspectionNotes = (document.getElementById('inspection-notes') as HTMLTextAreaElement)?.value
                                
                                if (inspectorName && inspectionDate) {
                                  handleSaveInspection({
                                    inspection_date: inspectionDate,
                                    inspector_name: inspectorName,
                                    inspection_notes: inspectionNotes
                                  })
                                }
                              }}
                              disabled={saveInspectionMutation.isPending}
                            >
                              {saveInspectionMutation.isPending && <ButtonLoader className="mr-2" />}
                              {inspection ? 'Update' : 'Save'} Inspection
                            </Button>
                          </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">Upload Site Photos</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload photos for different work stages
                    </p>
                    <Dialog open={showSitePhotoDialog} onOpenChange={setShowSitePhotoDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Site Photos
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upload Site Photos</DialogTitle>
                          <DialogDescription>
                            Upload photos for different work stages. This will automatically update the job status.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="photo-stage">Photo Stage</Label>
                            <Select value={photoStage} onValueChange={setPhotoStage}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select photo stage" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="survey">Survey Photos</SelectItem>
                                <SelectItem value="repair">Repair Photos</SelectItem>
                                <SelectItem value="primer">Primer Photos</SelectItem>
                                <SelectItem value="ultra">Ultra Photos</SelectItem>
                                <SelectItem value="topcoat">Topcoat Photos</SelectItem>
                                <SelectItem value="completion">Completion Photos</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="photo-file">Photo File</Label>
                            <Input 
                              id="photo-file"
                              type="file"
                              accept="image/*"
                              onChange={handleFileSelect}
                            />
                          </div>
                          {selectedFile && (
                            <div className="p-3 border rounded-lg bg-muted/50">
                              <p className="text-sm">
                                <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                              </p>
                            </div>
                          )}
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowSitePhotoDialog(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleSitePhotoUpload}
                              disabled={!selectedFile || !photoStage || uploadSitePhotoMutation.isPending}
                            >
                              {uploadSitePhotoMutation.isPending && <ButtonLoader className="mr-2" />}
                              Upload Photo
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Progress */}
          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Work Progress
                </CardTitle>
                <CardDescription>
                  Track work stages, team assignments, and progress updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Timeline */}
                <div className="space-y-4">
                  <h4 className="font-medium">Progress Timeline</h4>
                  <div className="space-y-3">
                    {[
                      { status: 'pending_survey', label: 'Pending Survey', description: 'Initial site survey required' },
                      { status: 'in_review', label: 'In Review', description: 'Manager verification of inspection' },
                      { status: 'pending_repair', label: 'Pending Repair', description: 'Begin repair work' },
                      { status: 'left_primer', label: 'Left Primer', description: 'Apply primer coating' },
                      { status: 'left_ultra', label: 'Left Ultra', description: 'Apply ultra coating' },
                      { status: 'left_top_coat_cover_slab', label: 'Left Top Coat/Cover Slab', description: 'Apply top coat' },
                      { status: 'repair_completed', label: 'Repair Completed', description: 'All repair work finished' },
                      { status: 'approved', label: 'Approved', description: 'Job approved by client' },
                      { status: 'job_completed', label: 'Job Completed', description: 'Job fully completed and closed' }
                    ].map((stage, index) => {
                      const isCompleted = job?.status && 
                        ['pending_survey', 'in_review', 'pending_repair', 'left_primer', 'left_ultra', 'left_top_coat_cover_slab', 'repair_completed', 'approved', 'job_completed']
                          .indexOf(String(job.status)) >= index
                      const isCurrent = String(job?.status) === stage.status
                      
                      return (
                        <div key={stage.status} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            isCompleted ? 'bg-green-500 text-white' : 
                            isCurrent ? 'bg-blue-500 text-white' : 
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {isCompleted ? '✓' : index + 1}
                          </div>
                          <div className="flex-1">
                            <div className={`font-medium ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                              {stage.label}
                            </div>
                            <div className="text-sm text-muted-foreground">{stage.description}</div>
                          </div>
                          {isCurrent && (
                            <Badge variant="outline" className="text-blue-600 border-blue-200">
                              Current
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Current Status</h4>
                    <Badge className={getStatusColor(job?.status)}>
                      {formatStatus(job?.status)}
                    </Badge>
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Next Steps:</h5>
                      <p className="text-sm text-muted-foreground">
                        {String(job?.status) === 'pending_survey' && 'Upload survey photos to move to manager review'}
                        {String(job?.status) === 'in_review' && 'Manager to verify inspection details and approve to proceed with repairs'}
                        {String(job?.status) === 'pending_repair' && 'Upload repair photos to progress to primer stage'}
                        {String(job?.status) === 'left_primer' && 'Upload primer photos to progress to ultra stage'}
                        {String(job?.status) === 'left_ultra' && 'Upload ultra photos to progress to topcoat stage'}
                        {String(job?.status) === 'left_top_coat_cover_slab' && 'Upload topcoat photos to complete repairs'}
                        {String(job?.status) === 'repair_completed' && 'Awaiting final approval'}
                        {String(job?.status) === 'approved' && 'Mark job as completed'}
                        {String(job?.status) === 'job_completed' && 'Job fully completed and closed'}
                        {!job?.status && 'Schedule initial survey'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">Work Schedule</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Report Date:</span>
                        <span className="font-medium">
                          {job?.report_date ? new Date(job.report_date).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Inspection:</span>
                        <span className="font-medium">
                          {job?.inspection_date ? new Date(job.inspection_date).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Repair Start:</span>
                        <span className="font-medium">
                          {job?.repair_schedule ? new Date(job.repair_schedule).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ultra Schedule:</span>
                        <span className="font-medium">
                          {job?.ultra_schedule ? new Date(job.ultra_schedule).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Photo Progress Summary */}
                {sitePhotos && sitePhotos.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Photo Progress Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['survey', 'repair', 'primer', 'ultra', 'topcoat', 'completion'].map((stage) => {
                        const stagePhotos = sitePhotos.filter(photo => photo.photo_stage === stage)
                        return (
                          <div key={stage} className="p-3 border rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-600">{stagePhotos.length}</div>
                            <div className="text-sm text-muted-foreground capitalize">{stage} Photos</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="font-medium">Upload Progress Photos</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload photos for each work stage to automatically progress the job status
                  </p>
                  <Dialog open={showSitePhotoDialog} onOpenChange={setShowSitePhotoDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Progress Photos
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Progress Photos</DialogTitle>
                        <DialogDescription>
                          Upload photos for different work stages. This will automatically update the job status.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="photo-stage">Photo Stage</Label>
                          <Select value={photoStage} onValueChange={setPhotoStage}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select photo stage" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="survey">Survey Photos</SelectItem>
                              <SelectItem value="repair">Repair Photos</SelectItem>
                              <SelectItem value="primer">Primer Photos</SelectItem>
                              <SelectItem value="ultra">Ultra Photos</SelectItem>
                              <SelectItem value="topcoat">Topcoat Photos</SelectItem>
                              <SelectItem value="completion">Completion Photos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="photo-file">Photo File</Label>
                          <Input 
                            id="photo-file"
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                          />
                        </div>
                        {selectedFile && (
                          <div className="p-3 border rounded-lg bg-muted/50">
                            <p className="text-sm">
                              <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                          </div>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowSitePhotoDialog(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleSitePhotoUpload}
                            disabled={!selectedFile || !photoStage || uploadSitePhotoMutation.isPending}
                          >
                            {uploadSitePhotoMutation.isPending && <ButtonLoader className="mr-2" />}
                            Upload Photo
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Completion Report */}
          <TabsContent value="completion" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Completion Report
                </CardTitle>
                <CardDescription>
                  Final completion documentation and before/after photos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Job Summary */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Job Status</h4>
                    <Badge className={getStatusColor(job?.status)}>
                      {formatStatus(job?.status)}
                    </Badge>
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Work Location:</h5>
                      <p className="text-sm text-muted-foreground">
                        {job?.location} - Block {job?.block_no} - Unit {job?.unit_no}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">Completion Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Completion Date:</span>
                        <span className="font-medium">
                          {job?.repair_completion ? new Date(job.repair_completion).toLocaleDateString() : 'Not completed'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Work Area:</span>
                        <span className="font-medium">{job?.area || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Summary */}
                <div className="space-y-3">
                  <h4 className="font-medium">Document Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 border rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{safetyDocuments?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Safety Docs</div>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{sitePhotos?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Site Photos</div>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">{inspection ? '1' : '0'}</div>
                      <div className="text-sm text-muted-foreground">Inspections</div>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {sitePhotos?.filter(p => p.photo_stage === 'completion').length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Completion Photos</div>
                    </div>
                  </div>
                </div>

                {/* Photo Gallery */}
                {sitePhotos && sitePhotos.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Photo Gallery</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {sitePhotos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <img 
                            src={photo.cloudinary_url} 
                            alt={photo.original_file_name}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                            {photo.photo_stage}
                          </div>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
                            <Button variant="outline" size="sm" asChild>
                              <a href={photo.cloudinary_url} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-3 w-3" />
                              </a>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <a href={photo.cloudinary_url} download>
                                <Download className="h-3 w-3" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completion Actions */}
                <div className="space-y-3">
                  <h4 className="font-medium">Completion Actions</h4>
                  <p className="text-sm text-muted-foreground">
                    {String(job?.status) === 'approved' 
                      ? 'Job completed and approved. Generate final completion report.'
                      : String(job?.status) === 'in_review'
                      ? 'Job is in review. Awaiting client approval.'
                      : 'Complete all work stages before generating report'
                    }
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      disabled={String(job?.status) !== 'approved'}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Completion Report
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setPhotoStage('completion')
                        setShowSitePhotoDialog(true)
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Completion Photos
                    </Button>
                  </div>
                </div>

                {/* Status Actions for Managers */}
                {String(job?.status) === 'in_review' && (
                  <div className="space-y-3 p-4 border rounded-lg bg-yellow-50">
                    <h4 className="font-medium text-yellow-800">Client Approval Required</h4>
                    <p className="text-sm text-yellow-700">
                      This job is awaiting client approval. Once approved, the job will be marked as completed.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Request Changes
                      </Button>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Approve Job
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Editor Modal */}
      <Dialog open={showDocumentEditor} onOpenChange={setShowDocumentEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Document Editor</DialogTitle>
            <DialogDescription>
              View and edit the document: {selectedDocument?.document_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDocument && (
              <div className="space-y-4">
                {/* Document Info */}
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{selectedDocument.document_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedDocument.original_file_name} • 
                        {selectedDocument.is_signed ? ' Signed' : ' Not signed'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedDocument.cloudinary_url, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowSignatureModal(true)
                      }}
                      disabled={selectedDocument.is_signed}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {selectedDocument.is_signed ? 'Signed' : 'Add Signature'}
                    </Button>
                  </div>
                </div>

                {/* Document Preview/Editor */}
                <div className="border rounded-lg p-4 bg-muted/20">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Document Preview</h4>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Download the document
                            const link = document.createElement('a')
                            link.href = selectedDocument.cloudinary_url
                            link.download = selectedDocument.original_file_name
                            link.target = '_blank'
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // TODO: Implement editing mode
                            toast.info("Document editing mode coming soon!")
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                    
                    {/* Editing Toolbar */}
                    <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                      <span className="text-sm font-medium">Tools:</span>
                      <Button variant="outline" size="sm" title="Add Text">
                        <FileText className="h-4 w-4 mr-1" />
                        Text
                      </Button>
                      <Button variant="outline" size="sm" title="Add Rectangle">
                        <div className="h-4 w-4 border border-current mr-1" />
                        Rectangle
                      </Button>
                      <Button variant="outline" size="sm" title="Add Circle">
                        <div className="h-4 w-4 rounded-full border border-current mr-1" />
                        Circle
                      </Button>
                      <Button variant="outline" size="sm" title="Add Arrow">
                        <div className="h-4 w-4 mr-1">→</div>
                        Arrow
                      </Button>
                      <Button variant="outline" size="sm" title="Add Signature">
                        <FileText className="h-4 w-4 mr-1" />
                        Signature
                      </Button>
                      <div className="flex-1" />
                      <Button variant="outline" size="sm" title="Save Changes">
                        <Download className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </div>

                    {/* Document Content */}
                    <div className="border rounded-lg p-4 bg-background min-h-[500px] max-h-[600px] overflow-auto relative">
                      {selectedDocument.mime_type?.includes('image') ? (
                        // Image viewer with editing overlay
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium">Image Document</span>
                            <Badge variant="outline">JPG/PNG</Badge>
                          </div>
                          <div className="flex justify-center relative">
                            <div className="relative">
                              <img 
                                src={selectedDocument.cloudinary_url} 
                                alt={selectedDocument.document_name}
                                className="max-w-full max-h-[400px] object-contain border rounded-lg shadow-sm"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                }}
                              />
                              {/* Editing Canvas Overlay */}
                              <canvas 
                                className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '400px',
                                  pointerEvents: 'auto'
                                }}
                                onClick={(e) => {
                                  // TODO: Add drawing functionality
                                  console.log('Canvas clicked for editing')
                                }}
                              />
                              <div className="hidden flex flex-col items-center justify-center min-h-[400px] text-center space-y-2">
                                <FileText className="h-12 w-12 text-muted-foreground" />
                                <p className="text-muted-foreground">Failed to load image</p>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(selectedDocument.cloudinary_url, '_blank')}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Open in New Tab
                                </Button>
                              </div>
                            </div>
                          </div>
                          {/* Editing Instructions */}
                          <div className="text-center text-sm text-muted-foreground">
                            <p>Click on the document to add annotations, text, or drawings</p>
                          </div>
                        </div>
                      ) : selectedDocument.mime_type?.includes('pdf') ? (
                        // PDF viewer
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium">PDF Document</span>
                            <Badge variant="outline">PDF</Badge>
                          </div>
                          <div className="flex justify-center">
                            <iframe
                              src={`${selectedDocument.cloudinary_url}#toolbar=1&navpanes=1&scrollbar=1`}
                              className="w-full h-[400px] border rounded-lg"
                              title={selectedDocument.document_name}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                            <div className="hidden flex flex-col items-center justify-center min-h-[400px] text-center space-y-2">
                              <FileText className="h-12 w-12 text-muted-foreground" />
                              <p className="text-muted-foreground">PDF viewer not supported</p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(selectedDocument.cloudinary_url, '_blank')}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Open in New Tab
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Generic document viewer
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                          <FileText className="h-16 w-16 text-muted-foreground" />
                          <div className="space-y-2">
                            <p className="text-lg font-medium">Document Preview</p>
                            <p className="text-sm text-muted-foreground">
                              Document type: {selectedDocument.mime_type || 'Unknown'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              File: {selectedDocument.original_file_name}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => window.open(selectedDocument.cloudinary_url, '_blank')}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Open in New Tab
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => {
                                const link = document.createElement('a')
                                link.href = selectedDocument.cloudinary_url
                                link.download = selectedDocument.original_file_name
                                link.target = '_blank'
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Document Status */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Document Status</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={selectedDocument.is_signed ? "default" : "secondary"}>
                            {selectedDocument.is_signed ? 'Signed' : 'Not Signed'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Created: {new Date(selectedDocument.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          deleteEditableDocMutation.mutate(selectedDocument.id)
                          setShowDocumentEditor(false)
                        }}
                        disabled={deleteEditableDocMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Document
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature Modal */}
      <Dialog open={showSignatureModal} onOpenChange={setShowSignatureModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Digital Signature</DialogTitle>
            <DialogDescription>
              Sign the document: {selectedDocument?.document_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Signature Canvas */}
            <div className="border rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Signature</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSignatureData("")}
                  >
                    Clear
                  </Button>
                </div>
                <div className="border rounded-lg p-4 bg-background min-h-[200px] flex items-center justify-center">
                  {signatureData ? (
                    <div className="text-center space-y-2">
                      <div className="text-4xl font-bold text-green-600">✓</div>
                      <p className="text-sm text-muted-foreground">Signature Captured</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                      <p className="text-muted-foreground">Click to add signature</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // TODO: Implement actual signature capture
                          setSignatureData("signature_captured")
                          toast.success("Signature captured! (Demo mode)")
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Capture Signature
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Signature Actions */}
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowSignatureModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (signatureData) {
                    // TODO: Save signature to document
                    toast.success("Signature added to document!")
                    setShowSignatureModal(false)
                    // Update document status
                    queryClient.invalidateQueries({ queryKey: ["editable-documents", jobId] })
                  } else {
                    toast.error("Please capture a signature first")
                  }
                }}
                disabled={!signatureData}
              >
                <FileText className="h-4 w-4 mr-2" />
                Apply Signature
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Editor Modal */}
      {selectedDocument && showPDFEditor && (
        <PDFEditor
          pdfUrl={selectedDocument.cloudinary_url}
          documentName={selectedDocument.document_name}
          onSave={(pdfBytes) => {
            // TODO: Implement saving the edited PDF back to the server
            toast.success("PDF saved successfully")
          }}
          onClose={() => {
            setShowPDFEditor(false)
            setSelectedDocument(null)
          }}
        />
      )}
    </>
  )
}
