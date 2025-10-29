"use client"

import React from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { GripVertical, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SortableItemProps {
  id: string
  children: React.ReactNode
  isRequired?: boolean
}

function SortableItem({ id, children, isRequired }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing transition-opacity ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            {children}
          </div>
          {isRequired && (
            <Badge variant="secondary" className="text-xs">
              Required
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface SortableDocumentOrderProps {
  items: string[]
  onReorder: (newOrder: string[]) => void
  title: string
  description: string
  requiredItems?: string[]
}

export function SortableDocumentOrder({
  items,
  onReorder,
  title,
  description,
  requiredItems = ['PTW', 'TBM', 'WAH', 'VSS']
}: SortableDocumentOrderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = items.indexOf(active.id as string)
      const newIndex = items.indexOf(over?.id as string)
      
      const newOrder = arrayMove(items, oldIndex, newIndex)
      onReorder(newOrder)
    }
  }

  const resetToDefaults = () => {
    onReorder(['PTW', 'TBM', 'WAH', 'VSS'])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetToDefaults}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((item, index) => (
              <SortableItem
                key={item}
                id={item}
                isRequired={requiredItems.includes(item)}
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    {index + 1}
                  </Badge>
                  <span className="font-medium">{item}</span>
                  <span className="text-sm text-muted-foreground">
                    {getDocumentDescription(item)}
                  </span>
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function getDocumentDescription(code: string): string {
  const descriptions: Record<string, string> = {
    'PTW': 'Permit to Work',
    'TBM': 'Toolbox Meeting',
    'WAH': 'Work at Height',
    'VSS': 'Visual Safety System',
    'FPP': 'Fall Prevention Plan',
    'SWP': 'Safe Work Procedures',
    'RA': 'Risk Assessment',
    'SDS': 'Safety Data Sheet',
    'MS': 'Method Statement',
    'RSR': 'Review Summary Reports',
    'Other': 'Other Documents'
  }
  
  return descriptions[code] || code
}
