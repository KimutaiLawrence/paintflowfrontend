'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

interface SimpleFloorPlanCanvasProps {
  spaceId?: string
  onSave?: (data: any) => void
  onClose?: () => void
}

export default function SimpleFloorPlanCanvas({ 
  spaceId = 'spc_r8ni5bft', 
  onSave, 
  onClose 
}: SimpleFloorPlanCanvasProps) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<'select' | 'rectangle' | 'circle' | 'line' | 'text'>('select')
  const [zoom, setZoom] = useState(1)

  const handleSave = () => {
    if (onSave) {
      onSave({ spaceId, tool, zoom, timestamp: new Date().toISOString() })
    }
  }

  const tools = [
    { id: 'select', label: 'Select', icon: Move },
    { id: 'rectangle', label: 'Rectangle', icon: Square },
    { id: 'circle', label: 'Circle', icon: Circle },
    { id: 'line', label: 'Line', icon: Type },
    { id: 'text', label: 'Text', icon: Type }
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Floor Plan Canvas</h2>
          <Badge variant="outline">
            Space: {spaceId}
          </Badge>
          <Badge variant="secondary">
            Simple Mode
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
            variant="outline"
            size="sm"
          >
            <ZoomOut className="h-4 w-4 mr-2" />
            Zoom Out
          </Button>
          
          <span className="text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
          
          <Button
            onClick={() => setZoom(Math.min(3, zoom + 0.1))}
            variant="outline"
            size="sm"
          >
            <ZoomIn className="h-4 w-4 mr-2" />
            Zoom In
          </Button>
          
          <Button
            onClick={handleSave}
            variant="outline"
            size="sm"
          >
            <Camera className="h-4 w-4 mr-2" />
            Screenshot
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
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r bg-background p-4 space-y-6">
          {/* Drawing Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Drawing Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tools.map((toolItem) => {
                const Icon = toolItem.icon
                return (
                  <Button
                    key={toolItem.id}
                    variant={tool === toolItem.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setTool(toolItem.id as any)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {toolItem.label}
                  </Button>
                )
              })}
            </CardContent>
          </Card>

          {/* Canvas Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Canvas Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Zoom</label>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsDrawing(!isDrawing)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {isDrawing ? 'Stop Drawing' : 'Start Drawing'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Toggle Grid
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Properties Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Selected Tool:</span>
                  <Badge variant="outline">{tool}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Zoom Level:</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Canvas Size:</span>
                  <span>800x600</span>
                </div>
                <div className="flex justify-between">
                  <span>Drawing:</span>
                  <Badge variant={isDrawing ? 'default' : 'secondary'}>
                    {isDrawing ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-muted/20 relative">
          <div className="w-full h-full flex items-center justify-center">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Floor Plan Canvas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    <Square className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Simple Floor Plan Editor</h3>
                    <p className="text-sm text-muted-foreground">
                      This is a simplified floor plan canvas. 
                      The Smplrspace integration is being configured.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="outline">Space ID: {spaceId}</Badge>
                    <Badge variant="outline">Tool: {tool}</Badge>
                    <Badge variant="outline">Zoom: {Math.round(zoom * 100)}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Canvas Status */}
          <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-2">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isDrawing ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span>{isDrawing ? 'Drawing' : 'Ready'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
