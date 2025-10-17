"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { companyDocumentsApi } from "@/lib/api"
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Upload, 
  FolderPlus, 
  MoreVertical, 
  Trash2, 
  Eye, 
  Download, 
  FileIcon, 
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Printer,
  Share,
  Info,
  X
} from "lucide-react"
import { StyledFolderIcon } from "@/components/ui/styled-folder-icon"
import { DocumentUploadModal } from "@/components/modals/document-upload-modal"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

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

// PDF Viewer Component - Direct Cloudinary PDF rendering
const PDFViewer = ({ url, fileName }: { url: string; fileName: string }) => {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Optimize PDF URL for viewing with Cloudinary transformations
  const optimizedUrl = React.useMemo(() => {
    if (url.includes('cloudinary.com')) {
      // Convert PDF to image format for better preview
      // URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/v{version}/{path}
      const parts = url.split('/upload/')
      if (parts.length === 2) {
        // Add transformations: convert to JPG, show first page, optimize quality
        return `${parts[0]}/upload/pg_1,f_jpg,w_800,q_auto,fl_progressive/${parts[1]}`
      }
    }
    return url
  }, [url])

  // Handle iframe load
  const handleLoad = () => {
    setLoading(false)
    setError(null)
  }

  const handleError = () => {
    setError('Failed to load PDF preview')
    setLoading(false)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 border rounded-lg bg-muted">
        <div className="text-center">
          <FileIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">Failed to load PDF preview</p>
          <p className="text-xs text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(url, '_blank')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Open in new tab
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* PDF Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 border-b bg-muted/50 gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            PDF Preview - Use browser controls to navigate
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(url, '_blank')}
          >
            <Eye className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Open in new tab</span>
            <span className="sm:hidden">Open</span>
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex justify-center p-2 sm:p-4 bg-gray-50 relative min-h-[600px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          </div>
        )}
        <div className="w-full">
          {/* Try image preview first (faster loading) */}
          <img
            src={optimizedUrl}
            alt={`${fileName} preview`}
            className="border rounded-lg shadow-lg w-full max-w-4xl mx-auto"
            style={{
              height: 'auto',
              maxHeight: '80vh',
              display: loading ? 'none' : 'block'
            }}
            onLoad={handleLoad}
            onError={() => {
              // If image preview fails, fall back to iframe
              setLoading(false)
            }}
          />
          
          {/* Fallback iframe for full PDF viewing */}
          <iframe
            src={url}
            className="border rounded-lg shadow-lg w-full"
            style={{
              width: '100%',
              height: '80vh',
              minHeight: '600px',
              display: 'none' // Hidden by default, shown if image fails
            }}
            title={fileName}
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      </div>
    </div>
  )
}

// Enhanced Image Viewer Component
const ImageViewer = ({ url, fileName }: { url: string; fileName: string }) => {
  const [scale, setScale] = React.useState(1.0)
  const [rotation, setRotation] = React.useState(0)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5))
  const resetZoom = () => {
    setScale(1.0)
    setPosition({ x: 0, y: 0 })
  }
  const rotate = () => setRotation(prev => (prev + 90) % 360)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div className="w-full">
      {/* Image Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[60px] text-center">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={resetZoom}>
            Reset
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={rotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Image Content */}
      <div className="flex justify-center p-2 sm:p-4 bg-gray-50 overflow-hidden">
        <div 
          className="cursor-grab active:cursor-grabbing w-full flex justify-center"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={url}
            alt={fileName}
            className="max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain shadow-lg rounded-lg"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease'
            }}
            draggable={false}
          />
        </div>
      </div>
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

// Document Toolbar Component
const DocumentToolbar = ({ 
  document, 
  onDownload, 
  onDelete, 
  onPrevious, 
  onNext, 
  hasPrevious, 
  hasNext,
  onBack
}: {
  document: CompanyDocument
  onDownload: () => void
  onDelete: () => void
  onPrevious: () => void
  onNext: () => void
  hasPrevious: boolean
  hasNext: boolean
  onBack?: () => void
}) => {
  const [showMetadata, setShowMetadata] = React.useState(false)

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center space-x-2">
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack} className="lg:hidden">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onPrevious} disabled={!hasPrevious} className="hidden sm:flex">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext} className="hidden sm:flex">
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
        <div className="flex sm:hidden">
          <Button variant="outline" size="sm" onClick={onPrevious} disabled={!hasPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-1 sm:space-x-2">
        <Button variant="outline" size="sm" onClick={onDownload} className="hidden sm:flex">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button variant="outline" size="sm" onClick={onDownload} className="sm:hidden">
          <Download className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="hidden sm:flex">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="sm:hidden">
          <Printer className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowMetadata(!showMetadata)} className="hidden sm:flex">
          <Info className="h-4 w-4 mr-2" />
          Info
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowMetadata(!showMetadata)} className="sm:hidden">
          <Info className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete} className="hidden sm:flex">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete} className="sm:hidden">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Folder Card Component
const FolderCard = ({ 
  category, 
  count, 
  isSelected, 
  onClick 
}: { 
  category: string
  count: number
  isSelected: boolean
  onClick: () => void 
}) => {
  return (
    <Card 
      className={cn(
        "p-4 cursor-pointer transition-colors hover:bg-muted/50",
        isSelected && "bg-primary/10 border-primary"
      )}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <StyledFolderIcon size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{category}</h3>
          <p className="text-sm text-muted-foreground">{count} document{count !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </Card>
  )
}

export default function CompanyDocumentsPage() {
  const [isUploadModalOpen, setUploadModalOpen] = React.useState(false)
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
  const [selectedDocument, setSelectedDocument] = React.useState<CompanyDocument | null>(null)
  const [isConfirmOpen, setConfirmOpen] = React.useState(false)
  const [selectedDocId, setSelectedDocId] = React.useState<string | null>(null)
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
      // If the deleted document was selected, clear selection
      if (selectedDocument?.id === selectedDocId) {
        setSelectedDocument(null)
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

  const downloadDocument = async (doc: CompanyDocument) => {
    try {
      // For Cloudinary URLs, add fl_attachment flag to force download
      let downloadUrl = doc.cloudinary_url
      
      if (downloadUrl.includes('cloudinary.com')) {
        // Add fl_attachment flag to force download instead of preview
        const parts = downloadUrl.split('/upload/')
        if (parts.length === 2) {
          downloadUrl = `${parts[0]}/upload/fl_attachment/${parts[1]}`
        }
      }

      // Create a download link directly
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = doc.file_name || doc.name
      link.target = '_blank' // Open in new tab as fallback
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Download started')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download file')
    }
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
    ? documentsByCategory[selectedCategory] || []
    : []

  const currentDocumentIndex = selectedDocument 
    ? selectedDocuments.findIndex(doc => doc.id === selectedDocument.id)
    : -1

  const hasPrevious = currentDocumentIndex > 0
  const hasNext = currentDocumentIndex < selectedDocuments.length - 1

  const goToPrevious = () => {
    if (hasPrevious) {
      setSelectedDocument(selectedDocuments[currentDocumentIndex - 1])
    }
  }

  const goToNext = () => {
    if (hasNext) {
      setSelectedDocument(selectedDocuments[currentDocumentIndex + 1])
    }
  }

  return (
    <>
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["company-documents"] })
        }}
      />
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete the document."
        isLoading={deleteMutation.isPending}
      />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-80 border-r bg-muted/30 flex flex-col hidden lg:flex">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Company Documents</h2>
              {canManageJobs() && (
                <Button onClick={() => setUploadModalOpen(true)} size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Browse and manage company-wide documents organized by category.
            </p>
          </div>

          <ScrollArea className="flex-1 p-4">
            {isLoading ? (
              <DataTableSkeleton columnCount={1} rowCount={6} />
            ) : (
              <div className="space-y-2">
                {Object.entries(documentsByCategory).map(([category, docs]) => (
                  <FolderCard
                    key={category}
                    category={category}
                    count={docs.length}
                    isSelected={selectedCategory === category}
                    onClick={() => {
                      setSelectedCategory(category)
                      setSelectedDocument(null)
                    }}
                  />
                ))}
                {canManageJobs() && (
                  <Card
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed bg-muted/50 p-4 text-muted-foreground transition-colors hover:border-primary/80 hover:bg-muted"
                    onClick={() => setUploadModalOpen(true)}
                  >
                    <FolderPlus className="h-6 w-6" />
                    <p className="text-center text-sm font-medium">Create New Folder</p>
                  </Card>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Mobile Category Selector */}
        <div className="lg:hidden p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Company Documents</h2>
            {canManageJobs() && (
              <Button onClick={() => setUploadModalOpen(true)} size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(documentsByCategory).map(([category, docs]) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedCategory(category)
                  setSelectedDocument(null)
                }}
                className="justify-start"
              >
                <StyledFolderIcon size={16} />
                {category} ({docs.length})
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {selectedCategory && (
            <>
              {/* Document List */}
              {!selectedDocument && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">{selectedCategory} Documents</h3>
                    <Badge variant="secondary">{selectedDocuments.length} documents</Badge>
                  </div>
                  
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {selectedDocuments.map((doc) => (
                      <Card 
                        key={doc.id} 
                        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedDocument(doc)}
                      >
                        <div className="flex items-center space-x-3">
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
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Preview */}
              {selectedDocument && (
                <div className="flex-1 flex flex-col">
                  <DocumentToolbar
                    document={selectedDocument}
                    onDownload={() => downloadDocument(selectedDocument)}
                    onDelete={() => openDeleteDialog(selectedDocument.id)}
                    onPrevious={goToPrevious}
                    onNext={goToNext}
                    hasPrevious={hasPrevious}
                    hasNext={hasNext}
                    onBack={() => setSelectedDocument(null)}
                  />
                  
                  <ScrollArea className="flex-1">
                    <div className="p-4 sm:p-6">
                      <DocumentPreview document={selectedDocument} />
                    </div>
                  </ScrollArea>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!selectedCategory && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Select a Category</h3>
                <p className="text-muted-foreground">
                  Choose a document category from the sidebar to view documents.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}