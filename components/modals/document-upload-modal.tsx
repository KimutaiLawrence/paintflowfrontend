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
import { useMutation, useQuery } from '@tanstack/react-query'
import { companyDocumentsApi, documentCategoriesApi } from '@/lib/api'
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

export function DocumentUploadModal({ isOpen, onClose, onUploadSuccess }: DocumentUploadModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [category, setCategory] = useState<string>("")
  const [docName, setDocName] = useState("")
  const [docDescription, setDocDescription] = useState("")
  const [newCategoryCode, setNewCategoryCode] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false)
  const { toast } = useToast()
  
  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["document-categories"],
    queryFn: documentCategoriesApi.getCategories,
  })
  
  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: documentCategoriesApi.createCategory,
    onSuccess: () => {
      toast.success("Category created successfully")
      setShowNewCategoryForm(false)
      setNewCategoryCode("")
      setNewCategoryName("")
    },
    onError: (error: any) => {
      toast.error("Failed to create category: " + (error.response?.data?.message || "Please try again"))
    }
  })

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

  const handleCreateCategory = () => {
    if (newCategoryCode && newCategoryName) {
      createCategoryMutation.mutate({
        code: newCategoryCode.toUpperCase(),
        name: newCategoryName,
        description: `Category for ${newCategoryName} documents`
      })
    }
  }

  const handleClose = () => {
    setFiles([])
    setCategory("")
    setDocName("")
    setDocDescription("")
    setNewCategoryCode("")
    setNewCategoryName("")
    setShowNewCategoryForm(false)
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

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select onValueChange={setCategory} value={category}>
              <SelectTrigger>
                <SelectValue placeholder="Select a document category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.code}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: cat.color || '#3B82F6' }}
                      />
                      <span>{cat.code} - {cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="__create_new__">
                  <div className="flex items-center space-x-2">
                    <span className="text-primary">+ Create New Category</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {category === "__create_new__" && (
              <div className="space-y-3 p-3 border rounded-md bg-muted/50">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="newCategoryCode">Code *</Label>
                    <Input
                      id="newCategoryCode"
                      value={newCategoryCode}
                      onChange={(e) => setNewCategoryCode(e.target.value.toUpperCase())}
                      placeholder="e.g., FPP"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCategoryName">Name *</Label>
                    <Input
                      id="newCategoryName"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g., Fall Prevention Plan"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={handleCreateCategory}
                    disabled={!newCategoryCode || !newCategoryName || createCategoryMutation.isPending}
                  >
                    {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setCategory("")
                      setNewCategoryCode("")
                      setNewCategoryName("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
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
