"use client"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import { ButtonLoader } from "@/components/ui/custom-loader"
import { jobCreationSchema, type JobCreationFormData } from "@/lib/validators"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"

interface CreateJobDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateJobDialog({ open, onOpenChange }: CreateJobDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<JobCreationFormData>({
    resolver: zodResolver(jobCreationSchema),
    defaultValues: {
      priority: "P3",
      areas: [{ name: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "areas",
  })

  const createJobMutation = useMutation({
    mutationFn: async (data: JobCreationFormData) => {
      const response = await api.post("/jobs/", data)
      return response.data
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job created successfully",
      })
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      reset()
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create job",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: JobCreationFormData) => {
    createJobMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
          <DialogDescription>Create a new painting job with areas and details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input id="title" {...register("title")} placeholder="Enter job title" />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" {...register("address")} placeholder="Enter job site address" rows={3} />
                {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select defaultValue="P3" {...register("priority")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P1">P1 - High Priority</SelectItem>
                    <SelectItem value="P2">P2 - Medium Priority</SelectItem>
                    <SelectItem value="P3">P3 - Low Priority</SelectItem>
                  </SelectContent>
                </Select>
                {errors.priority && <p className="text-sm text-destructive">{errors.priority.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Job Areas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Job Areas
                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "" })}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Area
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end space-x-2">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`areas.${index}.name`}>Area {index + 1} Name</Label>
                    <Input {...register(`areas.${index}.name`)} placeholder="e.g., Living Room, Kitchen, Bedroom" />
                    {errors.areas?.[index]?.name && (
                      <p className="text-sm text-destructive">{errors.areas[index]?.name?.message}</p>
                    )}
                  </div>
                  {fields.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {errors.areas && <p className="text-sm text-destructive">{errors.areas.message}</p>}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createJobMutation.isPending}>
              {createJobMutation.isPending && <ButtonLoader className="mr-2" />}
              Create Job
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
