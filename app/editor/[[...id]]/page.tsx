"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Save, ArrowLeft, MessageSquare, Send, Bot, User, Download, Sparkles, RefreshCw } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { apiClient, type Document } from "@/lib/api"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id ? Number.parseInt(params.id[0]) : null

  const [document, setDocument] = useState<Document | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (documentId) {
      loadDocument()
    } else {
      // New document
      setTitle("Untitled Document")
      setContent("")
    }
  }, [documentId])

  useEffect(() => {
    // Auto-save every 30 seconds
    const interval = setInterval(() => {
      if (title || content) {
        handleSave(true)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [title, content])

  useEffect(() => {
    // Scroll chat to bottom when new messages are added
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const loadDocument = async () => {
    if (!documentId) return

    setIsLoading(true)
    const response = await apiClient.getDocument(documentId)

    if (response.data) {
      setDocument(response.data)
      setTitle(response.data.title)
      setContent(response.data.content)
    } else {
      router.push("/dashboard")
    }

    setIsLoading(false)
  }

  const handleSave = async (isAutoSave = false) => {
    if (!title.trim() && !content.trim()) return

    setIsSaving(true)

    try {
      if (documentId && document) {
        // Update existing document
        const response = await apiClient.updateDocument(documentId, title, content)
        if (response.data) {
          setDocument(response.data)
          setLastSaved(new Date())
        }
      } else {
        // Create new document
        const response = await apiClient.createDocument(title || "Untitled Document", content)
        if (response.data) {
          setDocument(response.data)
          setLastSaved(new Date())
          router.replace(`/editor/${response.data.id}`)
        }
      }
    } catch (error) {
      console.error("Save failed:", error)
    }

    setIsSaving(false)
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isChatLoading) return

    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatInput("")
    setIsChatLoading(true)

    try {
      // Include document context in the chat
      const contextMessage = content
        ? `Document context: "${title}"\n\nContent: ${content.substring(0, 1000)}${content.length > 1000 ? "..." : ""}`
        : "No document content available."

      const messages = [
        {
          role: "system",
          content: `You are an AI assistant helping with document editing. Here's the current document context: ${contextMessage}`,
        },
        { role: "user", content: chatInput },
      ]

      const response = await apiClient.chat(messages, conversationId || undefined)

      if (response.data) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: response.data.response,
          timestamp: new Date(),
        }

        setChatMessages((prev) => [...prev, assistantMessage])
        setConversationId(response.data.conversation_id)
      }
    } catch (error) {
      console.error("Chat failed:", error)
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, errorMessage])
    }

    setIsChatLoading(false)
  }

  const handleQuickAction = async (action: string) => {
    const actions = {
      summarize: "Please summarize this document in 3-4 sentences.",
      improve: "Please suggest improvements to make this document clearer and more engaging.",
      grammar: "Please check this document for grammar and spelling errors.",
      expand: "Please suggest ways to expand on the key points in this document.",
    }

    setChatInput(actions[action as keyof typeof actions] || action)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">{document ? "Edit Document" : "New Document"}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {lastSaved && <span className="text-sm text-gray-500">Saved {lastSaved.toLocaleTimeString()}</span>}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => document && apiClient.exportDocument(document.id, "pdf")}>
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => document && apiClient.exportDocument(document.id, "docx")}>
                    Export as DOCX
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => document && apiClient.exportDocument(document.id, "txt")}>
                    Export as TXT
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => handleSave()} disabled={isSaving}>
                {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </header>

        {/* Editor Content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <Input
              placeholder="Document title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold border-none px-0 focus-visible:ring-0 placeholder:text-gray-400"
            />
            <Textarea
              placeholder="Start writing your document..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[600px] text-base leading-relaxed border-none px-0 focus-visible:ring-0 resize-none"
            />
          </div>
        </div>
      </div>

      {/* AI Chat Sidebar */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">AI Assistant</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">Get help with editing, summarizing, and improving your document</p>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => handleQuickAction("summarize")} className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Summarize
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickAction("improve")} className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Improve
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickAction("grammar")} className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Grammar
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickAction("expand")} className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Expand
            </Button>
          </div>
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
          <div className="space-y-4">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm">Ask me anything about your document!</p>
                <p className="text-xs mt-2">Try: "Summarize this document" or "Check for grammar errors"</p>
              </div>
            ) : (
              chatMessages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.role === "assistant" && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                      {message.role === "user" && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                      <div className="text-sm">{message.content}</div>
                    </div>
                    <div className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</div>
                  </div>
                </div>
              ))
            )}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleChatSubmit} className="flex space-x-2">
            <Input
              placeholder="Ask me anything..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isChatLoading}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={isChatLoading || !chatInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
