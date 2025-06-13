import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Link, ExternalLink, Type, Globe } from "lucide-react"

interface LinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsertLink: (url: string, text?: string) => void
  initialUrl?: string
  initialText?: string
}

export function LinkDialog({ open, onOpenChange, onInsertLink, initialUrl = "", initialText = "" }: LinkDialogProps) {
  const [url, setUrl] = useState(initialUrl)
  const [linkText, setLinkText] = useState(initialText)
  const [isValidUrl, setIsValidUrl] = useState(true)

  useEffect(() => {
    if (open) {
      setUrl(initialUrl)
      setLinkText(initialText)
      setIsValidUrl(true)
    }
  }, [open, initialUrl, initialText])

  const validateUrl = (urlString: string) => {
    if (!urlString.trim()) return false
    try {
      // Add protocol if missing
      const urlToTest = urlString.startsWith('http') ? urlString : `https://${urlString}`
      new URL(urlToTest)
      return true
    } catch {
      return false
    }
  }

  const handleUrlChange = (value: string) => {
    setUrl(value)
    setIsValidUrl(validateUrl(value))
  }

  const handleInsert = () => {
    if (!url.trim()) return
    
    let finalUrl = url.trim()
    if (!finalUrl.startsWith('http')) {
      finalUrl = `https://${finalUrl}`
    }
    
    onInsertLink(finalUrl, linkText.trim() || undefined)
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isValidUrl && url.trim()) {
        handleInsert()
      }
    }
  }

  const commonLinks = [
    { label: "Google", url: "https://google.com" },
    { label: "GitHub", url: "https://github.com" },
    { label: "Stack Overflow", url: "https://stackoverflow.com" },
    { label: "MDN Docs", url: "https://developer.mozilla.org" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Link className="h-5 w-5 text-blue-600" />
            <span>Insert Link</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url" className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>URL</span>
            </Label>
            <Input
              id="url"
              placeholder="https://example.com or example.com"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className={!isValidUrl && url ? "border-red-300 focus:border-red-500" : ""}
              autoFocus
            />
            {!isValidUrl && url && (
              <p className="text-xs text-red-600">Please enter a valid URL</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkText" className="flex items-center space-x-2">
              <Type className="h-4 w-4" />
              <span>Display Text (optional)</span>
            </Label>
            <Input
              id="linkText"
              placeholder="Link text (leave empty to use URL)"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleInsert}
            disabled={!url.trim() || !isValidUrl}
          >
            Insert Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 