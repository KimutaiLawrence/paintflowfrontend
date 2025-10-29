"use client"

import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { auditTrailApi, AuditTrailEntry, AuditTrailStats } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, FilterIcon, SearchIcon, UserIcon, ActivityIcon, ClockIcon, Eye, EyeOff } from "lucide-react"
import { format } from "date-fns"
import { ServerDataTable } from "@/components/shared/server-data-table"
import { columns, essentialColumns } from "./columns"
import { InlineLoader } from "@/components/ui/custom-loader"

export default function AuditTrailPage() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [showAllColumns, setShowAllColumns] = useState(false)
  const [filters, setFilters] = useState({
    user_id: "",
    action: "",
    resource_type: "all",
    start_date: "",
    end_date: ""
  })

  const { data: auditData, isLoading, error } = useQuery({
    queryKey: ["audit-trail", page, perPage, filters],
    queryFn: () => auditTrailApi.getAuditTrail({
      page,
      per_page: perPage,
      ...(filters.user_id && { user_id: filters.user_id }),
      ...(filters.action && { action: filters.action }),
      ...(filters.resource_type && filters.resource_type !== "all" && { resource_type: filters.resource_type }),
      ...(filters.start_date && { start_date: filters.start_date }),
      ...(filters.end_date && { end_date: filters.end_date })
    }),
    staleTime: 30 * 1000, // 30 seconds
  })

  const paginatedData = {
    data: auditData?.audit_entries || [],
    total: auditData?.pagination?.total || 0,
    page: auditData?.pagination?.page || 1,
    per_page: auditData?.pagination?.per_page || 25,
    pages: auditData?.pagination?.pages || 0
  }

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["audit-stats"],
    queryFn: auditTrailApi.getAuditStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1) // Reset to first page when filtering
  }

  const clearFilters = () => {
    setFilters({
      user_id: "",
      action: "",
      resource_type: "all",
      start_date: "",
      end_date: ""
    })
    setPage(1)
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Error loading audit trail: {(error as any)?.message || "Unknown error"}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Trail</h1>
          <p className="text-muted-foreground">
            Monitor all system activities and user actions
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAllColumns(!showAllColumns)}
          className="flex items-center gap-2"
        >
          {showAllColumns ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showAllColumns ? "Show Essential" : "Show All"}
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <ActivityIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_entries.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Entries</CardTitle>
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recent_entries.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_users.length}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Common Actions</CardTitle>
              <SearchIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.common_actions.length}</div>
              <p className="text-xs text-muted-foreground">Action types</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter audit trail entries by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user_id">User ID</Label>
              <Input
                id="user_id"
                placeholder="Enter user ID"
                value={filters.user_id}
                onChange={(e) => handleFilterChange('user_id', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Input
                id="action"
                placeholder="Enter action"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resource_type">Resource Type</Label>
              <Select value={filters.resource_type} onValueChange={(value) => handleFilterChange('resource_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="JOB">Job</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ROLE">Role</SelectItem>
                  <SelectItem value="DOCUMENT">Document</SelectItem>
                  <SelectItem value="AUDIT">Audit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail Data Table */}
      <ServerDataTable<AuditTrailEntry, any>
        columns={showAllColumns ? columns : essentialColumns}
        data={paginatedData.data as AuditTrailEntry[]}
        total={paginatedData.total}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        isLoading={isLoading}
      />
    </div>
  )
}