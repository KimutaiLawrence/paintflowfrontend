"use client"

import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { clientsApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ButtonLoader } from "@/components/ui/custom-loader"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useEffect } from "react"

type ClientFormData = {
  name: string
  contact_person: string
  phone: string
  email: string
  address: string
}

export default function CreateClientPage() {
  const router = useRouter()
  const { canManageUsers } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<ClientFormData>()

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!canManageUsers()) {
      toast.error("You don't have permission to create clients")
      router.push("/clients")
    }
  }, [canManageUsers, router])

  const mutation = useMutation({
    mutationFn: (data: ClientFormData) => clientsApi.createClient(data),
    onSuccess: () => {
      toast.success("Client created successfully")
      router.push("/clients")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create client")
    },
  })

  if (!canManageUsers()) {
    return null
  }

  return (
    <div className="w-full space-y-6 p-4 md:p-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Create New Client</h2>
        <p className="text-muted-foreground">
          Add a new client organization to the system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Client Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name", { required: "Client name is required" })}
                  placeholder="e.g., CapitaLand"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  {...register("contact_person")}
                  placeholder="e.g., John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="contact@client.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="+65 1234 5678"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                {...register("address")}
                placeholder="Enter client address"
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <ButtonLoader className="mr-2" />}
                Create Client
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push("/clients")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

