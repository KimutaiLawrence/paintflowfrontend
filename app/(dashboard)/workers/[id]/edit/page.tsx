"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usersApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { ArrowLeft } from "lucide-react"
import { ButtonLoader } from "@/components/ui/custom-loader"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
})

type FormData = z.infer<typeof formSchema>

export default function EditWorkerPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const workerId = params.id as string

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      username: "",
      full_name: "",
      phone: "",
      password: "",
    },
  })

  // Fetch worker data
  const { data: worker, isLoading } = useQuery({
    queryKey: ["worker", workerId],
    queryFn: () => usersApi.getUser(workerId),
  })

  // Populate form when data loads
  useEffect(() => {
    if (worker) {
      form.reset({
        email: worker.email || "",
        username: worker.username || "",
        full_name: worker.full_name || "",
        phone: worker.phone || "",
        password: "",
      })
    }
  }, [worker, form])

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => {
      const updateData: any = {
        email: data.email,
        username: data.username,
        full_name: data.full_name,
        phone: data.phone,
      }
      // Only include password if it's provided
      if (data.password && data.password.trim()) {
        updateData.password = data.password
      }
      return usersApi.updateUser(workerId, updateData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker", workerId] })
      queryClient.invalidateQueries({ queryKey: ["workers"] })
      toast.success("Success", { description: "Worker updated successfully" })
      router.push("/workers")
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to update worker"
      toast.error("Error", { description: errorMessage })
    },
  })

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <ButtonLoader />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto p-6">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Workers
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Worker</CardTitle>
          <CardDescription>
            Update worker information. Leave password empty to keep current password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username *</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Leave empty to keep current" {...field} />
                    </FormControl>
                    <FormDescription>
                      Only fill this if you want to change the password
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+65 1234 5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <>
                      <ButtonLoader />
                      Updating...
                    </>
                  ) : (
                    "Update Worker"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

