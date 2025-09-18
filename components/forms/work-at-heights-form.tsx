"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface WorkAtHeightsFormProps {
  onComplete?: () => void
}

export default function WorkAtHeightsForm({ onComplete }: WorkAtHeightsFormProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <AlertTriangle className="h-6 w-6 text-orange-500" />
        <div>
          <h2 className="text-2xl font-bold">Permit to Work at Heights</h2>
          <p className="text-muted-foreground">Safety permit for work above 3 meters</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Coming Soon</CardTitle>
          <CardDescription>
            This form is currently under development. Please use the paper version for now.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onComplete}>Close</Button>
        </CardContent>
      </Card>
    </div>
  )
}
