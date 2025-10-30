"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, Send, AlertCircle, Shield } from "lucide-react"
import { z } from "zod"
import api from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import DigitalSignature from "@/components/forms/digital-signature"

const vssChecklistSchema = z.object({
  job_id: z.string().optional(),
  site_location: z.string().min(1, "Site location is required"),
  weather_conditions: z.string().min(1, "Weather conditions are required"),
  supervisor_name: z.string().min(1, "Supervisor name is required"),

  // Safety Equipment Checks
  safety_helmets: z.boolean(),
  safety_shoes: z.boolean(),
  safety_harness: z.boolean(),
  high_vis_vests: z.boolean(),
  first_aid_kit: z.boolean(),
  fire_extinguisher: z.boolean(),

  // Site Safety Checks
  work_area_barriers: z.boolean(),
  warning_signs: z.boolean(),
  emergency_exits: z.boolean(),
  electrical_safety: z.boolean(),
  scaffold_inspection: z.boolean(),
  ladder_inspection: z.boolean(),

  // Environmental Checks
  noise_levels: z.boolean(),
  dust_control: z.boolean(),
  chemical_storage: z.boolean(),
  waste_disposal: z.boolean(),

  // Additional Notes
  hazards_identified: z.string().optional(),
  corrective_actions: z.string().optional(),
  additional_notes: z.string().optional(),

  // Signatures
  supervisor_signature: z.string().min(1, "Supervisor signature is required"),
  date_completed: z.string().min(1, "Date is required"),
})

type VSSChecklistFormData = z.infer<typeof vssChecklistSchema>

interface VSSChecklistFormProps {
  onComplete?: () => void
  initialData?: Partial<VSSChecklistFormData>
}

const SAFETY_EQUIPMENT_ITEMS = [
  { key: "safety_helmets", label: "Safety Helmets", description: "All workers wearing approved helmets" },
  { key: "safety_shoes", label: "Safety Shoes", description: "Steel-toed safety footwear" },
  { key: "safety_harness", label: "Safety Harness", description: "For work at heights" },
  { key: "high_vis_vests", label: "High-Vis Vests", description: "Reflective safety vests" },
  { key: "first_aid_kit", label: "First Aid Kit", description: "Accessible and fully stocked" },
  { key: "fire_extinguisher", label: "Fire Extinguisher", description: "Present and functional" },
]

const SITE_SAFETY_ITEMS = [
  { key: "work_area_barriers", label: "Work Area Barriers", description: "Proper barricading of work zones" },
  { key: "warning_signs", label: "Warning Signs", description: "Appropriate safety signage displayed" },
  { key: "emergency_exits", label: "Emergency Exits", description: "Clear and accessible" },
  { key: "electrical_safety", label: "Electrical Safety", description: "Proper isolation and protection" },
  { key: "scaffold_inspection", label: "Scaffold Inspection", description: "Daily scaffold safety check" },
  { key: "ladder_inspection", label: "Ladder Inspection", description: "Ladder condition and setup" },
]

const ENVIRONMENTAL_ITEMS = [
  { key: "noise_levels", label: "Noise Levels", description: "Within acceptable limits" },
  { key: "dust_control", label: "Dust Control", description: "Measures in place to control dust" },
  { key: "chemical_storage", label: "Chemical Storage", description: "Proper storage and labeling" },
  { key: "waste_disposal", label: "Waste Disposal", description: "Appropriate waste management" },
]

export default function VSSChecklistForm({ onComplete, initialData }: VSSChecklistFormProps) {
  const { user } = useAuth()
  const [isDraft, setIsDraft] = useState(false)
  const [error, setError] = useState("")
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<VSSChecklistFormData>({
    resolver: zodResolver(vssChecklistSchema),
    defaultValues: {
      supervisor_name: user?.full_name || "",
      date_completed: new Date().toISOString().split("T")[0],
      ...initialData,
    },
  })

  const submitForm = useMutation({
    mutationFn: async (data: VSSChecklistFormData & { status: string }) => {
      const templateId = (initialData as any)?.template_id || ""
      const jobAreaId = (initialData as any)?.job_area_id || ""
      if (!templateId || !jobAreaId) {
        throw new Error("Missing template_id or job_area_id")
      }
      const payload = {
        template_id: templateId,
        job_area_id: jobAreaId,
        form_data: { ...data },
      }
      const response = await api.post("/forms/submit", payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] })
      onComplete?.()
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || "Failed to submit form")
    },
  })

  const onSubmit = (data: VSSChecklistFormData) => {
    setError("")
    submitForm.mutate({ ...data, status: isDraft ? "draft" : "completed" })
  }

  const handleSaveDraft = () => {
    setIsDraft(true)
    handleSubmit(onSubmit)()
  }

  const handleSubmitFinal = () => {
    setIsDraft(false)
    handleSubmit(onSubmit)()
  }

  const allSafetyItems = [...SAFETY_EQUIPMENT_ITEMS, ...SITE_SAFETY_ITEMS, ...ENVIRONMENTAL_ITEMS]

  const checkedItems = allSafetyItems.filter((item) => watch(item.key as keyof VSSChecklistFormData))
  const compliancePercentage = Math.round((checkedItems.length / allSafetyItems.length) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">VSS Daily Safety Checklist</h2>
            <p className="text-muted-foreground">Daily safety inspection and compliance verification</p>
          </div>
        </div>
        <Badge variant={compliancePercentage >= 90 ? "default" : "destructive"}>
          {compliancePercentage}% Compliance
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Site Information</CardTitle>
            <CardDescription>Basic details about the work site and conditions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="site_location">Site Location</Label>
                <Input id="site_location" {...register("site_location")} placeholder="Enter site address or location" />
                {errors.site_location && <p className="text-sm text-destructive">{errors.site_location.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weather_conditions">Weather Conditions</Label>
                <Select onValueChange={(value) => setValue("weather_conditions", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select weather conditions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clear">Clear/Sunny</SelectItem>
                    <SelectItem value="cloudy">Cloudy</SelectItem>
                    <SelectItem value="light_rain">Light Rain</SelectItem>
                    <SelectItem value="heavy_rain">Heavy Rain</SelectItem>
                    <SelectItem value="windy">Windy</SelectItem>
                    <SelectItem value="hot">Hot &gt;30°C</SelectItem>
                  </SelectContent>
                </Select>
                {errors.weather_conditions && (
                  <p className="text-sm text-destructive">{errors.weather_conditions.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisor_name">Supervisor Name</Label>
                <Input id="supervisor_name" {...register("supervisor_name")} placeholder="Enter supervisor name" />
                {errors.supervisor_name && <p className="text-sm text-destructive">{errors.supervisor_name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_completed">Date</Label>
                <Input id="date_completed" type="date" {...register("date_completed")} />
                {errors.date_completed && <p className="text-sm text-destructive">{errors.date_completed.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safety Equipment Checks */}
        <Card>
          <CardHeader>
            <CardTitle>Safety Equipment Checks</CardTitle>
            <CardDescription>Verify all required safety equipment is present and functional</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {SAFETY_EQUIPMENT_ITEMS.map((item) => (
                <div key={item.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={item.key}
                    checked={watch(item.key as keyof VSSChecklistFormData) as boolean}
                    onCheckedChange={(checked) => setValue(item.key as keyof VSSChecklistFormData, checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={item.key} className="font-medium cursor-pointer">
                      {item.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Site Safety Checks */}
        <Card>
          <CardHeader>
            <CardTitle>Site Safety Checks</CardTitle>
            <CardDescription>Verify site safety measures and hazard controls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {SITE_SAFETY_ITEMS.map((item) => (
                <div key={item.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={item.key}
                    checked={watch(item.key as keyof VSSChecklistFormData) as boolean}
                    onCheckedChange={(checked) => setValue(item.key as keyof VSSChecklistFormData, checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={item.key} className="font-medium cursor-pointer">
                      {item.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Environmental Checks */}
        <Card>
          <CardHeader>
            <CardTitle>Environmental Checks</CardTitle>
            <CardDescription>Environmental safety and compliance verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {ENVIRONMENTAL_ITEMS.map((item) => (
                <div key={item.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={item.key}
                    checked={watch(item.key as keyof VSSChecklistFormData) as boolean}
                    onCheckedChange={(checked) => setValue(item.key as keyof VSSChecklistFormData, checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={item.key} className="font-medium cursor-pointer">
                      {item.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Document any hazards, corrective actions, or additional notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hazards_identified">Hazards Identified</Label>
              <Textarea
                id="hazards_identified"
                {...register("hazards_identified")}
                placeholder="Describe any safety hazards identified during inspection..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="corrective_actions">Corrective Actions Taken</Label>
              <Textarea
                id="corrective_actions"
                {...register("corrective_actions")}
                placeholder="Describe corrective actions taken to address hazards..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional_notes">Additional Notes</Label>
              <Textarea
                id="additional_notes"
                {...register("additional_notes")}
                placeholder="Any additional safety observations or comments..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Digital Signature */}
        <Card>
          <CardHeader>
            <CardTitle>Supervisor Signature</CardTitle>
            <CardDescription>Digital signature to confirm inspection completion</CardDescription>
          </CardHeader>
          <CardContent>
            <DigitalSignature onSignatureChange={(signature) => setValue("supervisor_signature", signature)} required />
            {errors.supervisor_signature && (
              <p className="text-sm text-destructive mt-2">{errors.supervisor_signature.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={submitForm.isPending}>
            {submitForm.isPending && isDraft && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button type="button" onClick={handleSubmitFinal} disabled={submitForm.isPending}>
            {submitForm.isPending && !isDraft && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            Submit Form
          </Button>
        </div>
      </form>
    </div>
  )
}
