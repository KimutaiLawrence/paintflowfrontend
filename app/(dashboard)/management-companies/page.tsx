"use client"

import { useQuery } from "@tanstack/react-query"
import { managementCompaniesApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { columns } from "./columns"
import { DataTable } from "@/components/shared/data-table"
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton"
import { useRouter } from "next/navigation"

export default function ManagementCompaniesPage() {
  const router = useRouter()
  const { data: companiesResponse, isLoading } = useQuery({
    queryKey: ["managementCompanies"],
    queryFn: () => managementCompaniesApi.getCompanies(),
  })

  const companies = companiesResponse?.data || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">
            Here's a list of all your management companies (clients).
          </p>
        </div>
        <Button onClick={() => router.push("/management-companies/create")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Client
        </Button>
      </div>

      {isLoading ? (
        <DataTableSkeleton columnCount={columns.length} />
      ) : (
        <DataTable columns={columns} data={companies} filterColumn="name" />
      )}
    </div>
  )
}
