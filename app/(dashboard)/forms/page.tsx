"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, FileText, Clock, CheckCircle, AlertTriangle, Users, Shield } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import api, { extractArrayData } from "@/lib/api"
import VSSChecklistForm from "@/components/forms/vss-checklist-form"
import WorkAtHeightsForm from "@/components/forms/work-at-heights-form"
import ToolboxMeetingForm from "@/components/forms/toolbox-meeting-form"

const FORM_TYPES = [
  {
    id: "vss_checklist",
    title: "VSS Daily Checklist",
    description: "Daily safety checklist required for all work sites",
    icon: Shield,
    color: "bg-blue-100 text-blue-800",
    required: true,
  },
  {
    id: "work_at_heights",
    title: "Permit to Work at Heights",
    description: "Required for work above 3 meters",
    icon: AlertTriangle,
    color: "bg-orange-100 text-orange-800",
    required: false,
  },
  {
    id: "toolbox_meeting",
    title: "Toolbox Meeting Record",
    description: "Weekly safety meeting documentation",
    icon: Users,
    color: "bg-green-100 text-green-800",
    required: false,
  },
]

function FormCard({ form }: { form: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formType = FORM_TYPES.find((t) => t.id === form.form_type)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {formType?.icon && <formType.icon className="h-5 w-5 text-muted-foreground" />}
            <div>
              <h4 className="font-semibold">{formType?.title || form.form_type}</h4>
              <p className="text-sm text-muted-foreground">{new Date(form.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(form.status)}>{form.status}</Badge>
            {form.is_required && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <p>Job: {form.job_title || "General"}</p>
            {form.submitted_by && <p>By: {form.submitted_by}</p>}
          </div>
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            View Form
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function NewFormDialog({ formType }: { formType: (typeof FORM_TYPES)[0] }) {
  const [open, setOpen] = useState(false)

  const renderForm = () => {
    switch (formType.id) {
      case "vss_checklist":
        return <VSSChecklistForm onComplete={() => setOpen(false)} />
      case "work_at_heights":
        return <WorkAtHeightsForm onComplete={() => setOpen(false)} />
      case "toolbox_meeting":
        return <ToolboxMeetingForm onComplete={() => setOpen(false)} />
      default:
        return <div>Form not implemented</div>
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed border-2">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <formType.icon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">{formType.title}</h3>
                <p className="text-sm text-muted-foreground">{formType.description}</p>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Badge className={formType.color}>{formType.required ? "Required" : "Optional"}</Badge>
              </div>
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create Form
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formType.title}</DialogTitle>
          <DialogDescription>{formType.description}</DialogDescription>
        </DialogHeader>
        {renderForm()}
      </DialogContent>
    </Dialog>
  )
}

export default function FormsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("all")

  const { data: formsResponse, isLoading } = useQuery({
    queryKey: ["forms"],
    queryFn: async () => {
      const response = await api.get("/forms/")
      return response.data
    },
  })

  const forms = extractArrayData(formsResponse || {})

  const filteredForms = forms.filter((form: any) => {
    if (activeTab === "all") return true
    if (activeTab === "pending") return form.status === "pending" || form.status === "draft"
    if (activeTab === "completed") return form.status === "completed"
    return form.form_type === activeTab
  })

  const todaysForms = forms.filter((form: any) => {
    const today = new Date().toDateString()
    const formDate = new Date(form.created_at).toDateString()
    return today === formDate
  })

  const pendingForms = forms.filter((form: any) => form.status === "pending" || form.status === "draft")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Safety Forms</h1>
          <p className="text-muted-foreground">Digital safety documentation and compliance tracking</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Forms</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysForms.length}</div>
            <p className="text-xs text-muted-foreground">Forms submitted today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingForms.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forms.length}</div>
            <p className="text-xs text-muted-foreground">All time submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">Safety compliance rate</p>
          </CardContent>
        </Card>
      </div>

      {/* New Forms Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Create New Form</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {FORM_TYPES.map((formType) => (
            <NewFormDialog key={formType.id} formType={formType} />
          ))}
        </div>
      </div>

      {/* Forms List */}
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Forms ({forms.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingForms.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="vss_checklist">VSS Checklist</TabsTrigger>
            <TabsTrigger value="work_at_heights">Work at Heights</TabsTrigger>
            <TabsTrigger value="toolbox_meeting">Toolbox Meeting</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="h-20 bg-muted animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredForms.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredForms.map((form: any) => (
                  <FormCard key={form.id} form={form} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No forms found</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === "all"
                      ? "Get started by creating your first safety form"
                      : `No ${activeTab} forms available`}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
