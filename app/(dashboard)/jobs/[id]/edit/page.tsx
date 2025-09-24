"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useRouter, useParams } from "next/navigation"
import { jobSchema, JobFormData } from "@/lib/validators"
import { jobsApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm as useFormHook } from "react-hook-form"

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string
  const { user } = useAuth()

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => jobsApi.getJob(jobId),
    enabled: !!jobId,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useFormHook<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      description: "",
      address: "",
      priority: "P3",
    },
  })

  // When job data is loaded, reset the form with its values
  useEffect(() => {
    if (job) {
      reset({
        title: job.title,
        description: job.description,
        address: job.address,
        priority: job.priority,
      })
    }
  }, [job, reset])

  const mutation = useMutation({
    mutationFn: (data: JobFormData) => jobsApi.updateJob(jobId, data),
    onSuccess: () => {
      router.push(`/jobs/${jobId}`)
      // Optional: Add a success toast notification here
    },
    onError: (error) => {
      // Optional: Add an error toast notification here
      console.error("Failed to update job:", error)
    },
  })

  const onSubmit = (data: JobFormData) => {
    mutation.mutate(data)
  }

  if (isLoading) return <div><Loader2 className="animate-spin" /> Loading...</div>

  // Protected route check
  if (!user || !['admin', 'manager'].includes(user.role)) {
    return <div>Access Denied. You do not have permission to view this page.</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Job</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-red-500">{errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} />
            {errors.description && <p className="text-red-500">{errors.description.message}</p>}
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} />
            {errors.address && <p className="text-red-500">{errors.address.message}</p>}
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select onValueChange={(value) => reset({ ...getValues(), priority: value })} defaultValue={job?.priority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="P1">P1 (Urgent)</SelectItem>
                <SelectItem value="P2">P2 (Medium)</SelectItem>
                <SelectItem value="P3">P3 (Low)</SelectItem>
              </SelectContent>
            </Select>
            {errors.priority && <p className="text-red-500">{errors.priority.message}</p>}
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Job
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
