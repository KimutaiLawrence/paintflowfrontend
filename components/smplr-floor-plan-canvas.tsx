'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { smplrConfig } from '@/lib/smplr-config'
import { 
  Download, 
  Camera, 
  RotateCcw, 
  Square, 
  Circle, 
  Type, 
  Move, 
  Grid,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { loadSmplrJs, Space } from '@smplrspace/smplr-loader'
import './smplr-floor-plan-canvas.css'

interface SmplrFloorPlanCanvasProps {
  spaceId?: string
  onSave?: (data: any) => void
  onClose?: () => void
  onError?: () => void
}

export default function SmplrFloorPlanCanvas({ 
  spaceId = 'spc_r8ni5bft', 
  onSave, 
  onClose,
  onError
}: SmplrFloorPlanCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const spaceRef = useRef<Space | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [mode, setMode] = useState<'2d' | '3d'>('3d')

  // Start viewer - exactly like the official example
  useEffect(() => {
    let mounted = true

    const startViewer = async () => {
      try {
        setIsLoading(true)
        setError(null)

        console.log('Loading Smplrspace...')

        // Use the official approach with loadSmplrJs('umd')
        const smplr = await loadSmplrJs('umd')
        
        if (!mounted) return

        console.log('Creating Space instance...')

        // Create space instance exactly like the official example
        const space = new smplr.Space({
          spaceId: spaceId,
          clientToken: smplrConfig.clientToken,
          containerId: 'smplr-container' // Use containerId like the example
        })

        spaceRef.current = space

        console.log('Starting viewer...')

        // Start the viewer exactly like the official example
        space.startViewer({
          preview: false,
          allowModeChange: true,
          onReady: () => {
            if (!mounted) return
            console.log('Viewer ready!')
            setIsReady(true)
            setIsLoading(false)
          },
          onError: (err: any) => {
            if (!mounted) return
            console.error('Could not start viewer:', err)
            setError(err?.message || 'Failed to start viewer')
            setIsLoading(false)
            onError?.()
          }
        })

      } catch (err) {
        if (!mounted) return
        console.error('Error loading Smplrspace:', err)
        
        // Check if it's a network issue
        const isNetworkError = err instanceof Error && (
          err.message.includes('Failed to load') ||
          err.message.includes('timeout') ||
          err.message.includes('network') ||
          err.message.includes('ERR_NAME_NOT_RESOLVED')
        )
        
        if (isNetworkError) {
          console.log('Smplrspace service unavailable, falling back to simple canvas')
          setError('Smplrspace service unavailable. Using simple canvas instead.')
          setIsLoading(false)
          onError?.() // This will trigger the fallback
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load floor plan viewer')
          setIsLoading(false)
          onError?.()
        }
      }
    }

    // Start the viewer
    startViewer()

    return () => {
      mounted = false
      
      if (spaceRef.current) {
        try {
          spaceRef.current.remove()
        } catch (err) {
          console.warn('Error cleaning up Smplrspace:', err)
        }
        spaceRef.current = null
      }
    }
  }, [spaceId, onError])

  const handleTakeScreenshot = async () => {
    if (!spaceRef.current || !isReady) return

    try {
      await spaceRef.current.takeScreenshot({
        mode: '3d-scene',
        width: 1920,
        height: 1080
      })
    } catch (err) {
      console.error('Error taking screenshot:', err)
    }
  }

  const handleDownloadScreenshot = async () => {
    if (!spaceRef.current || !isReady) return

    try {
      const file = await spaceRef.current.takeScreenshotToFile({
        mode: '3d-scene',
        width: 1920,
        height: 1080
      })
      
      // Create download link
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = `floor-plan-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading screenshot:', err)
    }
  }

  const handleToggleMode = () => {
    if (!spaceRef.current || !isReady) return
    
    const newMode = mode === '2d' ? '3d' : '2d'
    
    try {
      spaceRef.current.setMode(newMode)
      setMode(newMode)
    } catch (err) {
      console.error('Error toggling mode:', err)
    }
  }

  const handleSave = () => {
    if (onSave && spaceRef.current && isReady) {
      try {
        const definition = spaceRef.current.getDefinition()
        onSave(definition)
      } catch (err) {
        console.error('Error saving floor plan:', err)
      }
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Floor Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Debug info:
                <br />- Space ID: {spaceId}
                <br />- Client Token: {smplrConfig.clientToken ? '✓ Set' : '✗ Missing'}
                <br />- Container: {containerRef.current ? '✓ Ready' : '✗ Not Ready'}
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry
              </Button>
              {onError && (
                <Button onClick={onError} variant="secondary">
                  Use Simple Canvas
                </Button>
              )}
              {onClose && (
                <Button onClick={onClose} variant="secondary">
                  Close
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Floor Plan Canvas</h2>
          <Badge variant="outline">
            Space: {spaceId}
          </Badge>
          {isReady && (
            <Badge variant="secondary">
              {mode.toUpperCase()} Mode
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isReady && (
            <>
              <Button
                onClick={handleToggleMode}
                variant="outline"
                size="sm"
              >
                <Grid className="h-4 w-4 mr-2" />
                Switch to {mode === '2d' ? '3D' : '2D'}
              </Button>
              
              <Button
                onClick={handleTakeScreenshot}
                variant="outline"
                size="sm"
              >
                <Camera className="h-4 w-4 mr-2" />
                Screenshot
              </Button>
              
              <Button
                onClick={handleDownloadScreenshot}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              
              {onSave && (
                <Button onClick={handleSave} size="sm">
                  Save Floor Plan
                </Button>
              )}
              
              {onClose && (
                <Button onClick={onClose} variant="secondary" size="sm">
                  Close
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading floor plan...</p>
            </div>
          </div>
        )}
        
        <div className="smplr-wrapper">
          <div 
            id="smplr-container"
            ref={containerRef}
            className="smplr-embed"
          />
        </div>
      </div>
    </div>
  )
}
