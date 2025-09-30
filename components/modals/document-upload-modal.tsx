"use client"

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companyDocumentsApi } from '@/lib/api'
import { UploadCloud, File, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: () => void
}

const docCategories = ["SWP", "SDS", "FPP", "RA", "MS", "ERP", "Other"];

export function DocumentUploadModal({ isOpen, onClose, onUploadSuccess }: DocumentUploadModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [category, setCategory] = useState<string>("")
  const [docName, setDocName] = useState("")
  const [docDescription, setDocDescription] = useState("")
  const { toast } = useToast()
  const queryClient = useQueryClient()


  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles([acceptedFiles[0]]) // Only allow one file
    setDocName(acceptedFiles[0].name.replace(/\.[^/.]+$/, "")) // Pre-fill name without extension
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc', '.docx'],
      'image/*': ['.jpeg', '.jpg', '.png'],
    }
  })

  const removeFile = (file: File) => {
    setFiles(prevFiles => prevFiles.filter(f => f !== file))
  }

  const uploadMutation = useMutation({
    mutationFn: (variables: { file: File, name: string, description: string, category: string }) => 
      companyDocumentsApi.uploadDocument(variables.file, variables.name, variables.description, variables.category),
    onSuccess: () => {
      toast.success("Document uploaded successfully!")
      queryClient.invalidateQueries({ queryKey: ["company-documents"] })
      handleClose()
    },
    onError: () => {
      toast.error("Failed to upload document. Please try again.")
    },
  })

  const handleUpload = () => {
    if (files.length > 0 && category && docName) {
      const file = files[0]
      uploadMutation.mutate({ file, name: docName, description: docDescription, category })
    }
  }

  const handleClose = () => {
    setFiles([])
    setCategory("")
    setDocName("")
    setDocDescription("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Upload Company Document</DialogTitle>
          <DialogDescription>
            Upload important documents like SWP, SDS, or FPP for your team to access.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-6">
          <div
            {...getRootProps()}
            className={`group relative grid h-48 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'hover:border-primary/50'}`}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag & drop files here, or click to select files
              </p>
              <p className="text-xs text-muted-foreground/80">
                PDF, DOC, PNG, JPG accepted
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Selected File:</h4>
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border bg-muted/50 p-2">
                    <div className="flex items-center gap-2">
                      <File className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{file.name}</span>
                      <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(2)} KB)</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(file)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {files.length > 0 && (
            <>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="docName">Document Name</Label>
                <Input
                  id="docName"
                  type="text"
                  placeholder="e.g., Safe Work Procedure for Heights"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="docDescription">Description (Optional)</Label>
                <Textarea
                  id="docDescription"
                  placeholder="A brief description of the document's content."
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                />
              </div>
            </>
          )}

          <Select onValueChange={setCategory} value={category}>
            <SelectTrigger>
              <SelectValue placeholder="Select a document category" />
            </SelectTrigger>
            <SelectContent>
              {docCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleUpload} disabled={files.length === 0 || !category || !docName || uploadMutation.isPending}>
            {uploadMutation.isPending && (
              <span className="animate-spin mr-2">...</span>
            )}
            Upload Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
