import axios from "axios"

const API_BASE_URL = "https://paintflowbackendlive.onrender.com/api"

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
  getJobs: (params?: { page?: number; per_page?: number }) => api.get("/jobs/", { params }),

  getJob: (jobId: string) => api.get(`/jobs/${jobId}`),

  createJob: (jobData: {
    title: string
    address: string
    priority?: string
    areas: { name: string }[]
  }) => api.post("/jobs/", jobData),

  createJobArea: (jobId: string, areaData: { name: string }) => api.post(`/jobs/${jobId}/areas`, areaData),
}

export const areasApi = {
  updateAreaStatus: (areaId: string, statusData: { status: string; notes?: string }) =>
    api.put(`/areas/${areaId}/status`, statusData),

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
  getWorkers: () => api.get("/workers/"),

  assignWorker: (assignmentData: { worker_id: string; job_area_id: string }) =>
    api.post("/workers/assign", assignmentData),

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
