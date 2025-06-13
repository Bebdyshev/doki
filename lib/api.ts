const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

// Cookie utility functions
const setCookie = (name: string, value: string, days = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`
}

const getCookie = (name: string): string | null => {
  return document.cookie.split('; ').find(row => row.startsWith(name + '='))?.split('=')[1] || null
}

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

interface ApiResponse<T> {
  data?: T
  error?: string
}

class ApiClient {
  private token: string | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.token = getCookie("access_token")
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { error: data.error || `HTTP error! status: ${response.status}` }
      }
      
      return { data }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.request<{ access_token: string; type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    if (response.data) {
      this.token = response.data.access_token
      setCookie("access_token", response.data.access_token)
    }

    return response
  }

  async register(name: string, email: string, password: string) {
    const response = await this.request<{ access_token: string; type: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    })

    if (response.data) {
      this.token = response.data.access_token
      setCookie("access_token", response.data.access_token)
    }

    return response
  }

  async logout() {
    await this.request("/auth/logout", { method: "POST" })
    this.token = null
    deleteCookie("access_token")
  }

  async getMe() {
    return this.request("/auth/users/me")
  }

  // Document methods
  async getDocuments() {
    return this.request<Document[]>("/documents/")
  }

  async getDocument(id: number) {
    return this.request<Document>(`/documents/${id}`)
  }

  async createDocument(title: string, content: string) {
    return this.request<Document>("/documents/", {
      method: "POST",
      body: JSON.stringify({ title, content }),
    })
  }

  async updateDocument(id: number, title?: string, content?: string) {
    return this.request<Document>(`/documents/${id}`, {
      method: "PUT",
      body: JSON.stringify({ title, content }),
    })
  }

  async deleteDocument(id: number) {
    return this.request(`/documents/${id}`, { method: "DELETE" })
  }

  async exportDocument(id: number, format: "pdf" | "docx" | "txt" = "pdf") {
    return this.request(`/documents/${id}/export?format=${format}`)
  }

  // Chat methods
  async chat(
    messages: Array<{ role: string; content: string }>, 
    conversationId?: string,
    model?: string
  ) {
    const params = new URLSearchParams()
    if (conversationId) params.append("conversation_id", conversationId)
    if (model) params.append("model", model)

    return this.request<{
      response: string
      conversation_id: string
      tool_output: any[] | null
    }>(`/chat/?${params.toString()}`, {
      method: "POST",
      body: JSON.stringify({ messages }),
    })
  }

  async getConversations() {
    return this.request("/chat/conversations")
  }

  async getConversation(id: string) {
    return this.request(`/chat/conversation/${id}`)
  }

  // Search methods
  async searchDocuments(query: string) {
    return this.request<Document[]>(`/search/?query=${encodeURIComponent(query)}`)
  }

  async googleLogin(idToken: string) {
    const response = await this.request<{ access_token: string; type: string }>("/auth/google-login", {
      method: "POST",
      body: JSON.stringify({ token: idToken }),
    })

    if (response.data) {
      this.token = response.data.access_token
      setCookie("access_token", response.data.access_token)
    }

    return response
  }
}

export const apiClient = new ApiClient()

export interface Document {
  id: number
  user_id: number
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface User {
  id: number
  email: string
  name: string
  type: string
  created_at: string
}
