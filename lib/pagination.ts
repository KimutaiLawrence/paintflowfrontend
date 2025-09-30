// Pagination utilities for server-side pagination

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  pages?: number
}

export interface PaginationParams {
  page: number
  per_page: number
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
}

// Normalize different API response formats to a standard paginated response
export function normalizePaginatedResponse<T>(response: any): PaginatedResponse<T> {
  // If response has data property (standard format)
  if (response.data && Array.isArray(response.data)) {
    return {
      data: response.data,
      total: response.total || response.count || response.data.length,
      page: response.page || 1,
      per_page: response.per_page || 10,
      pages: response.pages || Math.ceil((response.total || response.count || response.data.length) / (response.per_page || 10))
    }
  }
  
  // If response is directly an array
  if (Array.isArray(response)) {
    return {
      data: response,
      total: response.length,
      page: 1,
      per_page: response.length || 10,
      pages: 1
    }
  }
  
  // Fallback
  return {
    data: [],
    total: 0,
    page: 1,
    per_page: 10,
    pages: 0
  }
}

// Calculate pagination display text (e.g., "Showing 1-10 of 100")
export function getPaginationText(page: number, perPage: number, total: number): string {
  if (total === 0) return "No results"
  
  const from = (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)
  
  return `Showing ${from}-${to} of ${total}`
}

// Get page numbers for pagination controls
export function getPaginationPages(currentPage: number, totalPages: number, maxVisible: number = 5): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  
  const half = Math.floor(maxVisible / 2)
  let start = Math.max(1, currentPage - half)
  let end = Math.min(totalPages, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}
