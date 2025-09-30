"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2 } from "lucide-react"

interface DigitalSignatureProps {
  onSignatureChange: (signature: string) => void
  required?: boolean
  width?: number
  height?: number
}

export default function DigitalSignature({
  onSignatureChange,
  required = false,
  width = 400,
  height = 200,
}: DigitalSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set up canvas
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Add signature line
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(20, height - 20)
    ctx.lineTo(width - 20, height - 20)
    ctx.stroke()

    // Add signature label
    ctx.fillStyle = "#9ca3af"
    ctx.font = "12px sans-serif"
    ctx.fillText("Signature", 20, height - 5)

    // Reset drawing style
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 2
  }, [width, height])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let clientX, clientY
    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = clientX - rect.left
    const y = clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let clientX, clientY
    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = clientX - rect.left
    const y = clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()

    setHasSignature(true)
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    const canvas = canvasRef.current
    if (!canvas) return

    // Convert canvas to base64 and notify parent
    const signature = canvas.toDataURL()
    onSignatureChange(signature)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Redraw signature line and label
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(20, height - 20)
    ctx.lineTo(width - 20, height - 20)
    ctx.stroke()

    ctx.fillStyle = "#9ca3af"
    ctx.font = "12px sans-serif"
    ctx.fillText("Signature", 20, height - 5)

    // Reset drawing style
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 2

    setHasSignature(false)
    onSignatureChange("")
  }

  return (
    <div className="space-y-4">
      <Card className="border-2 border-dashed">
        <CardContent className="p-4">
          <div className="text-center space-y-4">
            <canvas
              ref={canvasRef}
              className="border border-gray-200 rounded cursor-crosshair touch-none"
              style={{ maxWidth: "100%", height: "auto" }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />

            <div className="flex items-center justify-center space-x-2">
              <Button type="button" variant="outline" size="sm" onClick={clearSignature} disabled={!hasSignature}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
              </Button>
              <span className="text-sm text-muted-foreground">
                {hasSignature ? "Signature captured" : "Sign above"}
                {required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Use your mouse or finger to sign above. Your signature will be saved digitally with this form.
      </p>
    </div>
  )
}
