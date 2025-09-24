"use client"

import { useForm } from "react-hook-form"
import { useRouter, useParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { usersApi } from "@/lib/api"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const roles = ["admin", "manager", "supervisor", "worker"]

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const { register, handleSubmit, reset, setValue } = useForm()

  const { data: user } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => usersApi.getUser(userId),
    enabled: !!userId,
  })

  useEffect(() => {
    if (user) reset(user)
  }, [user, reset])

  const mutation = useMutation({
    mutationFn: (data) => usersApi.updateUser(userId, data),
    onSuccess: () => router.push("/users"),
  })

  return (
    <Card>
      <CardHeader><CardTitle>Edit User</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-4">
          {/* Form fields */}
          <Button type="submit">Update User</Button>
        </form>
      </CardContent>
    </Card>
  )
}
