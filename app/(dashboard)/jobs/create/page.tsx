"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react"
import { jobCreationSchema, type JobCreationFormData } from "@/lib/validators"
import { useAuth } from "@/hooks/use-auth"
import api from "@/lib/api"
import Link from "next/link"

export default function CreateJobPage() {
  const router = useRouter()
  const { canManageJobs } = useAuth()
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
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

  const priority = watch("priority")

  const createJobMutation = useMutation({
    mutationFn: async (data: JobCreationFormData) => {
      const response = await api.post("/jobs/", data)
      return response.data
    },
    onSuccess: (data) => {
      router.push(`/jobs/${data.id}`)
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || "Failed to create job. Please try again.")
    },
  })

  const onSubmit = (data: JobCreationFormData) => {
    if (!canManageJobs()) {
      setError("You don't have permission to create jobs.")
      return
    }
    setError("")
    createJobMutation.mutate(data)
  }

  if (!canManageJobs()) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You don't have permission to create jobs.</p>
        <Link href="/jobs">
          <Button className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/jobs">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Job</h1>
          <p className="text-muted-foreground">Add a new painting job to the system</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Enter the basic information for the new job</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="e.g., Office Building Exterior Painting"
                disabled={createJobMutation.isPending}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                {...register("address")}
                placeholder="e.g., 123 Main Street, Singapore 123456"
                disabled={createJobMutation.isPending}
              />
              {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setValue("priority", value as "P1" | "P2" | "P3")}
                disabled={createJobMutation.isPending}
              >
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Areas to Paint</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: "" })}
                  disabled={createJobMutation.isPending}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Area
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <div className="flex-1">
                    <Input
                      {...register(`areas.${index}.name`)}
                      placeholder={`Area ${index + 1} (e.g., Living Room, Bedroom, Exterior Wall)`}
                      disabled={createJobMutation.isPending}
                    />
                    {errors.areas?.[index]?.name && (
                      <p className="text-sm text-destructive mt-1">{errors.areas[index]?.name?.message}</p>
                    )}
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={createJobMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {errors.areas && <p className="text-sm text-destructive">{errors.areas.message}</p>}
            </div>

            <div className="flex justify-end space-x-4">
              <Link href="/jobs">
                <Button variant="outline" disabled={createJobMutation.isPending}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={createJobMutation.isPending}>
                {createJobMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Job
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
