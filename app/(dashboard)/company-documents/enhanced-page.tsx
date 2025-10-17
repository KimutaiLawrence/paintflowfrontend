"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { companyDocumentsApi } from "@/lib/api"
import { FolderCard } from "@/components/shared/folder-card"
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { FileText, Upload, FolderPlus, MoreVertical, Trash2, Eye, Download, FileIcon, ImageIcon } from "lucide-react"
import { DocumentUploadModal } from "@/components/modals/document-upload-modal"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

// Define the structure of a single document
interface CompanyDocument {
  id: string
  name: string
  description: string
  category: string
  file_name: string
  cloudinary_url: string
  uploaded_by: string
  created_at: string
}

// PDF Viewer Component
const PDFViewer = ({ url, fileName }: { url: string; fileName: string }) => {
  return (
    <div className="w-full h-[600px] border rounded-lg overflow-hidden">
      <iframe
        src={url}
        className="w-full h-full"
        title={fileName}
        style={{ border: 'none' }}
      />
    </div>
  )
}

// Image Viewer Component
const ImageViewer = ({ url, fileName }: { url: string; fileName: string }) => {
  return (
    <div className="w-full h-[600px] border rounded-lg overflow-hidden">
      <img
        src={url}
        alt={fileName}
        className="w-full h-full object-contain"
      />
    </div>
  )
}

// Document Preview Component
const DocumentPreview = ({ document }: { document: CompanyDocument }) => {
  const isPDF = document.file_name.toLowerCase().endsWith('.pdf')
  const isImage = /\.(jpg|jpeg|png|gif)$/i.test(document.file_name)
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{document.name}</h3>
          <p className="text-sm text-muted-foreground">{document.file_name}</p>
        </div>
        <Badge variant="secondary">{document.category}</Badge>
      </div>
      
      {document.description && (
        <div>
          <h4 className="text-sm font-medium mb-2">Description</h4>
          <p className="text-sm text-muted-foreground">{document.description}</p>
        </div>
      )}
      
      <Separator />
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Uploaded by:</span>
          <span>{document.uploaded_by}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Uploaded on:</span>
          <span>{new Date(document.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Preview</h4>
        {isPDF ? (
          <PDFViewer url={document.cloudinary_url} fileName={document.file_name} />
        ) : isImage ? (
          <ImageViewer url={document.cloudinary_url} fileName={document.file_name} />
        ) : (
          <div className="flex items-center justify-center h-32 border rounded-lg bg-muted">
            <div className="text-center">
              <FileIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Preview not available</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.open(document.cloudinary_url, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download to view
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function EnhancedCompanyDocumentsPage() {
  const [isUploadModalOpen, setUploadModalOpen] = React.useState(false)
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
  const [isConfirmOpen, setConfirmOpen] = React.useState(false)
  const [selectedDocId, setSelectedDocId] = React.useState<string | null>(null)
  const [previewDocument, setPreviewDocument] = React.useState<CompanyDocument | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { canManageJobs } = useAuth()

  const { data: documents = [], isLoading } = useQuery<CompanyDocument[]>({
    queryKey: ["company-documents"],
    queryFn: () => companyDocumentsApi.getDocuments(),
  })

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => companyDocumentsApi.deleteDocument(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-documents"] })
      toast.success("Document deleted successfully.")
      setConfirmOpen(false)
      setSelectedDocId(null)
      // If the last document in a category was deleted, close the modal
      if (selectedDocuments.length === 1) {
        setSelectedCategory(null)
      }
    },
    onError: () => {
      toast.error("Failed to delete document.")
      setConfirmOpen(false)
    },
  })

  const openDeleteDialog = (docId: string) => {
    setSelectedDocId(docId)
    setConfirmOpen(true)
  }

  const handleDelete = () => {
    if (selectedDocId) {
      deleteMutation.mutate(selectedDocId)
    }
  }

  const openPreview = (document: CompanyDocument) => {
    setPreviewDocument(document)
    setIsPreviewOpen(true)
  }

  const downloadDocument = (document: CompanyDocument) => {
    const link = document.createElement('a')
    link.href = document.cloudinary_url
    link.download = document.file_name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Group documents by category
  const documentsByCategory = React.useMemo(() => {
    return documents.reduce((acc, doc) => {
      const category = doc.category || "uncategorized"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(doc)
      return acc
    }, {} as Record<string, CompanyDocument[]>)
  }, [documents])

  const selectedDocuments = selectedCategory
    ? documentsByCategory[selectedCategory]
    : []

  return (
    <>
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete the document."
        isLoading={deleteMutation.isPending}
      />
      
      {/* Document Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh]">
            {previewDocument && <DocumentPreview document={previewDocument} />}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Category Documents Dialog */}
      <Dialog open={!!selectedCategory} onOpenChange={() => setSelectedCategory(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory} Documents ({selectedDocuments.length})
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh]">
            <div className="space-y-4">
              {selectedDocuments.map((doc) => (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {doc.file_name.toLowerCase().endsWith('.pdf') ? (
                          <FileText className="h-8 w-8 text-red-500" />
                        ) : /\.(jpg|jpeg|png|gif)$/i.test(doc.file_name) ? (
                          <ImageIcon className="h-8 w-8 text-blue-500" />
                        ) : (
                          <FileIcon className="h-8 w-8 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{doc.name}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {doc.file_name}
                        </p>
                        {doc.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPreview(doc)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadDocument(doc)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      {canManageJobs() && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(doc.id)}
                              className="text-red-500"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Company Documents</h2>
            <p className="text-muted-foreground">
              Browse and manage company-wide documents organized by category.
            </p>
          </div>
          {canManageJobs() && (
            <Button onClick={() => setUploadModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          )}
        </div>

        {isLoading ? (
          <DataTableSkeleton columnCount={4} rowCount={4} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(documentsByCategory).map(([category, docs]) => (
              <FolderCard
                key={category}
                categoryName={category}
                documentCount={docs.length}
                onClick={() => setSelectedCategory(category)}
              />
            ))}
            {canManageJobs() && (
              <Card
                className="flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed bg-muted/50 p-6 text-muted-foreground transition-colors hover:border-primary/80 hover:bg-muted"
                onClick={() => setUploadModalOpen(true)}
              >
                <FolderPlus className="h-8 w-8" />
                <p className="text-center text-sm font-medium">Create New Folder</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  )
}
