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
import { FileText, Upload, FolderPlus, MoreVertical, Trash2 } from "lucide-react"
import { DocumentUploadModal } from "@/components/modals/document-upload-modal"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useAuth } from "@/hooks/use-auth"

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

export default function CompanyDocumentsPage() {
  const [isUploadModalOpen, setUploadModalOpen] = React.useState(false)
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  )
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

      <Dialog
        open={!!selectedCategory}
        onOpenChange={(isOpen) => !isOpen && setSelectedCategory(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="capitalize">{selectedCategory}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-4">
            <ul className="space-y-2">
              {selectedDocuments.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    <div className="overflow-hidden">
                      <p className="font-medium truncate">{doc.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {doc.file_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.cloudinary_url, "_blank")}
                    >
                      Preview
                    </Button>
                    {canManageJobs() && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(doc.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
