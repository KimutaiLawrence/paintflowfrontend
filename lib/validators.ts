import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
})

export const jobCreationSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  address: z.string().min(1, "Address is required"),
  priority: z.enum(["P1", "P2", "P3"]).default("P3"),
  areas: z
    .array(
      z.object({
        name: z.string().min(1, "Area name is required"),
      }),
    )
    .min(1, "At least one area is required"),
})

export const statusUpdateSchema = z.object({
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type JobCreationFormData = z.infer<typeof jobCreationSchema>
export type StatusUpdateFormData = z.infer<typeof statusUpdateSchema>
