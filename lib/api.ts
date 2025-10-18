import axios from "axios"
import { useAuthStore } from "@/store/auth-store"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add the auth token to every outgoing request.
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle 401 Unauthorized errors.
// This will log the user out and redirect them to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

// Re-export the default export
export default api

// Define a generic ApiResponse interface
export interface ApiResponse<T> {
  data: T
  results?: T[]
  count?: number
  total?: number
  page?: number
  pages?: number
  next?: string | null
  previous?: string | null
}

// Paginated response interface
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  pages: number
}

// User type (re-exported from auth-store for convenience)
export type { User } from "@/store/auth-store"

// Location type
export interface Location {
  id: string
  name: string
  created_at?: string
  updated_at?: string
}

// Town Council type
export interface TownCouncil {
  id: string
  name: string
  shortform: string
  created_at?: string
  updated_at?: string
}

// Job Title type
export interface JobTitle {
  id: string
  title: string
  description?: string
  is_default?: boolean
  created_at?: string
  updated_at?: string
}

// Job Area type
export interface JobArea {
  id: string
  name: string
  description?: string
  is_predefined: boolean
  created_at?: string
  updated_at?: string
}

// Job Detail type
export interface JobDetail {
  id: string
  job_number: string
  serial_number?: number
  serial_no?: string
  title?: string
  description?: string
  address?: string
  location?: string
  location_id?: string
  street_name?: string
  block_no?: string
  tc?: string
  town_council_id?: string
  unit_no?: string
  area?: string
  priority: "P1" | "P2" | "P3"
  priority_color?: string
  status?: string
  report_date?: string | null
  inspection_date?: string | null
  repair_schedule?: string | null
  ultra_schedule?: string | null
  repair_completion?: string | null
  resident_number?: string | null
  created_at?: string
  updated_at?: string
  areas?: any[]
  assigned_workers?: any[]
}

// Specific API functions
export const jobsApi = {
  getJobs: (params: { page: number; per_page: number; search?: string }) =>
    api.get<ApiResponse<any>>("/jobs/", { params }).then(res => res.data),
  getJob: (id: string) => api.get<JobDetail>(`/jobs/${id}`).then(res => res.data),
  createJob: (data: any) => api.post<JobDetail>("/jobs/", data).then(res => res.data),
  updateJob: (id: string, data: any) =>
    api.put<JobDetail>(`/jobs/${id}`, data).then(res => res.data),
  deleteJob: (id: string) => api.delete<ApiResponse<any>>(`/jobs/${id}`).then(res => res.data),
  getPredefinedAreas: () => api.get<{areas: string[]}>("/jobs/predefined-areas").then(res => res.data),
}

export const jobAreasApi = {
  getJobAreas: (params?: { page?: number; per_page?: number; search?: string }) => 
    api.get<PaginatedResponse<JobArea>>("/jobs/predefined-areas", { params }).then(res => res.data),
  getJobArea: (areaId: string) => api.get<JobArea>(`/jobs/predefined-areas/${areaId}`).then(res => res.data),
  createJobArea: (areaData: { name: string; description?: string }) => 
    api.post<JobArea>("/jobs/predefined-areas", areaData).then(res => res.data),
  updateJobArea: (areaId: string, areaData: { name: string; description?: string }) => 
    api.put<JobArea>(`/jobs/predefined-areas/${areaId}`, areaData).then(res => res.data),
  deleteJobArea: (areaId: string) => api.delete(`/jobs/predefined-areas/${areaId}`).then(res => res.data),
}

export const dashboardApi = {
  getMetrics: () => api.get("/dashboard/metrics"),
}

export const workersApi = {
  getWorkers: (params?: { page?: number; per_page?: number; search?: string }) =>
    api.get("/workers/", { params }).then(res => res.data),
  deleteWorker: (workerId: string) => api.delete(`/workers/${workerId}`),
}

export const authApi = {
  login: (credentials: { username: string; password: string }) => api.post("/auth/login", credentials),
  getCurrentUser: () => api.get("/auth/me"),
}

export const usersApi = {
  getUsers: (params?: { page?: number; per_page?: number; search?: string }) => 
    api.get("/users/", { params }).then(res => res.data),
  getUser: (userId: string) => api.get(`/users/${userId}`).then(res => res.data),
  createUser: (userData: any) => api.post("/users/", userData).then(res => res.data),
  updateUser: (userId: string, userData: any) => api.put(`/users/${userId}`, userData).then(res => res.data),
  deleteUser: (userId: string) => api.delete(`/users/${userId}`).then(res => res.data),
}

export const clientsApi = {
  getClients: () => api.get("/clients/").then(res => res.data),
  getClient: (clientId: string) => api.get(`/clients/${clientId}`).then(res => res.data),
  createClient: (clientData: any) => api.post("/clients/", clientData).then(res => res.data),
  updateClient: (clientId: string, clientData: any) => api.put(`/clients/${clientId}`, clientData).then(res => res.data),
  deleteClient: (clientId: string) => api.delete(`/clients/${clientId}`).then(res => res.data),
}

export const companyDocumentsApi = {
  getDocuments: () => api.get("/company-documents/").then(res => res.data),
  uploadDocument: (file: File, name: string, description: string, category: string) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("name", name)
    formData.append("description", description)
    formData.append("category", category)
    
    return api.post("/company-documents/upload", formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteDocument: (docId: string) => api.delete(`/company-documents/${docId}`),
}

export const documentCategoriesApi = {
  getCategories: () => api.get("/company-documents/categories/").then(res => res.data),
  createCategory: (categoryData: { code: string; name: string; description?: string; color?: string }) => 
    api.post("/company-documents/categories/", categoryData).then(res => res.data),
  updateCategory: (categoryId: string, categoryData: { code?: string; name?: string; description?: string; color?: string }) => 
    api.put(`/company-documents/categories/${categoryId}`, categoryData).then(res => res.data),
  deleteCategory: (categoryId: string) => api.delete(`/company-documents/categories/${categoryId}`).then(res => res.data),
}

export const locationsApi = {
  getLocations: (params?: { page?: number; per_page?: number; search?: string }) => 
    api.get<PaginatedResponse<Location>>("/locations/", { params }).then(res => res.data),
  getLocation: (locationId: string) => api.get<Location>(`/locations/${locationId}`).then(res => res.data),
  createLocation: (locationData: { name: string }) => api.post<Location>("/locations/", locationData).then(res => res.data),
  updateLocation: (locationId: string, locationData: { name: string }) => 
    api.put<Location>(`/locations/${locationId}`, locationData).then(res => res.data),
  deleteLocation: (locationId: string) => api.delete(`/locations/${locationId}`).then(res => res.data),
}

export const townCouncilsApi = {
  getTownCouncils: (params?: { page?: number; per_page?: number; search?: string }) => 
    api.get<PaginatedResponse<TownCouncil>>("/town-councils/", { params }).then(res => res.data),
  getTownCouncil: (tcId: string) => api.get<TownCouncil>(`/town-councils/${tcId}`).then(res => res.data),
  createTownCouncil: (tcData: { name: string; shortform: string }) => 
    api.post<TownCouncil>("/town-councils/", tcData).then(res => res.data),
  updateTownCouncil: (tcId: string, tcData: { name: string; shortform: string }) => 
    api.put<TownCouncil>(`/town-councils/${tcId}`, tcData).then(res => res.data),
  deleteTownCouncil: (tcId: string) => api.delete(`/town-councils/${tcId}`).then(res => res.data),
}

export const jobTitlesApi = {
  getJobTitles: (params?: { page?: number; per_page?: number; search?: string }) => 
    api.get<PaginatedResponse<JobTitle>>("/job-titles/", { params }).then(res => res.data),
  getJobTitle: (jtId: string) => api.get<JobTitle>(`/job-titles/${jtId}`).then(res => res.data),
  createJobTitle: (jtData: { title: string; description?: string; is_default?: boolean }) => 
    api.post<JobTitle>("/job-titles/", jtData).then(res => res.data),
  updateJobTitle: (jtId: string, jtData: { title?: string; description?: string; is_default?: boolean }) => 
    api.put<JobTitle>(`/job-titles/${jtId}`, jtData).then(res => res.data),
  deleteJobTitle: (jtId: string) => api.delete(`/job-titles/${jtId}`).then(res => res.data),
}

export interface FloorPlanTemplate {
  id: string
  name: string
  description?: string
  category?: string
  image_url: string
  file_name: string
  file_size?: number
  mime_type: string
  usage_count: number
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export const floorPlanTemplatesApi = {
  getFloorPlanTemplates: (params?: { page?: number; per_page?: number; search?: string; category?: string }) => 
    api.get<PaginatedResponse<FloorPlanTemplate>>("/floor-plan-templates/", { params }).then(res => res.data),
  getFloorPlanTemplate: (templateId: string) => api.get<FloorPlanTemplate>(`/floor-plan-templates/${templateId}`).then(res => res.data),
  createFloorPlanTemplate: (formData: FormData) => 
    api.post<FloorPlanTemplate>("/floor-plan-templates/", formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data),
  updateFloorPlanTemplate: (templateId: string, templateData: { name?: string; description?: string; category?: string; is_active?: boolean }) => 
    api.put<FloorPlanTemplate>(`/floor-plan-templates/${templateId}`, templateData).then(res => res.data),
  deleteFloorPlanTemplate: (templateId: string) => api.delete(`/floor-plan-templates/${templateId}`).then(res => res.data),
}

export const formTemplatesApi = {
  getFormTemplates: () => api.get("/form-templates/").then(res => res.data),
  getFormTemplate: (templateId: string) => api.get(`/form-templates/${templateId}`).then(res => res.data),
  createFormTemplate: (templateData: any) => api.post("/form-templates/", templateData).then(res => res.data),
  updateFormTemplate: (templateId: string, templateData: any) => api.put(`/form-templates/${templateId}`, templateData).then(res => res.data),
  deleteFormTemplate: (templateId: string) => api.delete(`/form-templates/${templateId}`).then(res => res.data),
}

// Job Tabs API
export interface SitePhoto {
  id: string
  job_id: string
  photo_stage: 'survey' | 'repair' | 'primer' | 'ultra' | 'topcoat' | 'completion'
  file_name: string
  original_file_name: string
  file_size: number
  mime_type: string
  cloudinary_url: string
  uploaded_by: string
  created_at: string
}

export interface JobSafetyDocument {
  id: string
  document_type: string
  title: string
  description?: string
  file_name: string
  mime_type: string
  cloudinary_url: string
  uploaded_by: string
  created_at: string
}

export interface JobInspection {
  id: string
  inspection_date: string
  inspector_name: string
  inspection_notes?: string
  floor_plan_url?: string
  inspection_form_url?: string
  created_by: string
  created_at: string
}

export interface CompletionReport {
  id: string
  job_id: string
  job_title: string
  job_number: string
  completion_date: string
  final_inspection_date?: string
  inspector_name?: string
  completion_notes?: string
  areas_painted: string[]
  before_photos_url?: string
  after_photos_url?: string
  inspection_form_url?: string
  created_at: string
}

export const sitePhotosApi = {
  getSitePhotos: (jobId: string) => api.get<SitePhoto[]>(`/site-photos/job/${jobId}`).then(res => res.data),
  uploadSitePhoto: (jobId: string, file: File, photoStage: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('photo_stage', photoStage)
    return api.post<SitePhoto>(`/site-photos/job/${jobId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data)
  }
}

export const jobSafetyDocsApi = {
  getSafetyDocuments: (jobId: string) => api.get<JobSafetyDocument[]>(`/job-safety-docs/job/${jobId}`).then(res => res.data),
  attachSafetyDocument: (jobId: string, data: { document_type: string; company_doc_id?: string }) => 
    api.post(`/job-safety-docs/job/${jobId}`, data).then(res => res.data),
  deleteSafetyDocument: (jobId: string, docId: string) => 
    api.delete(`/job-safety-docs/job/${jobId}/${docId}`).then(res => res.data)
}

export const jobInspectionsApi = {
  getInspection: (jobId: string) => api.get<JobInspection>(`/job-inspections/job/${jobId}`).then(res => res.data),
  saveInspection: (jobId: string, data: { inspection_date: string; inspector_name: string; inspection_notes?: string }) => 
    api.post(`/job-inspections/job/${jobId}`, data).then(res => res.data)
}

export const jobFloorPlansApi = {
  getFloorPlan: (jobId: string) => api.get(`/job-floor-plans/job/${jobId}`).then(res => res.data),
  attachFloorPlan: (jobId: string, floorPlanId: string) => 
    api.post(`/job-floor-plans/job/${jobId}`, { floor_plan_id: floorPlanId }).then(res => res.data),
  removeFloorPlan: (jobId: string) => 
    api.delete(`/job-floor-plans/job/${jobId}`).then(res => res.data),
  recalculateUsage: () => 
    api.post(`/job-floor-plans/recalculate-usage`).then(res => res.data)
}

export const jobEditableDocsApi = {
  getEditableDocuments: (jobId: string) => api.get(`/job-editable-docs/job/${jobId}`).then(res => res.data),
  createEditableDocument: (jobId: string, originalDocumentId: string) => 
    api.post(`/job-editable-docs/job/${jobId}`, { original_document_id: originalDocumentId }).then(res => res.data),
  updateEditableDocument: (docId: string, data: { edited_data?: any; e_signature_data?: any }) => 
    api.put(`/job-editable-docs/${docId}`, data).then(res => res.data),
  deleteEditableDocument: (docId: string) => 
    api.delete(`/job-editable-docs/${docId}`).then(res => res.data)
}


export const completionReportsApi = {
  getCompletionReports: (params?: { page?: number; per_page?: number; search?: string; job_id?: string }) => 
    api.get<PaginatedResponse<CompletionReport>>("/reports/completion-reports", { params }).then(res => res.data),
  getCompletionReport: (reportId: string) => api.get<CompletionReport>(`/reports/completion-reports/${reportId}`).then(res => res.data),
  createCompletionReport: (jobId: string, data: any) => 
    api.post(`/jobs/${jobId}/completion-reports`, data).then(res => res.data),
  updateCompletionReport: (reportId: string, data: any) => 
    api.put(`/reports/completion-reports/${reportId}`, data).then(res => res.data),
  deleteCompletionReport: (reportId: string) => api.delete(`/reports/completion-reports/${reportId}`).then(res => res.data),
}
