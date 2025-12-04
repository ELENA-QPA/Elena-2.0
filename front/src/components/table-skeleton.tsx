import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
          <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
          <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
          <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
          <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
          <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}