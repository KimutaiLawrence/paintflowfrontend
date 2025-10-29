"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { PDFDocument, PDFPage, PDFForm, PDFCheckBox, PDFTextField } from 'pdf-lib'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { SignatureCanvas } from '@/components/signature-canvas'
import { 
  Download, 
  Save, 
  CheckSquare, 
  Square, 
  Pen, 
  Eye,
  FileText,
  Loader2
} from 'lucide-react'

interface PDFEditorProps {
  pdfUrl: string
  documentName: string
  onSave?: (pdfBytes: Uint8Array) => void
  onClose?: () => void
}

interface CheckboxField {
  name: string
  page: number
  x: number
  y: number
  width: number
  height: number
  checked: boolean
}

interface SignatureField {
  name: string
  page: number
  x: number
  y: number
  width: number
  height: number
  signatureData?: string
}

export function PDFEditor({ pdfUrl, documentName, onSave, onClose }: PDFEditorProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null)
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkboxes, setCheckboxes] = useState<CheckboxField[]>([])
  const [signatures, setSignatures] = useState<SignatureField[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [selectedSignatureField, setSelectedSignatureField] = useState<SignatureField | null>(null)
  const [signatureData, setSignatureData] = useState<string>('')
  const [editingMode, setEditingMode] = useState<'view' | 'edit'>('view')
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  console.log('PDFEditor component rendered with:', { pdfUrl, documentName })

  // Load PDF document
  useEffect(() => {
    loadPDF()
  }, [pdfUrl])

  const loadPDF = async () => {
    try {
      console.log('Loading PDF from URL:', pdfUrl)
      setLoading(true)
      setError(null)
      
      const response = await fetch(pdfUrl)
      if (!response.ok) {
        throw new Error('Failed to load PDF')
      }
      
      const arrayBuffer = await response.arrayBuffer()
      console.log('PDF loaded, arrayBuffer size:', arrayBuffer.byteLength)
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      
      setPdfDoc(pdfDoc)
      setPdfBytes(new Uint8Array(arrayBuffer))
      setTotalPages(pdfDoc.getPageCount())
      
      console.log('PDF document loaded successfully, pages:', pdfDoc.getPageCount())
      
      // Extract form fields
      const form = pdfDoc.getForm()
      const fields = form.getFields()
      
      const checkboxFields: CheckboxField[] = []
      const signatureFields: SignatureField[] = []
      
      // For now, we'll create placeholder fields since pdf-lib doesn't easily expose widget page info
      // In a production app, you'd need to use a more sophisticated approach
      fields.forEach((field, index) => {
        const fieldName = field.getName()
        
        if (field instanceof PDFCheckBox) {
          checkboxFields.push({
            name: fieldName,
            page: 0, // Default to first page
            x: 100 + (index * 20), // Placeholder positions
            y: 100 + (index * 20),
            width: 15,
            height: 15,
            checked: field.isChecked()
          })
        } else if (field instanceof PDFTextField && fieldName.toLowerCase().includes('signature')) {
          signatureFields.push({
            name: fieldName,
            page: 0, // Default to first page
            x: 100 + (index * 20), // Placeholder positions
            y: 200 + (index * 20),
            width: 200,
            height: 50
          })
        }
      })
      
      setCheckboxes(checkboxFields)
      setSignatures(signatureFields)
      
    } catch (err) {
      console.error('Error loading PDF:', err)
      setError(err instanceof Error ? err.message : 'Failed to load PDF')
      toast.error("Error loading PDF", { description: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const toggleCheckbox = async (checkboxName: string) => {
    if (!pdfDoc) return
    
    try {
      const form = pdfDoc.getForm()
      const checkbox = form.getCheckBox(checkboxName)
      checkbox.check()
      
      // Update local state
      setCheckboxes(prev => prev.map(cb => 
        cb.name === checkboxName ? { ...cb, checked: !cb.checked } : cb
      ))
      
      toast.success("Checkbox updated")
    } catch (err) {
      toast.error("Failed to update checkbox")
    }
  }

  const addSignature = async (fieldName: string, signatureData: string) => {
    if (!pdfDoc || !signatureData) return
    
    try {
      const form = pdfDoc.getForm()
      const signatureField = form.getTextField(fieldName)
      
      // Convert signature data to image and embed in PDF
      // This is a simplified implementation - in production you'd want to:
      // 1. Convert canvas data to image
      // 2. Embed the image in the PDF
      // 3. Position it correctly
      
      signatureField.setText('Digitally Signed')
      
      // Update local state
      setSignatures(prev => prev.map(sig => 
        sig.name === fieldName ? { ...sig, signatureData } : sig
      ))
      
      toast.success("Signature added")
      setShowSignatureModal(false)
      setSignatureData('')
    } catch (err) {
      toast.error("Failed to add signature")
    }
  }

  const savePDF = async () => {
    if (!pdfDoc) return
    
    try {
      const pdfBytes = await pdfDoc.save()
      setPdfBytes(pdfBytes)
      
      if (onSave) {
        onSave(pdfBytes)
      }
      
      toast.success("PDF saved successfully")
    } catch (err) {
      toast.error("Failed to save PDF")
    }
  }

  const downloadPDF = () => {
    if (!pdfBytes) return
    
    // Convert Uint8Array to regular array for Blob compatibility
    const bytes = new Uint8Array(pdfBytes.length)
    for (let i = 0; i < pdfBytes.length; i++) {
      bytes[i] = pdfBytes[i]
    }
    
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${documentName}_edited.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success("PDF downloaded")
  }

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return
    
    try {
      const page = pdfDoc.getPage(pageNum)
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (!context) return
      
      // Set canvas size
      const { width, height } = page.getSize()
      canvas.width = width
      canvas.height = height
      
      // Render PDF page (simplified - you'd use pdfjs-dist for actual rendering)
      context.fillStyle = 'white'
      context.fillRect(0, 0, width, height)
      
      // Draw checkboxes
      checkboxes
        .filter(cb => cb.page === pageNum)
        .forEach(cb => {
          context.strokeStyle = cb.checked ? '#10b981' : '#6b7280'
          context.lineWidth = 2
          context.strokeRect(cb.x, cb.y, cb.width, cb.height)
          
          if (cb.checked) {
            context.fillStyle = '#10b981'
            context.fillRect(cb.x + 2, cb.y + 2, cb.width - 4, cb.height - 4)
          }
        })
      
      // Draw signature fields
      signatures
        .filter(sig => sig.page === pageNum)
        .forEach(sig => {
          context.strokeStyle = '#3b82f6'
          context.lineWidth = 1
          context.setLineDash([5, 5])
          context.strokeRect(sig.x, sig.y, sig.width, sig.height)
          context.setLineDash([])
          
          if (sig.signatureData) {
            context.fillStyle = '#3b82f6'
            context.font = '12px Arial'
            context.fillText('Signed', sig.x + 5, sig.y + 15)
          }
        })
        
    } catch (err) {
      console.error('Error rendering page:', err)
    }
  }, [pdfDoc, checkboxes, signatures])

  useEffect(() => {
    renderPage(currentPage)
  }, [currentPage, renderPage])

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Loading PDF</DialogTitle>
            <DialogDescription>Please wait while the PDF document is being loaded...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p>Loading PDF...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>An error occurred while loading the PDF document.</DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span>PDF Editor - {documentName}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingMode(editingMode === 'view' ? 'edit' : 'view')}
              >
                {editingMode === 'view' ? <Pen className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {editingMode === 'view' ? 'Edit Mode' : 'View Mode'}
              </Button>
              <Button variant="outline" size="sm" onClick={savePDF}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={downloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            Edit PDF form fields, add signatures, and make changes to the document. Use the tabs on the right to manage checkboxes and signatures.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex">
          {/* PDF Viewer */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-gray-100 p-4 overflow-auto">
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  className="border border-gray-300 shadow-lg bg-white"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>
            </div>
            
            {/* Page Navigation */}
            <div className="flex items-center justify-center gap-4 p-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l bg-white">
            <Tabs defaultValue="checkboxes" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="checkboxes">Checkboxes</TabsTrigger>
                <TabsTrigger value="signatures">Signatures</TabsTrigger>
              </TabsList>
              
              <TabsContent value="checkboxes" className="p-4 space-y-4">
                <h3 className="font-medium">Form Fields</h3>
                {checkboxes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No checkboxes found in this PDF</p>
                ) : (
                  <div className="space-y-2">
                    {checkboxes
                      .filter(cb => cb.page === currentPage)
                      .map((checkbox) => (
                        <Card key={checkbox.name} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCheckbox(checkbox.name)}
                                className="p-1"
                              >
                                {checkbox.checked ? (
                                  <CheckSquare className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Square className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                              <span className="text-sm">{checkbox.name}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${
                              checkbox.checked 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {checkbox.checked ? 'Checked' : 'Unchecked'}
                            </span>
                          </div>
                        </Card>
                      ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="signatures" className="p-4 space-y-4">
                <h3 className="font-medium">Signature Fields</h3>
                {signatures.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No signature fields found in this PDF</p>
                ) : (
                  <div className="space-y-2">
                    {signatures
                      .filter(sig => sig.page === currentPage)
                      .map((signature) => (
                        <Card key={signature.name} className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{signature.name}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                signature.signatureData 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {signature.signatureData ? 'Signed' : 'Unsigned'}
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSignatureField(signature)
                                setShowSignatureModal(true)
                              }}
                              disabled={!!signature.signatureData}
                              className="w-full"
                            >
                              {signature.signatureData ? 'Already Signed' : 'Add Signature'}
                            </Button>
                          </div>
                        </Card>
                      ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Signature Modal */}
        <Dialog open={showSignatureModal} onOpenChange={setShowSignatureModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Digital Signature</DialogTitle>
              <DialogDescription>
                Draw your signature in the canvas below. Use your mouse or touch to create your signature.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <SignatureCanvas
                width={500}
                height={200}
                onSignatureChange={(signatureData) => {
                  setSignatureData(signatureData || '')
                }}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSignatureModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedSignatureField && signatureData) {
                      addSignature(selectedSignatureField.name, signatureData)
                    }
                  }}
                  disabled={!signatureData}
                >
                  <Pen className="h-4 w-4 mr-2" />
                  Add Signature
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
