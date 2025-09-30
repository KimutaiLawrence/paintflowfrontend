"use client"

import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { usersApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const roles = ["admin", "manager", "supervisor", "worker"]

export default function CreateUserPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm()

  const mutation = useMutation({
    mutationFn: (data) => usersApi.createUser(data),
    onSuccess: () => router.push("/users"),
  })

  return (
    <Card>
      <CardHeader><CardTitle>Create New User</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-4">
          {/* Form fields */}
          <Button type="submit">Create User</Button>
        </form>
      </CardContent>
    </Card>
  )
}
