import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageLoader } from "@/components/ui/custom-loader"

export function DataTableSkeleton({
  columnCount,
  rowCount = 10,
}: {
  columnCount: number
  rowCount?: number
}) {
  return <PageLoader />
}
