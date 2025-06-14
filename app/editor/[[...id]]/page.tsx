"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FileText,
  Save,
  ArrowLeft,
  MessageSquare,
  Send,
  Bot,
  User,
  Download,
  RefreshCw,
  Star,
  Paperclip,
  Search,
  FileCode,
  Calculator,
  Globe,
  ChevronDown,
  Sparkles,
  AtSign,
  History,
  Plus,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RichTextEditor } from "@/components/rich-text-editor"
import { apiClient, type Document } from "@/lib/api"
import Header from "@/components/header"
import { WordCountDialog } from "@/components/dialogs/word-count-dialog"
import { LinkDialog } from "@/components/dialogs/link-dialog"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface Conversation {
  id: string
  title?: string
  created_at: string
  updated_at: string
  messages: Array<{
    role: "user" | "assistant"
    content: string
    timestamp: string
  }>
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

  // Enhanced chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [documentsList, setDocumentsList] = useState<Document[]>([])
  const [selectedKnowledgeDoc, setSelectedKnowledgeDoc] = useState<Document | null>(null)
  const [user, setUser] = useState<any>(null)
  const [showWordCount, setShowWordCount] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const [sidebarWidth, setSidebarWidth] = useState(384) // default 24rem (w-96)
  const isResizingRef = useRef(false)

  // Available tools
  const availableTools = [
    { id: "web_search", name: "Web Search", icon: Globe, description: "Search the web for information" },
    { id: "file_analysis", name: "File Analysis", icon: FileCode, description: "Analyze document structure" },
  ]

  // Load stored conversation ID from localStorage
  useEffect(() => {
    const storedConversationId = localStorage.getItem(`conversation_${documentId || 'new'}`)
    if (storedConversationId) {
      setConversationId(storedConversationId)
    }
  }, [documentId])

  // Load conversations and conversation history
  useEffect(() => {
    loadConversations()
    if (conversationId) {
      loadConversationHistory(conversationId)
    }
  }, [conversationId])

  useEffect(() => {
    if (documentId) {
      loadDocument()
    } else {
      // New document
      setTitle("Untitled Document")
      setContent("")
    }

    // Load user's documents for knowledge base selector
    ;(async () => {
      // Load user data
      const userResponse = await apiClient.getMe()
      if (userResponse.data) {
        setUser(userResponse.data)
      }

      const res = await apiClient.getDocuments()
      if (res.data) {
        setDocumentsList(res.data)
      }
    })()
  }, [documentId])

  // Auto-save 2s after user stops typing or changing title
  useEffect(() => {
    if (!title && !content) return
    const timeout = setTimeout(() => {
        handleSave(true)
    }, 2000)

    return () => clearTimeout(timeout)
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

  // Load user's conversations
  const loadConversations = async () => {
    setIsLoadingConversations(true)
    try {
      const response = await apiClient.getConversations()
      if (response.data) {
        setConversations(response.data as Conversation[])
      }
    } catch (error) {
      console.error("Failed to load conversations:", error)
    }
    setIsLoadingConversations(false)
  }

  // Load specific conversation history
  const loadConversationHistory = async (convId: string) => {
    try {
      const response = await apiClient.getConversation(convId)
      if (response.data) {
        const conversationData = response.data as Conversation
        setCurrentConversation(conversationData)
        // Convert backend messages to local format
        const messages: ChatMessage[] = conversationData.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        }))
        setChatMessages(messages)
      }
    } catch (error) {
      console.error("Failed to load conversation history:", error)
    }
  }

  // Start a new conversation
  const startNewConversation = () => {
    setConversationId(null)
    setCurrentConversation(null)
    setChatMessages([])
    localStorage.removeItem(`conversation_${documentId || 'new'}`)
  }

  // Select an existing conversation
  const selectConversation = (conversation: Conversation) => {
    setConversationId(conversation.id)
    setCurrentConversation(conversation)
    localStorage.setItem(`conversation_${documentId || 'new'}`, conversation.id)
    loadConversationHistory(conversation.id)
  }

  const handleSave = async (isAutoSave = false) => {
    if (!title.trim() && !content.trim()) return

    setIsSaving(true)

    try {
      if (documentId && document) {
        // Update existing document with full JSON rich text
        const response = await apiClient.updateDocument(documentId, title, content)
        if (response.data) {
          setDocument(response.data)
          setLastSaved(new Date())
        }
      } else {
        // Create new document with full JSON rich text
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

  // Enhanced send chat message with proper conversation handling
  const handleSend = async () => {
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
      // Convert rich text to plain text for context
      let plainTextContent = content
      try {
        const parsed = JSON.parse(content)
        plainTextContent = parsed
          .map((n: any) => n.children?.map((c: any) => c.text).join("") || "")
          .join("\n")
      } catch {
        // If it's not JSON, use as is
      }

      const contextMessage = plainTextContent
        ? `Document context: "${title}"\n\nContent: ${plainTextContent.substring(0, 1000)}${plainTextContent.length > 1000 ? "..." : ""}`
        : "No document content available."

      let messageContent = userMessage.content
      if (selectedKnowledgeDoc && typeof selectedKnowledgeDoc.id === 'number') {
        messageContent += `\n\nInstruction: Use knowledgebase_tool with document_id=${selectedKnowledgeDoc.id}`
      }

      // For conversation continuation, send only the current message
      // The backend will handle conversation history with the conversation_id
      const messages: {role: string; content: string}[] = [
        {
          role: "system",
          content: `You are an AI assistant helping with document editing. Here's the current document context: ${contextMessage}`,
        },
        { role: "user", content: messageContent },
      ]

      const response = await apiClient.chat(messages, conversationId || undefined)

      if (response.data) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: response.data.response,
          timestamp: new Date(),
        }

        setChatMessages((prev) => [...prev, assistantMessage])
        
        // Store conversation ID for continuation
        const newConversationId = response.data.conversation_id
        setConversationId(newConversationId)
        localStorage.setItem(`conversation_${documentId || 'new'}`, newConversationId)
        
        // Reload conversations to get the updated list
        loadConversations()
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

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSend()
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

  const handleLogout = async () => {
    await apiClient.logout()
    router.push("/")
  }

  const handleInsertLink = (url: string, text?: string) => {
    // This would integrate with the rich text editor
    // For now, we'll just log it
    console.log("Insert link:", { url, text })
  }

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        e.stopPropagation()
        setShowWordCount(true)
        return
      }
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        e.stopPropagation()
        setShowLinkDialog(true)
        return
      }
    }

    // Use capture phase to ensure these shortcuts are handled before other handlers
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [])

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizingRef.current) return
    const newWidth = Math.min(600, Math.max(260, window.innerWidth - e.clientX))
    setSidebarWidth(newWidth)
  }
  const stopResize = () => {
    isResizingRef.current = false
  }
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", stopResize)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", stopResize)
    }
  }, [])

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
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Document Title Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-none text-lg font-medium bg-transparent focus-visible:ring-0 px-0"
              placeholder="Untitled Document"
            />
            <Button variant="ghost" size="sm">
              <Star className="h-4 w-4" />
            </Button>
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
              <DropdownMenuItem onClick={() => document && apiClient.exportDocument(document.id, "pdf")}>Export as PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => document && apiClient.exportDocument(document.id, "docx")}>Export as DOCX</DropdownMenuItem>
              <DropdownMenuItem onClick={() => document && apiClient.exportDocument(document.id, "txt")}>Export as TXT</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {isSaving && <RefreshCw className="h-4 w-4 animate-spin text-gray-500" />}
        </div>
      </div>

      {/* Content Row */}
      <div className="flex flex-1 overflow-auto">
        {/* Main Editor */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full max-h-[calc(100vh - 50px)] overflow-y-auto">
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Start writing your document..."
            />
          </div>
        </div>


        {/* Resizer */}
        <div
          className="w-1 cursor-col-resize bg-gray-200 hover:bg-gray-300"
          onMouseDown={() => {
            isResizingRef.current = true
          }}
        />

        {/* Chat Sidebar */}
        <div
          className="bg-white border-l border-gray-200 flex flex-col overflow-auto min-h-0"
          style={{ width: sidebarWidth, height: 'calc(100vh - 64px)' }}
        >
          {/* Chat Header with Conversation Selector */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Chat Assistant</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2">
                    <History className="h-3 w-3 mr-1" />
                    Conversations
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-64 overflow-auto">
                  <DropdownMenuItem onClick={startNewConversation} className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>New Conversation</span>
                  </DropdownMenuItem>
                  {conversations.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs font-medium text-gray-500 border-t">
                        Recent Conversations
                      </div>
                      {conversations.slice(0, 10).map((conv) => (
                        <DropdownMenuItem
                          key={conv.id}
                          onClick={() => selectConversation(conv)}
                          className={`flex flex-col items-start space-y-1 ${
                            conversationId === conv.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <span className="text-sm font-medium">
                            {conv.title || `Conversation ${conv.id.slice(0, 8)}...`}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(conv.updated_at).toLocaleDateString()}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {currentConversation && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <span className="font-medium">Current:</span> {currentConversation.title || `Conversation ${currentConversation.id.slice(0, 8)}...`}
              </div>
            )}
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
          <div className="p-4 border-t border-gray-200 space-y-3">
            {/* Model and Tools Selection Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Tools Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 px-2">
                      <Paperclip className="h-3 w-3 mr-1" />
                      Tools
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {availableTools.map((tool) => {
                      const Icon = tool.icon
                      return (
                        <DropdownMenuItem
                          key={tool.id}
                          onClick={() => {
                            setSelectedTools(prev => 
                              prev.includes(tool.id) 
                                ? prev.filter(t => t !== tool.id)
                                : [...prev, tool.id]
                            )
                          }}
                          className="flex items-start space-x-3 p-3"
                        >
                          <Icon className="h-4 w-4 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{tool.name}</div>
                            <div className="text-xs text-gray-500">{tool.description}</div>
                          </div>
                          {selectedTools.includes(tool.id) && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          )}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Document Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 px-2">
                      <AtSign className="h-3 w-3 mr-1" />
                      Doc
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72 max-h-64 overflow-auto">
                    <DropdownMenuItem
                      onClick={() => setSelectedKnowledgeDoc(null)}
                      className="text-sm"
                    >
                      None
                    </DropdownMenuItem>
                    {documentsList.map((doc) => (
                      <DropdownMenuItem
                        key={doc.id}
                        onClick={() => setSelectedKnowledgeDoc(doc)}
                        className="flex flex-col space-y-0.5"
                      >
                        <span className="text-sm font-medium">{doc.title}</span>
                        <span className="text-xs text-gray-500">ID: {doc.id}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Selected Tools Indicators */}
              {selectedTools.length > 0 && (
                <div className="flex items-center space-x-1">
                  {selectedTools.map((toolId) => {
                    const tool = availableTools.find(t => t.id === toolId)
                    if (!tool) return null
                    const Icon = tool.icon
                    return (
                      <div
                        key={toolId}
                        className="flex items-center space-x-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs"
                      >
                        <Icon className="h-3 w-3" />
                        <span>{tool.name}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Selected document badge */}
              {selectedKnowledgeDoc && (
                <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs ml-2">
                  <AtSign className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">{selectedKnowledgeDoc.title}</span>
                </div>
              )}
            </div>

            {/* Chat Input Row */}
          <form onSubmit={handleChatSubmit} className="flex space-x-2">
              <div className="flex-1 relative">
                <Textarea
              placeholder="Ask me anything..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
              disabled={isChatLoading}
                  className="pr-10 border-none focus-visible:ring-0 resize-none text-sm leading-relaxed"
                  rows={1}
                />
                {/* Quick Actions */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Sparkles className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleQuickAction("summarize")}>
                        📝 Summarize document
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleQuickAction("improve")}>
                        ✨ Improve writing
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleQuickAction("grammar")}>
                        📖 Check grammar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleQuickAction("expand")}>
                        📈 Expand ideas
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            <Button type="submit" size="sm" disabled={isChatLoading || !chatInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <WordCountDialog 
        open={showWordCount} 
        onOpenChange={setShowWordCount} 
        content={content} 
      />
      <LinkDialog 
        open={showLinkDialog} 
        onOpenChange={setShowLinkDialog} 
        onInsertLink={handleInsertLink} 
      />
    </div>
  )
}
