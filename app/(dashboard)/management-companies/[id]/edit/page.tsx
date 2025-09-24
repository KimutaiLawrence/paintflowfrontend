"use client"

import { useForm } from "react-hook-form"
import { useRouter, useParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { managementCompaniesApi } from "@/lib/api"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function EditManagementCompanyPage() {
  const router = useRouter()
  const params = useParams()
  const companyId = params.id as string
  const { register, handleSubmit, reset } = useForm()

  const { data: company } = useQuery({
    queryKey: ["managementCompany", companyId],
    queryFn: () => managementCompaniesApi.getCompany(companyId),
    enabled: !!companyId,
  })

  useEffect(() => {
    if (company) reset(company)
  }, [company, reset])

  const mutation = useMutation({
    mutationFn: (data) => managementCompaniesApi.updateCompany(companyId, data),
    onSuccess: () => router.push("/management-companies"),
  })

  return (
    <Card>
      <CardHeader><CardTitle>Edit Management Company</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-4">
          {/* Form fields */}
          <Button type="submit">Update Company</Button>
        </form>
      </CardContent>
    </Card>
  )
}
