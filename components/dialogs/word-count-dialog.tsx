import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, Hash, Type, Timer } from "lucide-react"

interface WordCountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: string
}

export function WordCountDialog({ open, onOpenChange, content }: WordCountDialogProps) {
  // Parse JSON content or use as plain text
  let plainText = content
  try {
    const parsed = JSON.parse(content)
    plainText = parsed
      .map((n: any) => n.children?.map((c: any) => c.text).join("") || "")
      .join("\n")
  } catch {
    // Use content as-is if not JSON
  }

  const words = plainText.trim() ? plainText.trim().split(/\s+/).length : 0
  const characters = plainText.length
  const charactersNoSpaces = plainText.replace(/\s/g, "").length
  const paragraphs = plainText.trim() ? plainText.split(/\n\s*\n/).filter(p => p.trim()).length : 0
  const lines = plainText.split('\n').length
  
  // Estimate reading time (average 200 words per minute)
  const readingTime = Math.ceil(words / 200)

  const stats = [
    { label: "Words", value: words.toLocaleString(), icon: Type, color: "bg-blue-100 text-blue-700" },
    { label: "Characters", value: characters.toLocaleString(), icon: Hash, color: "bg-green-100 text-green-700" },
    { label: "Characters (no spaces)", value: charactersNoSpaces.toLocaleString(), icon: Hash, color: "bg-purple-100 text-purple-700" },
    { label: "Paragraphs", value: paragraphs.toLocaleString(), icon: FileText, color: "bg-orange-100 text-orange-700" },
    { label: "Lines", value: lines.toLocaleString(), icon: FileText, color: "bg-pink-100 text-pink-700" },
    { label: "Reading time", value: `${readingTime} min`, icon: Timer, color: "bg-indigo-100 text-indigo-700" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Document Statistics</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border bg-gray-50">
                  <div className={`p-2 rounded-full ${stat.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
          
          {words > 0 && (
            <>
              <Separator />
              <div className="text-center space-y-2">
                <Badge variant="outline" className="text-xs">
                  Average reading time: {readingTime} minute{readingTime !== 1 ? 's' : ''}
                </Badge>
                <p className="text-xs text-gray-500">
                  Based on 200 words per minute reading speed
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 