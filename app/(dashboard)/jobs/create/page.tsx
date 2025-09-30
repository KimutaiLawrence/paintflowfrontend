"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation } from "@tanstack/react-query"
import { jobsApi } from "@/lib/api"
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
import { Separator } from "@/components/ui/separator"
import { Loader2, PlusCircle, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const areaSchema = z.object({
  name: z.string().min(1, "Area name is required"),
})

const formSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  address: z.string().min(1, "Address is required"),
  priority: z.string().min(1, "Priority is required"),
  description: z.string().optional(),
  areas: z.array(areaSchema).min(1, "At least one job area is required"),
  // New required fields
  serial_no: z.string().optional(),
  location: z.string().optional(),
  block_no: z.string().optional(),
  tc: z.string().optional(),
  unit_no: z.string().optional(),
  resident_number: z.string().optional(),
  area: z.string().optional(),
  report_date: z.string().optional(),
  inspection_date: z.string().optional(),
  repair_schedule: z.string().optional(),
  ultra_schedule: z.string().optional(),
  repair_completion: z.string().optional(),
  status: z.string().optional(),
})

export default function CreateJobPage() {
  const router = useRouter()
  const { toast } = useToast()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      address: "",
      priority: "P3",
      description: "",
      areas: [{ name: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "areas",
  })

  const createJobMutation = useMutation({
    mutationFn: jobsApi.createJob,
    onSuccess: () => {
      toast.success("Job created successfully!")
      router.push("/jobs")
    },
    onError: (error) => {
      toast.error("Failed to create job", error.message)
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    createJobMutation.mutate(values)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Create New Job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Repainting works at Block 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Bishan St 22, Block 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="P1">P1 (High)</SelectItem>
                        <SelectItem value="P2">P2 (Medium)</SelectItem>
                        <SelectItem value="P3">P3 (Low)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any additional details about the job" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* New Required Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="serial_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial No.</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter serial number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select or type location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Bishan">Bishan</SelectItem>
                          <SelectItem value="Tampines">Tampines</SelectItem>
                          <SelectItem value="Jurong">Jurong</SelectItem>
                          <SelectItem value="Woodlands">Woodlands</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Input placeholder="Enter block number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TC (Town Council)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Town Council" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BTPTC">BTPTC</SelectItem>
                          <SelectItem value="CCKTC">CCKTC</SelectItem>
                          <SelectItem value="ECTC">ECTC</SelectItem>
                          <SelectItem value="JBTC">JBTC</SelectItem>
                          <SelectItem value="JCTC">JCTC</SelectItem>
                          <SelectItem value="JRBBTC">JRBBTC</SelectItem>
                          <SelectItem value="JRTC">JRTC</SelectItem>
                          <SelectItem value="MPTC">MPTC</SelectItem>
                          <SelectItem value="TPTC">TPTC</SelectItem>
                          <SelectItem value="WCTC">WCTC</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Input placeholder="Enter unit number" {...field} />
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
                        <Input placeholder="Enter resident number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter area description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                      <FormLabel>Inspection Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="repair_schedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repair Schedule</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ultra_schedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ultra Schedule</FormLabel>
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

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <SelectItem value="repair_completed">Repair Completed</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-4">
                  <FormField
                    control={form.control}
                    name={`areas.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Area Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Living Room & Kitchen" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Separator />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ name: "" })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Area
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild>
              <Link href="/jobs">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createJobMutation.isPending}>
              {createJobMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Job
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
