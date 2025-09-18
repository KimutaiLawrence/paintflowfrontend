"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"

interface ToolboxMeetingFormProps {
  onComplete?: () => void
}

export default function ToolboxMeetingForm({ onComplete }: ToolboxMeetingFormProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Users className="h-6 w-6 text-green-500" />
        <div>
          <h2 className="text-2xl font-bold">Toolbox Meeting Record</h2>
          <p className="text-muted-foreground">Weekly safety meeting documentation</p>
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
