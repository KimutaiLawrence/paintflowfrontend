"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { companyDocumentsApi } from "@/lib/api"
import { usePreferences } from "@/hooks/use-preferences"
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
  X,
  Edit
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

// Category mapping for display
const CATEGORY_MAPPING: Record<string, { code: string; name: string; description: string }> = {
  'FPP': { code: 'FPP', name: 'Fall Prevention Plan', description: 'Safety procedures for work at height' },
  'SWP': { code: 'SWP', name: 'Safe Work Procedures', description: 'General safety protocols and procedures' },
  'PTW': { code: 'PTW', name: 'Permit to Work', description: 'Work authorization and safety permits' },
  'RA': { code: 'RA', name: 'Risk Assessment', description: 'Hazard identification and risk evaluation' },
  'SDS': { code: 'SDS', name: 'Safety Data Sheet', description: 'Chemical safety and handling information' },
  'TBM': { code: 'TBM', name: 'Toolbox Meeting', description: 'Daily safety briefings and meetings' },
  'VSS': { code: 'VSS', name: 'Vehicle Safety System', description: 'Vehicle and equipment safety checks' },
  'MS': { code: 'MS', name: 'Method Statement', description: 'Detailed work procedures and specifications' }
}

// Helper function to get category display info
const getCategoryInfo = (category: string) => {
  return CATEGORY_MAPPING[category] || { code: category, name: category, description: '' }
}

// PDF Viewer Component - Handle Cloudinary PDF delivery restrictions
const PDFViewer = ({ url, fileName }: { url: string; fileName: string }) => {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [showFallback, setShowFallback] = React.useState(false)

  // Handle iframe load
  const handleLoad = () => {
    setLoading(false)
    setError(null)
  }

  const handleError = () => {
    setError('Failed to load PDF preview')
    setLoading(false)
    setShowFallback(true)
  }

  // Handle PDF preview with fallback for Cloudinary restrictions
  const handlePreviewClick = () => {
    // Try to open PDF in new tab first
    const newWindow = window.open(url, '_blank')
    if (!newWindow) {
      // If popup blocked, show fallback message
      setShowFallback(true)
    }
  }

  if (error || showFallback) {
    return (
      <div className="flex items-center justify-center h-96 border rounded-lg bg-muted">
        <div className="text-center max-w-md mx-auto p-6">
          <FileIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">PDF Preview Not Available</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Due to Cloudinary security settings, PDF preview is not available. 
            You can download or open the document in a new tab.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviewClick}
            >
              <Eye className="h-4 w-4 mr-2" />
              Open in new tab
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                const link = document.createElement('a')
                link.href = url
                link.download = fileName // fileName is already the file_name from props
                link.target = '_blank'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            To enable PDF preview, contact your administrator to configure Cloudinary settings.
          </p>
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
            PDF Preview - Loading document...
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviewClick}
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
          {/* PDF iframe for direct viewing */}
          <iframe
            src={url}
            className="border rounded-lg shadow-lg w-full"
            style={{
              width: '100%',
              height: '80vh',
              minHeight: '600px',
              display: loading ? 'none' : 'block'
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
    <div className="flex items-center justify-between p-3 border-b bg-background">
      <div className="flex items-center space-x-1">
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack} className="lg:hidden">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onPrevious} disabled={!hasPrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center space-x-1">
        <Button variant="outline" size="sm" onClick={onDownload}>
          <Download className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowMetadata(!showMetadata)}>
          <Info className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete}>
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
  onClick,
  onEdit,
  onDelete
}: { 
  category: string
  count: number
  isSelected: boolean
  onClick: () => void
  onEdit?: () => void
  onDelete?: () => void
}) => {
  const categoryInfo = getCategoryInfo(category)
  
  return (
    <Card 
      className={cn(
        "p-3 transition-colors hover:bg-muted/50 group",
        isSelected && "bg-primary/10 border-primary"
      )}
    >
      <div className="flex items-center space-x-3">
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={onClick}
        >
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm">{categoryInfo.code}</h3>
                <span className="text-xs text-muted-foreground">•</span>
                <h4 className="font-medium text-sm break-words">{categoryInfo.name}</h4>
              </div>
              <p className="text-xs text-muted-foreground">{count} doc{count !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
        
        {/* Three-dot menu for category actions */}
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Category Actions</DropdownMenuLabel>
              {onEdit && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Category
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  {onEdit && <DropdownMenuSeparator />}
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete()
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Category
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
  const { preferences, updatePreference } = usePreferences()

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
      // For Cloudinary URLs, try different approaches based on file type
      let downloadUrl = doc.cloudinary_url
      
      if (downloadUrl.includes('cloudinary.com')) {
        // For PDFs, try to add fl_attachment flag to force download
        if (doc.file_name?.toLowerCase().endsWith('.pdf')) {
          const parts = downloadUrl.split('/upload/')
          if (parts.length === 2) {
            downloadUrl = `${parts[0]}/upload/fl_attachment/${parts[1]}`
          }
        }
        // For other files, use original URL
      }

      // Create a download link directly
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = doc.file_name || doc.name // Use file_name (original filename) first, fallback to name
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

  // Sort categories to prioritize required safety documents
  const sortedCategories = React.useMemo(() => {
    const userOrder = preferences.company_documents_order || ['PTW', 'TBM', 'WAH', 'VSS']
    const priorityCategories: string[] = []
    const otherCategories: string[] = []
    
    Object.keys(documentsByCategory).forEach(category => {
      if (userOrder.includes(category)) {
        priorityCategories.push(category)
      } else {
        otherCategories.push(category)
      }
    })
    
    // Sort priority categories by user-defined order
    priorityCategories.sort((a, b) => {
      return userOrder.indexOf(a) - userOrder.indexOf(b)
    })
    
    // Sort other categories alphabetically
    otherCategories.sort((a, b) => a.localeCompare(b))
    
    return [...priorityCategories, ...otherCategories]
  }, [documentsByCategory, preferences.company_documents_order])

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

      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* Sidebar - Desktop */}
        <div className="w-full lg:w-80 border-r bg-muted/30 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Documents</h2>
              {canManageJobs() && (
                <Button onClick={() => setUploadModalOpen(true)} size="sm">
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Browse documents by category
            </p>
          </div>

          <ScrollArea className="flex-1 p-3">
            {isLoading ? (
              <DataTableSkeleton columnCount={1} rowCount={6} />
            ) : (
              <div className="space-y-2">
                {sortedCategories.map((category) => {
                  const docs = documentsByCategory[category] || []
                  const isPriority = ['PTW', 'TBM', 'WAH', 'VSS'].includes(category)
                  return (
                    <div key={category} className="relative">
                      <FolderCard
                        category={category}
                        count={docs.length}
                        isSelected={selectedCategory === category}
                        onClick={() => {
                          setSelectedCategory(category)
                          setSelectedDocument(null)
                        }}
                        onEdit={() => {
                          // TODO: Implement category edit functionality
                          toast.success(`Edit functionality for ${category} will be implemented soon.`)
                        }}
                        onDelete={() => {
                          // TODO: Implement category delete functionality
                          toast.error(`Delete functionality for ${category} will be implemented soon.`)
                        }}
                      />
                      {isPriority && (
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-1 -right-1 text-xs px-1 py-0"
                        >
                          Required
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {selectedCategory && (
            <>
              {/* Document List */}
              {!selectedDocument && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {getCategoryInfo(selectedCategory).name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {getCategoryInfo(selectedCategory).description}
                      </p>
                    </div>
                    <Badge variant="secondary">{selectedDocuments.length}</Badge>
                  </div>
                  
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                    {selectedDocuments.map((doc) => (
                      <Card 
                        key={doc.id} 
                        className="p-4 hover:bg-muted/50 transition-colors group min-h-[100px]"
                      >
                        <div className="flex flex-col space-y-3">
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => setSelectedDocument(doc)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                {doc.file_name.toLowerCase().endsWith('.pdf') ? (
                                  <FileText className="h-6 w-6 text-red-500" />
                                ) : /\.(jpg|jpeg|png|gif)$/i.test(doc.file_name) ? (
                                  <ImageIcon className="h-6 w-6 text-blue-500" />
                                ) : (
                                  <FileIcon className="h-6 w-6 text-gray-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 space-y-2">
                                <h4 className="text-sm font-medium break-words leading-tight">{doc.name}</h4>
                                <p className="text-xs text-muted-foreground break-words leading-tight">
                                  {doc.file_name}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Three-dot menu */}
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedDocument(doc)
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View/Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  downloadDocument(doc)
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedDocId(doc.id)
                                  setConfirmOpen(true)
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
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
                  
                  <div className="flex-1 overflow-auto">
                    <div className="p-3">
                      <DocumentPreview document={selectedDocument} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!selectedCategory && (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <FileText className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <h3 className="text-base font-semibold mb-2">Select a Category</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a category to view documents
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}