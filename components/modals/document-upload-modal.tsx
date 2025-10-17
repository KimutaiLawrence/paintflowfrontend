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
import { useMutation } from '@tanstack/react-query'
import { companyDocumentsApi } from '@/lib/api'
import { UploadCloud, File, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess?: () => void
}

const docCategories = ["SWP", "SDS", "FPP", "RA", "MS", "ERP", "Other"];

export function DocumentUploadModal({ isOpen, onClose, onUploadSuccess }: DocumentUploadModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [category, setCategory] = useState<string>("")
  const [docName, setDocName] = useState("")
  const [docDescription, setDocDescription] = useState("")
  const { toast } = useToast()
  
  // Note: QueryClient invalidation will be handled by the parent component


  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]) // Allow multiple files
    if (acceptedFiles.length > 0 && files.length === 0) {
      setDocName(acceptedFiles[0].name.replace(/\.[^/.]+$/, "")) // Pre-fill name from first file
    }
  }, [files.length])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc', '.docx'],
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    },
    maxFiles: 10, // Allow up to 10 files
    multiple: true,
  })

  const removeFile = (file: File) => {
    setFiles(prevFiles => prevFiles.filter(f => f !== file))
  }


  const handleUpload = async () => {
    if (files.length > 0 && category) {
      try {
        // Upload each file
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const name = i === 0 ? docName : file.name.replace(/\.[^/.]+$/, "")
          const description = i === 0 ? docDescription : `Uploaded document: ${file.name}`
          
          await companyDocumentsApi.uploadDocument(file, name, description, category)
        }
        
        toast.success(`${files.length} document(s) uploaded successfully!`)
        handleClose()
        // Notify parent component to refresh the documents list
        if (onUploadSuccess) {
          onUploadSuccess()
        }
      } catch (error) {
        toast.error("Failed to upload documents. Please try again.")
      }
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
              <h4 className="text-sm font-medium">Selected Files ({files.length}):</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
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
                <Label htmlFor="docName">Document Name (for first file)</Label>
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
              {files.length > 1 && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  <p>Additional files will use their original names and auto-generated descriptions.</p>
                </div>
              )}
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
          <Button onClick={handleUpload} disabled={files.length === 0 || !category || !docName}>
            Upload {files.length > 1 ? `${files.length} Documents` : 'Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
