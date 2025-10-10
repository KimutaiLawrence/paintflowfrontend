"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Step {
  title: string
  description?: string
}

interface VerticalStepperProps {
  steps: Step[]
  currentStep: number
}

export function VerticalStepper({ steps, currentStep }: VerticalStepperProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const isComplete = index < currentStep
        const isCurrent = index === currentStep
        
        return (
          <div key={index} className="flex gap-4">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  isComplete && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "border-primary text-primary bg-primary/10",
                  !isComplete && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isComplete ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="font-semibold">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-0.5 h-16 mt-2 transition-colors",
                  index < currentStep ? "bg-primary" : "bg-muted-foreground/30"
                )} />
              )}
            </div>
            
            {/* Step content */}
            <div className="pb-12 flex-1">
              <h3 className={cn(
                "font-semibold text-base",
                isCurrent && "text-primary",
                isComplete && "text-foreground",
                !isCurrent && !isComplete && "text-muted-foreground"
              )}>
                {step.title}
              </h3>
              {step.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

