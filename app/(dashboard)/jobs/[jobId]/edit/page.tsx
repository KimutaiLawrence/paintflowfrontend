"use client"

import React, { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { jobsApi, JobDetail } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageLoader, ButtonLoader } from "@/components/ui/custom-loader"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const formSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  priority: z.string().min(1, "Priority is required"),
  description: z.string().optional(),
  serial_no: z.string().optional(),
  location: z.string().optional(),
  block_no: z.string().optional(),
  tc: z.string().optional(),
  unit_no: z.string().optional(),
  resident_number: z.string().optional(),
  area: z.string().optional(),
  report_date: z.string().optional(),
  inspection_date: z.string().optional(),
  repair_schedule_start: z.string().optional(),
  repair_schedule_end: z.string().optional(),
  ultra_schedule_start: z.string().optional(),
  ultra_schedule_end: z.string().optional(),
  repair_completion: z.string().optional(),
  status: z.string().optional(),
  areas: z.array(z.object({
    name: z.string().min(1, "Area name is required")
  })).optional(),
})

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.jobId as string
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: job, isLoading: isJobLoading } = useQuery<JobDetail>({
    queryKey: ["job", jobId],
    queryFn: () => jobsApi.getJob(jobId),
    enabled: !!jobId,
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      priority: "P3",
      description: "",
      serial_no: "",
      location: "",
      block_no: "",
      tc: "",
      unit_no: "",
      resident_number: "",
      area: "",
      report_date: "",
      inspection_date: "",
      repair_schedule_start: "",
      repair_schedule_end: "",
      ultra_schedule_start: "",
      ultra_schedule_end: "",
      repair_completion: "",
      status: "",
      areas: [],
    },
  })
  
  useEffect(() => {
    if (job) {
      form.reset({
        title: job.title || "",
        priority: job.priority || "P3",
        description: job.description || "",
        serial_no: job.serial_no ? String(job.serial_no) : "",
        location: job.location || "",
        block_no: job.block_no || "",
        tc: job.tc || "",
        unit_no: job.unit_no || "",
        resident_number: job.resident_number || "",
        area: job.area || "",
        report_date: job.report_date ? job.report_date.split('T')[0] : "",
        inspection_date: job.inspection_date ? job.inspection_date.split('T')[0] : "",
        repair_schedule_start: job.repair_schedule_start ? job.repair_schedule_start.split('T')[0] : "",
        repair_schedule_end: job.repair_schedule_end ? job.repair_schedule_end.split('T')[0] : "",
        ultra_schedule_start: job.ultra_schedule_start ? job.ultra_schedule_start.split('T')[0] : "",
        ultra_schedule_end: job.ultra_schedule_end ? job.ultra_schedule_end.split('T')[0] : "",
        repair_completion: job.repair_completion ? job.repair_completion.split('T')[0] : "",
        status: job.status || "",
        areas: job.areas ? job.areas.map(area => ({ name: area.name })) : [],
      })
    }
  }, [job, form])

  const updateJobMutation = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) => jobsApi.updateJob(jobId, values),
    onSuccess: () => {
      toast.success("Success", {
        description: "Job updated successfully!",
      })
      queryClient.invalidateQueries({ queryKey: ["job", jobId] })
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      // Refresh notifications after job update
      if ((window as any).refreshNotifications) {
        (window as any).refreshNotifications()
      }
      router.push(`/jobs/${jobId}`)
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Failed to update job"
      toast.error("Error", {
        description: errorMessage,
      })
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Remove serial_no from update data since it's auto-generated and shouldn't be changed
    const { serial_no, ...updateData } = values
    updateJobMutation.mutate(updateData)
  }
  
  if (isJobLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <PageLoader />
      </div>
    )
  }

  return (
    <div className="w-full p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" key={job?.id}>
          {/* Step 1: Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Repainting works at Block 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any additional details about the job" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="P1">P1 - High Priority</SelectItem>
                          <SelectItem value="P2">P2 - Medium Priority</SelectItem>
                          <SelectItem value="P3">P3 - Low Priority</SelectItem>
                          <SelectItem value="blank">- (Blank)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending_survey">Pending Survey</SelectItem>
                          <SelectItem value="pending_repair">Pending Repair</SelectItem>
                          <SelectItem value="left_primer">Left Primer</SelectItem>
                          <SelectItem value="left_ultra">Left Ultra</SelectItem>
                          <SelectItem value="left_top_coat_cover_slab">Left Top Coat/Cover Slab</SelectItem>
                          <SelectItem value="in_review">In Review</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Job Details */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <FormControl>
                      <Input placeholder="Location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="tc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Town Council</FormLabel>
                      <FormControl>
                        <Input placeholder="Town Council" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="block_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Block No.</FormLabel>
                      <FormControl>
                        <Input placeholder="Block number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit No.</FormLabel>
                      <FormControl>
                        <Input placeholder="Unit number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resident_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resident Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Resident number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area</FormLabel>
                    <FormControl>
                      <Input placeholder="Area" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Job Areas */}
              <FormField
                control={form.control}
                name="areas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Areas</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {field.value?.map((area, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={area.name}
                                onChange={(e) => {
                                  const newAreas = [...(field.value || [])]
                                  newAreas[index] = { ...area, name: e.target.value }
                                  field.onChange(newAreas)
                                }}
                                placeholder="Area name"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  const newAreas = field.value?.filter((_, i) => i !== index) || []
                                  field.onChange(newAreas)
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const newAreas = [...(field.value || []), { name: "" }]
                            field.onChange(newAreas)
                          }}
                          className="w-full"
                        >
                          Add Area
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Step 3: Schedule & Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule & Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="report_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inspection_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inspection Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="repair_completion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repair Completion</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-4">Repair Schedule</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="repair_schedule_start"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="repair_schedule_end"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-4">Ultra Schedule</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ultra_schedule_start"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ultra_schedule_end"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild>
              <Link href={`/jobs/${jobId}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={updateJobMutation.isPending}>
              {updateJobMutation.isPending && <ButtonLoader className="mr-2" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}