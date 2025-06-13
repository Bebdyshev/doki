"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Search, MoreHorizontal, Edit, Trash2, Download, LogOut, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { apiClient, type Document } from "@/lib/api"
import Header from "@/components/header"

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)

    // Load user data
    const userResponse = await apiClient.getMe()
    if (userResponse.error) {
      router.push("/login")
      return
    }
    setUser(userResponse.data)

    // Load documents
    const docsResponse = await apiClient.getDocuments()
    if (docsResponse.data) {
      setDocuments(docsResponse.data)
    }

    setIsLoading(false)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadData()
      return
    }

    const response = await apiClient.searchDocuments(searchQuery)
    if (response.data) {
      setDocuments(response.data)
    }
  }

  const handleDeleteDocument = async (id: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      await apiClient.deleteDocument(id)
      loadData()
    }
  }

  const handleLogout = async () => {
    await apiClient.logout()
    router.push("/")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  console.log(documents)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600">Manage your documents and collaborate with AI assistance.</p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} variant="outline">
            Search
          </Button>
          <Link href="/editor">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </Link>
        </div>

        {/* Documents Grid */}
        {documents.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
              <p className="text-gray-600 mb-4">Create your first document to get started with AI-powered editing.</p>
              <Link href="/editor">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Document
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">{doc.title}</CardTitle>
                      <CardDescription className="mt-1">Updated {formatDate(doc.updated_at)}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/editor/${doc.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => apiClient.exportDocument(doc.id, "pdf")}>
                          <Download className="h-4 w-4 mr-2" />
                          Export PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteDocument(doc.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-3">{doc.content.substring(0, 150)}...</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {doc.content.length} characters
                    </Badge>
                    <Link href={`/editor/${doc.id}`}>
                      <Button size="sm" variant="outline">
                        Open
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
