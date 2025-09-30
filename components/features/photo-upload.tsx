"use client"

import { useState, useCallback, useRef } from "react"
import { useDropzone } from "react-dropzone"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Camera, X, MapPin, Calendar, FileImage, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import api from "@/lib/api"
import { cn } from "@/lib/utils"

interface PhotoUploadProps {
  jobId: string
  areaId?: string
  onUploadComplete?: (photos: any[]) => void
  className?: string
}

interface UploadingFile {
  file: File
  id: string
  progress: number
  status: "uploading" | "success" | "error"
  category?: string
  preview: string
  gpsData?: { lat: number; lng: number }
  error?: string
}

const PHOTO_CATEGORIES = [
  { value: "before", label: "Before", color: "bg-blue-100 text-blue-800" },
  { value: "during", label: "During", color: "bg-orange-100 text-orange-800" },
  { value: "after", label: "After", color: "bg-green-100 text-green-800" },
]

// Helper function to compress image
const compressImage = (file: File, maxSizeMB = 2): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      const maxWidth = 1920
      const maxHeight = 1080
      let { width, height } = img

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        },
        "image/jpeg",
        0.8,
      )
    }

    img.src = URL.createObjectURL(file)
  })
}

// Helper function to extract GPS data from EXIF
const extractGPSData = (file: File): Promise<{ lat: number; lng: number } | null> => {
  return new Promise((resolve) => {
    // This is a simplified version - in production, you'd use a library like exif-js
    // For now, we'll simulate GPS extraction
    setTimeout(() => {
      // Simulate GPS data extraction (in real implementation, use EXIF library)
      const hasGPS = Math.random() > 0.5 // 50% chance of having GPS data
      if (hasGPS) {
        resolve({
          lat: 1.3521 + (Math.random() - 0.5) * 0.1, // Singapore area
          lng: 103.8198 + (Math.random() - 0.5) * 0.1,
        })
      } else {
        resolve(null)
      }
    }, 100)
  })
}

export default function PhotoUpload({ jobId, areaId, onUploadComplete, className }: PhotoUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [defaultCategory, setDefaultCategory] = useState<string>("")
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadPhoto = useMutation({
    mutationFn: async ({
      file,
      category,
      gpsData,
    }: { file: File; category: string; gpsData?: { lat: number; lng: number } }) => {
      const formData = new FormData()
      formData.append("photo", file)
      formData.append("job", jobId)
      if (areaId) formData.append("area", areaId)
      formData.append("category", category)
      if (gpsData) {
        formData.append("latitude", gpsData.lat.toString())
        formData.append("longitude", gpsData.lng.toString())
      }

      const response = await api.post("/photos/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-photos", jobId] })
      if (areaId) {
        queryClient.invalidateQueries({ queryKey: ["area-photos", areaId] })
      }
    },
  })

  const processFiles = useCallback(
    async (files: File[]) => {
      const newUploadingFiles: UploadingFile[] = files.map((file) => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: "uploading" as const,
        preview: URL.createObjectURL(file),
      }))

      setUploadingFiles((prev) => [...prev, ...newUploadingFiles])

      for (const uploadingFile of newUploadingFiles) {
        try {
          // Update progress to show processing
          setUploadingFiles((prev) => prev.map((f) => (f.id === uploadingFile.id ? { ...f, progress: 10 } : f)))

          // Compress image if needed
          let processedFile = uploadingFile.file
          if (uploadingFile.file.size > 2 * 1024 * 1024) {
            processedFile = await compressImage(uploadingFile.file)
          }

          setUploadingFiles((prev) => prev.map((f) => (f.id === uploadingFile.id ? { ...f, progress: 30 } : f)))

          // Extract GPS data
          const gpsData = await extractGPSData(processedFile)

          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === uploadingFile.id ? { ...f, progress: 50, gpsData } : f)),
          )

          // Wait for category selection if not set
          if (!defaultCategory) {
            setUploadingFiles((prev) => prev.map((f) => (f.id === uploadingFile.id ? { ...f, progress: 60 } : f)))
            continue
          }

          // Upload the file
          setUploadingFiles((prev) => prev.map((f) => (f.id === uploadingFile.id ? { ...f, progress: 80 } : f)))

          await uploadPhoto.mutateAsync({
            file: processedFile,
            category: defaultCategory,
            gpsData: gpsData || undefined,
          })

          // Mark as success
          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === uploadingFile.id ? { ...f, progress: 100, status: "success" } : f)),
          )

          // Remove after delay
          setTimeout(() => {
            setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadingFile.id))
          }, 2000)
        } catch (error) {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadingFile.id ? { ...f, status: "error", error: "Upload failed. Please try again." } : f,
            ),
          )
        }
      }
    },
    [defaultCategory, uploadPhoto, jobId, areaId],
  )

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const imageFiles = acceptedFiles.filter((file) => file.type.startsWith("image/"))
      if (imageFiles.length > 0) {
        processFiles(imageFiles)
      }
    },
    [processFiles],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: true,
  })

  const handleCategoryChange = (category: string) => {
    setDefaultCategory(category)

    // Process any pending files
    const pendingFiles = uploadingFiles.filter((f) => f.status === "uploading" && !f.category)
    pendingFiles.forEach(async (uploadingFile) => {
      try {
        setUploadingFiles((prev) => prev.map((f) => (f.id === uploadingFile.id ? { ...f, progress: 80, category } : f)))

        await uploadPhoto.mutateAsync({
          file: uploadingFile.file,
          category,
          gpsData: uploadingFile.gpsData,
        })

        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === uploadingFile.id ? { ...f, progress: 100, status: "success" } : f)),
        )

        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadingFile.id))
        }, 2000)
      } catch (error) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id ? { ...f, status: "error", error: "Upload failed. Please try again." } : f,
          ),
        )
      }
    })
  }

  const removeFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const openCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment")
      fileInputRef.current.click()
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Category Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <span className="text-sm font-medium">Photo Category:</span>
        <Select value={defaultCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-[180px] h-12">
            {" "}
            {/* Larger touch target for mobile */}
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {PHOTO_CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value} className="h-12">
                {" "}
                {/* Larger touch target */}
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!defaultCategory && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please select a photo category before uploading.</AlertDescription>
        </Alert>
      )}

      {/* Upload Area */}
      <Card
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          !defaultCategory && "opacity-50 cursor-not-allowed",
        )}
      >
        <CardContent className="p-6 sm:p-8 text-center">
          {" "}
          {/* Responsive padding */}
          <input {...getInputProps()} ref={fileInputRef} disabled={!defaultCategory} />
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center">
              {" "}
              {/* Responsive icon size */}
              <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold">
                {" "}
                {/* Responsive text size */}
                {isDragActive ? "Drop photos here" : "Upload Photos"}
              </h3>
              <p className="text-sm text-muted-foreground">Drag and drop photos here, or tap to select files</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
              {" "}
              {/* Stack buttons on mobile */}
              <Button variant="outline" disabled={!defaultCategory} className="w-full sm:w-auto h-12 bg-transparent">
                {" "}
                {/* Full width on mobile, larger touch target */}
                <FileImage className="mr-2 h-4 w-4" />
                Choose Files
              </Button>
              <Button
                variant="outline"
                onClick={openCamera}
                disabled={!defaultCategory}
                className="w-full sm:w-auto h-12 bg-transparent"
              >
                {" "}
                {/* Full width on mobile, larger touch target */}
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Supports JPEG, PNG, WebP. Images over 2MB will be automatically compressed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Uploading Photos</h4>
          {uploadingFiles.map((file) => (
            <Card key={file.id}>
              <CardContent className="p-3 sm:p-4">
                {" "}
                {/* Responsive padding */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                  {" "}
                  {/* Responsive spacing */}
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {" "}
                    {/* Responsive image size */}
                    <img
                      src={file.preview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    {" "}
                    {/* Added min-width for text truncation */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate pr-2">{file.file.name}</span>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {file.category && (
                          <Badge
                            className={cn("text-xs", PHOTO_CATEGORIES.find((c) => c.value === file.category)?.color)}
                          >
                            {PHOTO_CATEGORIES.find((c) => c.value === file.category)?.label}
                          </Badge>
                        )}
                        {file.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {file.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                        {file.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin" />}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="h-8 w-8 p-0" // Larger touch target
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Progress value={file.progress} className="h-2" />
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground space-y-1 sm:space-y-0">
                        {" "}
                        {/* Stack on mobile */}
                        <span>
                          {file.status === "success" && "Upload complete"}
                          {file.status === "error" && (file.error || "Upload failed")}
                          {file.status === "uploading" && `${file.progress}% uploaded`}
                        </span>
                        <div className="flex items-center space-x-2">
                          {file.gpsData && (
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>GPS</span>
                            </span>
                          )}
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date().toLocaleDateString()}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
