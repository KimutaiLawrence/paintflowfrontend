"use client"

import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { managementCompaniesApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function CreateManagementCompanyPage() {
  const router = useRouter()
  const { register, handleSubmit } = useForm()

  const mutation = useMutation({
    mutationFn: (data) => managementCompaniesApi.createCompany(data),
    onSuccess: () => router.push("/management-companies"),
  })

  return (
    <Card>
      <CardHeader><CardTitle>Create Management Company</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-4">
          {/* Form fields */}
          <Button type="submit">Create Company</Button>
        </form>
      </CardContent>
    </Card>
  )
}
