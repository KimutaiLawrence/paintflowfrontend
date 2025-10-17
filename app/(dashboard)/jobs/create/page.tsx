"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { jobsApi, locationsApi, townCouncilsApi, jobTitlesApi, jobAreasApi, type Location, type TownCouncil, type JobTitle, type JobArea } from "@/lib/api"
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
  FormDescription,
} from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VerticalStepper } from "@/components/ui/vertical-stepper"
import { Combobox } from "@/components/ui/combobox"
import { DateRangeFields } from "@/components/ui/date-range-input"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { ButtonLoader } from "@/components/ui/custom-loader"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

const areaSchema = z.object({
  name: z.string().min(1, "Area name is required"),
})

const formSchema = z.object({
  // Step 1: Basic Information
  job_title_id: z.string().optional(),
  title: z.string().min(1, "Job title is required"),
  description: z.string().optional(),
  priority: z.enum(["P1", "P2", "P3", "blank"]).default("P3"),
  
  // Step 2: Job Details
  location_id: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  town_council_id: z.string().optional(),
  tc: z.string().min(1, "Town council is required"),
  street_name: z.string().optional(),
  block_no: z.string().min(1, "Block number is required"),
  unit_no: z.string().min(1, "Unit number is required"),
  resident_number: z.string().min(1, "Resident number is required"),
  area: z.string().min(1, "Main area is required"),
  
  // Step 3: Schedule & Dates
  report_date: z.string(),
  inspection_date: z.string().min(1, "Inspection date is required"),
  repair_schedule_start: z.string().min(1, "Repair schedule start is required"),
  repair_schedule_end: z.string().min(1, "Repair schedule end is required"),
  ultra_schedule_start: z.string().optional(),
  ultra_schedule_end: z.string().optional(),
  repair_completion: z.string().optional(),
  
  // Areas
  areas: z.array(areaSchema).min(1, "At least one job area is required"),
})

type FormData = z.infer<typeof formSchema>

const steps = [
  { title: "Basic Information", description: "Job title and priority" },
  { title: "Job Details", description: "Location and property details" },
  { title: "Schedule & Dates", description: "Timeline and milestones" },
]

export default function CreateJobPage() {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(0)
  const [customLocation, setCustomLocation] = useState("")
  const [customTC, setCustomTC] = useState("")
  
  // State for job title creation dialog
  const [showJobTitleDialog, setShowJobTitleDialog] = useState(false)
  const [newJobTitleData, setNewJobTitleData] = useState({ title: "", description: "" })

  // Fetch job titles, locations, and town councils
  const { data: jobTitlesData } = useQuery({
    queryKey: ["jobTitles"],
    queryFn: () => jobTitlesApi.getJobTitles({ per_page: 100 }),
  })
  const jobTitles = jobTitlesData?.data || []
  const defaultJobTitle = jobTitles.find((jt: JobTitle) => jt.is_default)

  const { data: locationsData } = useQuery({
    queryKey: ["locations"],
    queryFn: () => locationsApi.getLocations({ per_page: 100 }),
  })
  const locations = locationsData?.data || []

  const { data: townCouncilsData } = useQuery({
    queryKey: ["townCouncils"],
    queryFn: () => townCouncilsApi.getTownCouncils({ per_page: 100 }),
  })
  const townCouncils = townCouncilsData?.data || []

  const { data: predefinedAreasData } = useQuery({
    queryKey: ["predefinedAreas"],
    queryFn: () => jobsApi.getPredefinedAreas(),
  })
  const predefinedAreas = predefinedAreasData?.areas || []

  const { data: jobAreasData } = useQuery({
    queryKey: ["jobAreas"],
    queryFn: () => jobAreasApi.getJobAreas({ per_page: 100 }),
  })
  const jobAreas = jobAreasData?.data || []

  // Auto-fill report_date with today
  const today = new Date().toISOString().split("T")[0]

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      job_title_id: "",
      title: "",
      description: "",
      priority: "P3",
      location: "",
      location_id: "",
      tc: "",
      town_council_id: "",
      street_name: "",
      block_no: "",
      unit_no: "",
      resident_number: "",
      area: "",
      report_date: today, // Auto-filled
      inspection_date: "",
      repair_schedule_start: "",
      repair_schedule_end: "",
      ultra_schedule_start: "",
      ultra_schedule_end: "",
      repair_completion: "",
      areas: [{ name: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "areas",
  })

  // Auto-fill title and description from default job title
  useEffect(() => {
    if (defaultJobTitle && !form.getValues("title")) {
      form.setValue("job_title_id", defaultJobTitle.id)
      form.setValue("title", defaultJobTitle.title)
      if (defaultJobTitle.description) {
        form.setValue("description", defaultJobTitle.description)
      }
    }
  }, [defaultJobTitle, form])

  // Auto-calculate ultra_schedule when repair_schedule changes
  const repairScheduleStart = form.watch("repair_schedule_start")
  const repairScheduleEnd = form.watch("repair_schedule_end")
  
  useEffect(() => {
    if (repairScheduleStart) {
      const repairStartDate = new Date(repairScheduleStart)
      const repairEndDate = new Date(repairStartDate)
      repairEndDate.setDate(repairEndDate.getDate() + 7) // Add 7 days for end date
      
      // Set repair schedule end if not already set
      if (!repairScheduleEnd) {
        form.setValue("repair_schedule_end", repairEndDate.toISOString().split("T")[0])
      }
      
      // Auto-calculate ultra schedule (7 days after repair schedule end)
      const ultraStartDate = new Date(repairEndDate)
      ultraStartDate.setDate(ultraStartDate.getDate() + 1) // Start day after repair ends
      const ultraEndDate = new Date(ultraStartDate)
      ultraEndDate.setDate(ultraEndDate.getDate() + 7) // 7-day range for ultra
      
      form.setValue("ultra_schedule_start", ultraStartDate.toISOString().split("T")[0])
      form.setValue("ultra_schedule_end", ultraEndDate.toISOString().split("T")[0])
    }
  }, [repairScheduleStart, repairScheduleEnd, form])

  const createMutation = useMutation({
    mutationFn: (data: FormData) => jobsApi.createJob(data),
    onSuccess: () => {
      toast.success("Success", { description: "Job created successfully" })
      router.push("/jobs")
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to create job"
      toast.error("Error", { description: errorMessage })
    },
  })

  const createJobTitleMutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) => jobTitlesApi.createJobTitle(data),
    onSuccess: (newJobTitle) => {
      queryClient.invalidateQueries({ queryKey: ["jobTitles"] })
      form.setValue("job_title_id", newJobTitle.id)
      form.setValue("title", newJobTitle.title)
      if (newJobTitle.description) {
        form.setValue("description", newJobTitle.description)
      }
      setShowJobTitleDialog(false)
      setNewJobTitleData({ title: "", description: "" })
      toast.success("Success", { description: "Job title created successfully" })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to create job title"
      toast.error("Error", { description: errorMessage })
    },
  })

  const createJobAreaMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => jobAreasApi.createJobArea(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobAreas"] })
      toast.success("Success", { description: "Job area created successfully" })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to create job area"
      toast.error("Error", { description: errorMessage })
    },
  })

  const handleCreateJobTitle = () => {
    if (!newJobTitleData.title.trim()) {
      toast.error("Error", { description: "Job title is required" })
      return
    }
    createJobTitleMutation.mutate(newJobTitleData)
  }

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data)
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = []
    
    if (currentStep === 0) {
      fieldsToValidate = ["title", "priority"]
    } else if (currentStep === 1) {
      fieldsToValidate = ["location", "tc", "block_no", "unit_no", "resident_number", "area"]
    } else if (currentStep === 2) {
      fieldsToValidate = ["inspection_date", "repair_schedule_start", "repair_schedule_end"]
    }

    const result = await form.trigger(fieldsToValidate)
    if (result && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Convert locations to combobox options
  const locationOptions = locations.map((loc: Location) => ({
    value: loc.id,
    label: loc.name,
  }))

  // Convert town councils to combobox options with shortform
  const tcOptions = townCouncils.map((tc: TownCouncil) => ({
    value: tc.id,
    label: `${tc.name} (${tc.shortform})`,
  }))

  return (
    <div className="container max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Job</h1>
        <p className="text-muted-foreground mt-2">
          Fill in the job details across three steps
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Vertical Stepper (Left) */}
        <div className="lg:sticky lg:top-6 h-fit">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <VerticalStepper steps={steps} currentStep={currentStep} />
            </CardContent>
          </Card>
        </div>

        {/* Form Content (Right) */}
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{steps[currentStep].title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Step 1: Basic Information */}
                  {currentStep === 0 && (
                    <>
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title *</FormLabel>
                            <FormControl>
                              <Combobox
                                options={jobTitles.map((jt: JobTitle) => ({
                                  value: jt.id,
                                  label: jt.is_default ? `${jt.title} (Default)` : jt.title,
                                }))}
                                value={form.watch("job_title_id")}
                                onSelect={(value) => {
                                  const selected = jobTitles.find((jt: JobTitle) => jt.id === value)
                                  if (selected) {
                                    form.setValue("job_title_id", selected.id)
                                    form.setValue("title", selected.title)
                                    if (selected.description) {
                                      form.setValue("description", selected.description)
                                    }
                                  }
                                }}
                                onCustomValue={(value) => {
                                  // Open dialog to create new job title with description
                                  setNewJobTitleData({ title: value, description: "" })
                                  setShowJobTitleDialog(true)
                                }}
                                placeholder="Select or type job title"
                                searchPlaceholder="Search job titles..."
                                allowCustom
                              />
                            </FormControl>
                            <FormDescription>
                              Select from existing job titles or type to create a new one
                            </FormDescription>
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
                              <Textarea
                                placeholder="Enter job description (optional)"
                                {...field}
                              />
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
                            <FormLabel>Priority *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
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
                    </>
                  )}

                  {/* Step 2: Job Details */}
                  {currentStep === 1 && (
                    <>
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location *</FormLabel>
                            <FormControl>
                              <Combobox
                                options={locationOptions}
                                value={form.watch("location_id")}
                                onSelect={(value) => {
                                  const selected = locations.find((l: Location) => l.id === value)
                                  if (selected) {
                                    form.setValue("location_id", selected.id)
                                    form.setValue("location", selected.name)
                                  }
                                }}
                                onCustomValue={async (value) => {
                                  try {
                                    const newLocation = await locationsApi.createLocation({ name: value })
                                    form.setValue("location_id", newLocation.id)
                                    form.setValue("location", newLocation.name)
                                    // Refetch locations
                                    queryClient.invalidateQueries({ queryKey: ["locations"] })
                                  } catch (error) {
                                    form.setValue("location", value)
                                    form.setValue("location_id", "")
                                  }
                                }}
                                placeholder="Select or type location..."
                                searchPlaceholder="Search locations..."
                                emptyText="No location found."
                                allowCustom={true}
                              />
                            </FormControl>
                            <FormDescription>
                              Select from list or type to create new
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Town Council *</FormLabel>
                            <FormControl>
                              <Combobox
                                options={tcOptions}
                                value={form.watch("town_council_id")}
                                onSelect={(value) => {
                                  const selected = townCouncils.find((tc: TownCouncil) => tc.id === value)
                                  if (selected) {
                                    form.setValue("town_council_id", selected.id)
                                    form.setValue("tc", selected.shortform)
                                  }
                                }}
                                onCustomValue={async (value) => {
                                  try {
                                    // Auto-generate shortform from name (first letters of each word)
                                    const shortform = value
                                      .split(' ')
                                      .map(word => word.charAt(0).toUpperCase())
                                      .join('') + 'TC'
                                    
                                    const newTC = await townCouncilsApi.createTownCouncil({ 
                                      name: value, 
                                      shortform 
                                    })
                                    form.setValue("town_council_id", newTC.id)
                                    form.setValue("tc", newTC.shortform)
                                    // Refetch town councils
                                    queryClient.invalidateQueries({ queryKey: ["townCouncils"] })
                                  } catch (error) {
                                    form.setValue("tc", value)
                                    form.setValue("town_council_id", "")
                                  }
                                }}
                                placeholder="Select or type town council..."
                                searchPlaceholder="Search town councils..."
                                emptyText="No town council found."
                                allowCustom={true}
                              />
                            </FormControl>
                            <FormDescription>
                              Select from list or type to create new
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="street_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter street name (optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="block_no"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Block No *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 123" {...field} />
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
                              <FormLabel>Unit No *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., #12-297" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="resident_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resident Number *</FormLabel>
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
                            <FormLabel>Main Area *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Sydney Apartments, 123 Main Street" {...field} />
                            </FormControl>
                            <FormDescription>
                              Main location/address where the job is taking place
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Job Areas */}
                      <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium">Job Areas *</label>
                            <p className="text-xs text-gray-500">Select specific rooms/spaces within the main area</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ name: "" })}
                          >
                            Add Area
                          </Button>
                        </div>
                        {fields.map((field, index) => (
                          <div key={field.id} className="flex gap-2">
                            <FormField
                              control={form.control}
                              name={`areas.${index}.name`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Combobox
                                      options={jobAreas.map((area: JobArea) => ({
                                        value: area.name,
                                        label: area.name,
                                      }))}
                                      value={field.value}
                                      onSelect={(value) => {
                                        field.onChange(value)
                                      }}
                                      onCustomValue={async (value) => {
                                        try {
                                          await createJobAreaMutation.mutateAsync({ name: value })
                                          field.onChange(value)
                                        } catch (error) {
                                          // If creation fails, still set the value
                                          field.onChange(value)
                                        }
                                      }}
                                      placeholder="Select or type area name (e.g., Kitchen, Master Bedroom)"
                                      searchPlaceholder="Search job areas..."
                                      emptyText="No job area found."
                                      allowCustom={true}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => remove(index)}
                              >
                                ×
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Step 3: Schedule & Dates */}
                  {currentStep === 2 && (
                    <>
                      <FormField
                        control={form.control}
                        name="report_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Report Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} disabled />
                            </FormControl>
                            <FormDescription>
                              Auto-filled with current date
                            </FormDescription>
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

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-3">Repair Schedule *</h4>
                          <DateRangeFields
                            startDate={(() => {
                              const start = form.watch("repair_schedule_start")
                              return start ? new Date(start) : undefined
                            })()}
                            endDate={(() => {
                              const end = form.watch("repair_schedule_end")
                              return end ? new Date(end) : undefined
                            })()}
                            onStartDateChange={(date) => {
                              form.setValue("repair_schedule_start", date ? date.toISOString().split("T")[0] : "")
                            }}
                            onEndDateChange={(date) => {
                              form.setValue("repair_schedule_end", date ? date.toISOString().split("T")[0] : "")
                            }}
                            startLabel="Repair Start Date"
                            endLabel="Repair End Date"
                          />
                          <FormField
                            control={form.control}
                            name="repair_schedule_start"
                            render={({ field }) => (
                              <FormMessage />
                            )}
                          />
                      <FormField
                        control={form.control}
                            name="repair_schedule_end"
                        render={({ field }) => (
                            <FormMessage />
                            )}
                          />
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-3">Ultra Schedule</h4>
                          <DateRangeFields
                            startDate={(() => {
                              const start = form.watch("ultra_schedule_start")
                              return start ? new Date(start) : undefined
                            })()}
                            endDate={(() => {
                              const end = form.watch("ultra_schedule_end")
                              return end ? new Date(end) : undefined
                            })()}
                            onStartDateChange={(date) => {
                              form.setValue("ultra_schedule_start", date ? date.toISOString().split("T")[0] : "")
                            }}
                            onEndDateChange={(date) => {
                              form.setValue("ultra_schedule_end", date ? date.toISOString().split("T")[0] : "")
                            }}
                            startLabel="Ultra Start Date"
                            endLabel="Ultra End Date"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Auto-calculated based on repair schedule, but can be manually adjusted
                          </p>
                          <FormField
                            control={form.control}
                            name="ultra_schedule_start"
                            render={({ field }) => (
                              <FormMessage />
                            )}
                          />
                      <FormField
                        control={form.control}
                            name="ultra_schedule_end"
                        render={({ field }) => (
                            <FormMessage />
                        )}
                      />
                        </div>
                      </div>

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
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  <span className="flex items-center">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </span>
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button type="button" onClick={nextStep}>
                    <span className="flex items-center">
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  </Button>
                ) : (
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? (
                      <span className="flex items-center">
                        <ButtonLoader className="mr-2" />
                        Creating...
                      </span>
                    ) : (
                      "Create Job"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Job Title Creation Dialog */}
      <Dialog open={showJobTitleDialog} onOpenChange={setShowJobTitleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Job Title</DialogTitle>
            <DialogDescription>
              Add a new job title template that can be reused for future jobs.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-job-title">Title *</Label>
              <Input
                id="new-job-title"
                value={newJobTitleData.title}
                onChange={(e) => setNewJobTitleData({ ...newJobTitleData, title: e.target.value })}
                placeholder="e.g., Waterproofing Repair Works"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-job-description">Description</Label>
              <Textarea
                id="new-job-description"
                value={newJobTitleData.description}
                onChange={(e) => setNewJobTitleData({ ...newJobTitleData, description: e.target.value })}
                placeholder="Brief description of this job type"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJobTitleDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateJobTitle} 
              disabled={!newJobTitleData.title.trim() || createJobTitleMutation.isPending}
            >
              {createJobTitleMutation.isPending ? (
                <span className="flex items-center">
                  <ButtonLoader className="mr-2" />
                  Creating...
                </span>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
