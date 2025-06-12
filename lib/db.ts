// Mock database functions for build compatibility
// Replace with real database implementation when needed

interface User {
  id: number
  email: string
  name: string
  password_hash: string
  created_at: string
}

interface Document {
  id: number
  user_id: number
  title: string
  content: string
  created_at: string
  updated_at: string
}

// Mock data
const mockUsers: User[] = []
const mockDocuments: Document[] = []

export async function getUser(email: string): Promise<User | null> {
  // Mock implementation - always returns null
  return null
}

export async function createUser(email: string, name: string, passwordHash: string): Promise<User> {
  // Mock implementation
  const user: User = {
    id: Date.now(),
    email,
    name,
    password_hash: passwordHash,
    created_at: new Date().toISOString()
  }
  mockUsers.push(user)
  return user
}

export async function getUserDocuments(userId: number): Promise<Document[]> {
  // Mock implementation
  return mockDocuments.filter(doc => doc.user_id === userId)
} 