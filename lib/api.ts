import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("paintflow_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("paintflow_token")
      localStorage.removeItem("paintflow_user")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Helper function to extract array data from various API response formats
export function extractArrayData<T>(response: ApiResponse<T>): T[] {
  if (Array.isArray(response)) return response
  if (response.results) return response.results
  if (response.data) return response.data
  return []
}

// Helper function to extract pagination info
export function extractPaginationInfo<T>(response: ApiResponse<T>) {
  return {
    total: response.count || response.total || 0,
    hasNext: !!response.next,
    hasPrevious: !!response.previous,
    currentPage: response.page || 1,
    totalPages: response.pages || Math.ceil((response.count || response.total || 0) / 10),
  }
}

// Specific API methods that match the live backend endpoints
export const authApi = {
  login: (credentials: { username: string; password: string }) => api.post("/auth/login", credentials),

  getCurrentUser: () => api.get("/auth/me"),
}

export const dashboardApi = {
  getMetrics: () => api.get("/dashboard/metrics"),

  getActivity: () => api.get("/dashboard/activity"),
}

export const jobsApi = {
  getJobs: (params?: { page?: number; per_page?: number; search?: string; sort?: string; order?: 'asc' | 'desc' }) => 
    api.get("/jobs/", { params }).then(res => res.data),

  getJob: (jobId: string) => api.get(`/jobs/${jobId}`),

  createJob: (jobData: {
    title: string
    address: string
    priority?: string
    areas: { name: string }[]
  }) => api.post("/jobs/", jobData),

  updateJob: (jobId: string, jobData: Partial<JobDetail>) => api.put(`/jobs/${jobId}`, jobData),

  deleteJob: (jobId: string) => api.delete(`/jobs/${jobId}`),

  createJobArea: (jobId: string, areaData: { name: string }) => api.post(`/jobs/${jobId}/areas`, areaData),
}

export const areasApi = {
  updateAreaStatus: (areaId: string, statusData: { status: string; notes?: string }) =>
    api.put(`/areas/${areaId}/status`, statusData),

  updateArea: (areaId: string, areaData: Partial<JobArea>) => api.put(`/areas/${areaId}`, areaData),

  deleteArea: (areaId: string) => api.delete(`/areas/${areaId}`),

  getAreaHistory: (areaId: string) => api.get(`/areas/${areaId}/history`),
}

export const documentsApi = {
  getDocuments: () => api.get("/documents/"),

  uploadDocument: (formData: FormData) =>
    api.post("/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  getDocument: (documentId: string) => api.get(`/documents/${documentId}`),
}

export const workersApi = {
  getWorkers: (params?: { page?: number; per_page?: number; search?: string }) => 
    api.get("/workers/", { params }).then(res => res.data),

  getWorker: (workerId: string) => api.get(`/workers/${workerId}`),

  createWorker: (workerData: any) => api.post("/workers/", workerData),

  updateWorker: (workerId: string, workerData: any) => api.put(`/workers/${workerId}`, workerData),

  deleteWorker: (workerId: string) => api.delete(`/workers/${workerId}`),

  assignWorker: (assignmentData: { worker_id: string; job_area_id: string }) =>
    api.post("/workers/assign", assignmentData),
    
  unassignWorker: (assignmentId: string) => api.delete(`/workers/assignments/${assignmentId}`),

  getAssignments: () => api.get("/workers/assignments"),
}

export const formsApi = {
  getTemplates: () => api.get("/forms/templates"),

  getSubmissions: () => api.get("/forms/submissions"),

  submitForm: (formData: any) => api.post("/forms/submit", formData),
}

export const notificationsApi = {
  getNotifications: () => api.get("/notifications/"),

  markAsRead: (notificationId: string) => api.put(`/notifications/${notificationId}/read`),
}

export const reportsApi = {
  getDailyReport: () => api.get("/reports/daily"),

  exportJobReport: (jobId: string) => api.get(`/reports/job/${jobId}/export`),
}

export const usersApi = {
  getUsers: (params?: { page?: number; per_page?: number; search?: string }) => 
    api.get("/users/", { params }).then(res => res.data),
  getUser: (userId: string) => api.get(`/users/${userId}`),
  createUser: (userData: any) => api.post("/users/", userData),
  updateUser: (userId: string, userData: any) => api.put(`/users/${userId}`, userData),
  deleteUser: (userId: string) => api.delete(`/users/${userId}`),
}

export const managementCompaniesApi = {
  getCompanies: () => api.get("/management-companies/"),
  getCompany: (companyId: string) => api.get(`/management-companies/${companyId}`),
  createCompany: (companyData: any) => api.post("/management-companies/", companyData),
  updateCompany: (companyId: string, companyData: any) => api.put(`/management-companies/${companyId}`, companyData),
  deleteCompany: (companyId: string) => api.delete(`/management-companies/${companyId}`),
}

export const formTemplatesApi = {
  getTemplates: () => api.get("/forms/templates"),
  getTemplate: (templateId: string) => api.get(`/forms/templates/${templateId}`),
  createTemplate: (templateData: any) => api.post("/forms/templates", templateData),
  updateTemplate: (templateId: string, templateData: any) => api.put(`/forms/templates/${templateId}`, templateData),
  deleteTemplate: (templateId: string) => api.delete(`/forms/templates/${templateId}`),
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

export const syncApi = {
  batchSync: (operations: Array<{ type: string; payload: any }>) => api.post("/sync/batch", { operations }),
}

export interface User {
  id: string
  username: string
  full_name: string
  email: string
  role: string
  company_id: string
}

export interface JobArea {
  id: string
  name: string
  description: string
  status: string
  estimated_hours: string
  actual_hours: string
}

export interface WorkerSummary {
  id: string
  full_name: string
  role: string
}

export interface JobDetail {
  id: string
  job_number: string
  title: string
  description: string
  address: string
  priority: string
  priority_color: string
  management_company: string
  created_at: string
  updated_at: string
  areas: JobArea[]
  assigned_workers: WorkerSummary[]
}

export interface DocumentDetail {
  id: string
  filename: string
  photo_type: string
  job_area_id: string
  uploaded_by: string
  created_at: string
  gps_latitude: number
  gps_longitude: number
  cloudinary_public_id: string
  cloudinary_url: string
  mobile_url: string
}

export interface StatusHistory {
  id: string
  job_area_id: string
  user_id: string
  previous_status: string
  new_status: string
  notes: string
  changed_at: string
}

export interface PaginatedJobResponse {
  data: JobDetail[]
  page: number
  per_page: number
  total: number
  pages: number
}

export interface ApiResponse<T> {
  data?: T[]
  results?: T[]
  count?: number
  total?: number
  page?: number
  pages?: number
}

export default api
