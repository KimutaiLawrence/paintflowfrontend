'use client'

import { Suspense, useState } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Dynamically import the floor plan canvas with fallback
const FloorPlanCanvas = dynamic(() => import('@/components/smplr-floor-plan-canvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Loading floor plan viewer...</p>
      </div>
    </div>
  )
})

// Fallback component
const SimpleFloorPlanCanvas = dynamic(() => import('@/components/simple-floor-plan-canvas'), {
  ssr: false
})

export default function FloorPlanCanvasPage() {
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template')
  const [useFallback, setUseFallback] = useState(false)

  const handleSave = (data: any) => {
    console.log('Floor plan saved:', data)
    // Here you would typically save to your backend
    // For now, just show a success message
    alert('Floor plan saved successfully!')
  }

  const handleClose = () => {
    // Navigate back to floor plans list
    window.location.href = '/floor-plans'
  }

  const handleError = () => {
    console.log('Smplrspace failed, switching to simple canvas')
    setUseFallback(true)
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Link href="/floor-plans">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Floor Plans
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Floor Plan Viewer</h1>
          {templateId && (
            <span className="text-sm text-muted-foreground">
              Template: {templateId}
            </span>
          )}
          {useFallback && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-orange-600">
                Using Simple Canvas (Smplrspace unavailable)
              </span>
              <Button
                onClick={() => setUseFallback(false)}
                variant="outline"
                size="sm"
              >
                Retry Smplrspace
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <Suspense fallback={
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading floor plan viewer...</p>
            </div>
          </div>
        }>
          {useFallback ? (
            <SimpleFloorPlanCanvas
              onSave={handleSave}
              onClose={handleClose}
            />
          ) : (
            <FloorPlanCanvas
              spaceId={templateId || 'spc_r8ni5bft'}
              onSave={handleSave}
              onClose={handleClose}
              onError={handleError}
            />
          )}
        </Suspense>
      </div>
    </div>
  )
}