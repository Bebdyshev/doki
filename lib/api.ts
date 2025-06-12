const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

// Local storage utility functions
const setLocalStorage = (key: string, value: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value))
  }
}

const getLocalStorage = (key: string) => {
  if (typeof window !== "undefined") {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  }
  return null
}

interface ApiResponse<T> {
  data?: T
  error?: string
}

class ApiClient {
  // Document methods - using local storage
  async getDocuments() {
    try {
      const documents = getLocalStorage("documents") || []
      return { data: documents }
    } catch (error) {
      return { error: "Failed to get documents" }
    }
  }

  async getDocument(id: number) {
    try {
      const documents = getLocalStorage("documents") || []
      const document = documents.find((d: Document) => d.id === id)
      if (document) {
        return { data: document }
      } else {
        return { error: "Document not found" }
      }
    } catch (error) {
      return { error: "Failed to get document" }
    }
  }

  async createDocument(title: string, content: string) {
    try {
      const documents = getLocalStorage("documents") || []
      const newDocument: Document = {
        id: Date.now(), // Simple ID generation
        user_id: 1,
        title,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      documents.push(newDocument)
      setLocalStorage("documents", documents)
      return { data: newDocument }
    } catch (error) {
      return { error: "Failed to create document" }
    }
  }

  async updateDocument(id: number, title?: string, content?: string) {
    try {
      const documents = getLocalStorage("documents") || []
      const index = documents.findIndex((d: Document) => d.id === id)
      if (index !== -1) {
        if (title !== undefined) documents[index].title = title
        if (content !== undefined) documents[index].content = content
        documents[index].updated_at = new Date().toISOString()
        setLocalStorage("documents", documents)
        return { data: documents[index] }
      } else {
        return { error: "Document not found" }
      }
    } catch (error) {
      return { error: "Failed to update document" }
    }
  }

  async deleteDocument(id: number) {
    try {
      const documents = getLocalStorage("documents") || []
      const filteredDocuments = documents.filter((d: Document) => d.id !== id)
      setLocalStorage("documents", filteredDocuments)
      return { data: true }
    } catch (error) {
      return { error: "Failed to delete document" }
    }
  }

  async exportDocument(id: number, format: "pdf" | "docx" | "txt" = "pdf") {
    try {
      const document = await this.getDocument(id)
      if (document.data) {
        // Simple export - just download as text for now
        const blob = new Blob([document.data.content], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = window.document.createElement("a")
        a.href = url
        a.download = `${document.data.title}.${format}`
        a.click()
        URL.revokeObjectURL(url)
        return { data: true }
      }
      return { error: "Document not found" }
    } catch (error) {
      return { error: "Failed to export document" }
    }
  }

  // Chat methods - mock implementation
  async chat(
    messages: Array<{ role: string; content: string }>, 
    conversationId?: string,
    model?: string
  ) {
    try {
      // Mock AI response
      const mockResponse = {
        response: "I'm a mock AI assistant. Your actual AI integration would go here.",
        conversation_id: conversationId || `conv_${Date.now()}`,
        tool_output: null
      }
      return { data: mockResponse }
    } catch (error) {
      return { error: "Failed to chat" }
    }
  }

  async getConversations() {
    return { data: [] }
  }

  async getConversation(id: string) {
    return { data: null }
  }

  // Search methods
  async searchDocuments(query: string) {
    try {
      const documents = getLocalStorage("documents") || []
      const filtered = documents.filter((d: Document) => 
        d.title.toLowerCase().includes(query.toLowerCase()) ||
        d.content.toLowerCase().includes(query.toLowerCase())
      )
      return { data: filtered }
    } catch (error) {
      return { error: "Failed to search documents" }
    }
  }

  // Auth methods - simplified for local use
  async login(email: string, password: string) {
    return { data: { access_token: "mock_token", type: "Bearer" } }
  }

  async register(name: string, email: string, password: string) {
    return { data: { access_token: "mock_token", type: "Bearer" } }
  }

  async logout() {
    return { data: true }
  }

  async getMe() {
    return { data: { id: 1, email: "user@example.com", name: "User", type: "user", created_at: new Date().toISOString() } }
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
