"use client"

import { useQuery } from "@tanstack/react-query"
import { clientsApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { columns } from "./columns"
import { DataTable } from "@/components/shared/data-table"
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function ClientsPage() {
  const router = useRouter()
  const { canManageUsers } = useAuth()
  
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientsApi.getClients(),
  })

  return (
    <div className="w-full space-y-4 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">
            Manage all your client organizations and their contact information.
          </p>
        </div>
        {canManageUsers() && (
          <Button 
            onClick={() => router.push("/clients/create")}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <PlusCircle className="h-4 w-4" />
            Add New Client
          </Button>
        )}
      </div>

      {isLoading ? (
        <DataTableSkeleton columnCount={columns.length} />
      ) : (
        <DataTable columns={columns} data={clients || []} filterColumn="name" />
      )}
    </div>
  )
}

