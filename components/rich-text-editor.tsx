"use client"

import type React from "react"
import { useCallback, useMemo, useState, useEffect } from "react"
import { createEditor, type Descendant, Editor, Transforms, Element as SlateElement, Range } from "slate"
import { Slate, Editable, withReact, useSlateStatic, type ReactEditor } from "slate-react"
import { withHistory, type HistoryEditor } from "slate-history"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link,
  Palette,
  Undo,
  Redo,
  ChevronDown,
} from "lucide-react"
import { KeyboardEvent } from "react"

// Define custom types for Slate
type CustomElement = {
  type:
    | "paragraph"
    | "heading-one"
    | "heading-two"
    | "heading-three"
    | "list-item"
    | "numbered-list"
    | "bulleted-list"
    | "link"
  align?: "left" | "center" | "right" | "justify"
  url?: string
  children: CustomText[]
}

type CustomText = {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: string
  fontSize?: string
}

declare module "slate" {
  interface CustomTypes {
    Editor: ReactEditor
    Element: CustomElement
    Text: CustomText
  }
}

const LIST_TYPES = ["numbered-list", "bulleted-list"]
const TEXT_ALIGN_TYPES = ["left", "center", "right", "justify"]

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

// Helper functions
const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor)
  return marks ? marks[format as keyof typeof marks] === true : false
}

const isBlockActive = (editor: Editor, format: string, blockType = "type") => {
  const { selection } = editor
  if (!selection) return false

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n[blockType as keyof typeof n] === format,
    }),
  )

  return !!match
}

const toggleMark = (editor: Editor, format: string, value?: any) => {
  const isActive = isMarkActive(editor, format)

  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, value || true)
  }
}

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(editor, format, TEXT_ALIGN_TYPES.includes(format) ? "align" : "type")
  const isList = LIST_TYPES.includes(format)

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type) &&
      !TEXT_ALIGN_TYPES.includes(format),
    split: true,
  })
  let newProperties: Partial<SlateElement>
  if (TEXT_ALIGN_TYPES.includes(format)) {
    newProperties = {
      align: isActive ? undefined : (format as any),
    }
  } else {
    newProperties = {
      type: isActive ? "paragraph" : isList ? "list-item" : (format as any),
    }
  }
  Transforms.setNodes<SlateElement>(editor, newProperties)

  if (!isActive && isList) {
    const block = { type: format as any, children: [] }
    Transforms.wrapNodes(editor, block)
  }
}

// Link helpers
const isLinkActive = (editor: Editor) => {
  const [link] = Editor.nodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "link",
  })
  return !!link
}

const wrapLink = (editor: Editor, url: string) => {
  if (isLinkActive(editor)) {
    unwrapLink(editor)
  }

  const { selection } = editor
  const isCollapsed = selection && Range.isCollapsed(selection)
  const link: any = {
    type: "link",
    url,
    children: isCollapsed ? [{ text: url }] : [],
  }

  if (isCollapsed) {
    Transforms.insertNodes(editor, link)
  } else {
    Transforms.wrapNodes(editor, link, { split: true })
    Transforms.collapse(editor, { edge: "end" })
  }
}

const unwrapLink = (editor: Editor) => {
  Transforms.unwrapNodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "link",
  })
}

// Button components that use Slate hooks
function MarkButton({ format, icon }: { format: string; icon: React.ReactNode }) {
  const editor = useSlateStatic()
  return (
    <Button
      variant={isMarkActive(editor, format) ? "default" : "ghost"}
      size="sm"
      onMouseDown={(event) => {
        event.preventDefault()
        toggleMark(editor, format)
      }}
    >
      {icon}
    </Button>
  )
}

function BlockButton({ format, icon }: { format: string; icon: React.ReactNode }) {
  const editor = useSlateStatic()
  return (
    <Button
      variant={
        isBlockActive(editor, format, TEXT_ALIGN_TYPES.includes(format) ? "align" : "type") ? "default" : "ghost"
      }
      size="sm"
      onMouseDown={(event) => {
        event.preventDefault()
        toggleBlock(editor, format)
      }}
    >
      {icon}
    </Button>
  )
}

function ColorButton() {
  const editor = useSlateStatic()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Palette className="h-4 w-4" />
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <div className="grid grid-cols-6 gap-1 p-2">
          {[
            "#000000",
            "#434343",
            "#666666",
            "#999999",
            "#b7b7b7",
            "#cccccc",
            "#d9ead3",
            "#fce5cd",
            "#fff2cc",
            "#f4cccc",
            "#d0e0e3",
            "#c9daf8",
            "#34a853",
            "#ff9900",
            "#fbbc04",
            "#ea4335",
            "#4285f4",
            "#9900ff",
          ].map((color) => (
            <button
              key={color}
              className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onMouseDown={(event) => {
                event.preventDefault()
                toggleMark(editor, "color", color)
              }}
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function LinkButton() {
  const editor = useSlateStatic()
  return (
    <Button
      variant="ghost"
      size="sm"
      onMouseDown={(event) => {
        event.preventDefault()
        const url = window.prompt("Enter the URL of the link:")
        if (url && !isLinkActive(editor)) {
          wrapLink(editor, url)
        }
      }}
    >
      <Link className="h-4 w-4" />
    </Button>
  )
}

// Toolbar component that will be inside Slate context
function Toolbar() {
  const editor = useSlateStatic()

  return (
    <div className="border-b border-gray-200 p-2">
      <div className="flex items-center gap-1 flex-wrap">
        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(event) => {
            event.preventDefault()
            ;(editor as unknown as HistoryEditor).undo()
          }}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(event) => {
            event.preventDefault()
            ;(editor as unknown as HistoryEditor).redo()
          }}
        >
          <Redo className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Font Family */}
        <Select defaultValue="arial">
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="arial">Arial</SelectItem>
            <SelectItem value="helvetica">Helvetica</SelectItem>
            <SelectItem value="times">Times New Roman</SelectItem>
            <SelectItem value="courier">Courier New</SelectItem>
            <SelectItem value="georgia">Georgia</SelectItem>
          </SelectContent>
        </Select>

        {/* Font Size */}
        <Select defaultValue="14">
          <SelectTrigger className="w-16 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="8">8</SelectItem>
            <SelectItem value="9">9</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="11">11</SelectItem>
            <SelectItem value="12">12</SelectItem>
            <SelectItem value="14">14</SelectItem>
            <SelectItem value="16">16</SelectItem>
            <SelectItem value="18">18</SelectItem>
            <SelectItem value="24">24</SelectItem>
            <SelectItem value="36">36</SelectItem>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text Formatting */}
        <MarkButton format="bold" icon={<Bold className="h-4 w-4" />} />
        <MarkButton format="italic" icon={<Italic className="h-4 w-4" />} />
        <MarkButton format="underline" icon={<Underline className="h-4 w-4" />} />

        {/* Text Color */}
        <ColorButton />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <BlockButton format="left" icon={<AlignLeft className="h-4 w-4" />} />
        <BlockButton format="center" icon={<AlignCenter className="h-4 w-4" />} />
        <BlockButton format="right" icon={<AlignRight className="h-4 w-4" />} />
        <BlockButton format="justify" icon={<AlignJustify className="h-4 w-4" />} />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
        <BlockButton format="numbered-list" icon={<ListOrdered className="h-4 w-4" />} />
        <BlockButton format="bulleted-list" icon={<List className="h-4 w-4" />} />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Link */}
        <LinkButton />
      </div>
    </div>
  )
}

export function RichTextEditor({ value, onChange, placeholder = "Start writing..." }: RichTextEditorProps) {
  const renderElement = useCallback((props: any) => <Element {...props} />, [])
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, [])
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])

  // Initialize editor value
  const initialValue: Descendant[] = useMemo(() => {
    if (value) {
      try {
        return JSON.parse(value)
      } catch {
        return [
          {
            type: "paragraph",
            children: [{ text: value }],
          },
        ]
      }
    }
    return [
      {
        type: "paragraph",
        children: [{ text: "" }],
      },
    ]
  }, [])

  const [editorValue, setEditorValue] = useState<Descendant[]>(initialValue)

  // Update editor value when prop changes
  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value)
        setEditorValue(parsed)
      } catch {
        setEditorValue([
          {
            type: "paragraph",
            children: [{ text: value }],
          },
        ])
      }
    }
  }, [value])

  const handleChange = (newValue: Descendant[]) => {
    setEditorValue(newValue)
    onChange(JSON.stringify(newValue))
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    // Don't handle these shortcuts here - let them bubble up to global handlers
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'c') {
      return // Let global word count dialog handle this
    }
    if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'k') {
      return // Let global link dialog handle this
    }

    // Bold, Italic, Underline
    if (event.ctrlKey && !event.altKey && !event.metaKey) {
      switch (event.key.toLowerCase()) {
        case "b":
          event.preventDefault()
          toggleMark(editor, "bold")
          return
        case "i":
          event.preventDefault()
          toggleMark(editor, "italic")
          return
        case "u":
          event.preventDefault()
          toggleMark(editor, "underline")
          return
        case "z":
          if (event.shiftKey) {
            event.preventDefault()
            ;(editor as unknown as HistoryEditor).redo()
          }
          return
      }
    }

    // Alignment and lists (Ctrl+Shift)
    if (event.ctrlKey && event.shiftKey && !event.altKey) {
      switch (event.key.toLowerCase()) {
        case "l":
          event.preventDefault()
          toggleBlock(editor, "left")
          return
        case "e":
          event.preventDefault()
          toggleBlock(editor, "center")
          return
        case "r":
          event.preventDefault()
          toggleBlock(editor, "right")
          return
        case "j":
          event.preventDefault()
          toggleBlock(editor, "justify")
          return
        case "7":
          event.preventDefault()
          toggleBlock(editor, "numbered-list")
          return
        case "8":
          event.preventDefault()
          toggleBlock(editor, "bulleted-list")
          return
        case ".":
          event.preventDefault()
          // increase font size mark by 2
          const currentSizeInc = (Editor.marks(editor)?.fontSize as string) || "14"
          toggleMark(editor, "fontSize", (parseInt(currentSizeInc) + 2).toString())
          return
        case ",":
          event.preventDefault()
          const currentSizeDec = (Editor.marks(editor)?.fontSize as string) || "14"
          toggleMark(editor, "fontSize", Math.max(8, parseInt(currentSizeDec) - 2).toString())
          return
      }
    }

    // Headings (Ctrl+Alt+[0-6])
    if (event.ctrlKey && event.altKey && !event.shiftKey) {
      const num = parseInt(event.key)
      if (!isNaN(num) && num >= 0 && num <= 6) {
        event.preventDefault()
        if (num === 0) {
          toggleBlock(editor, "paragraph")
        } else {
          const map: Record<number, string> = {
            1: "heading-one",
            2: "heading-two",
            3: "heading-three",
          }
          toggleBlock(editor, map[num] || "paragraph")
        }
      }
    }
  }

  return (
    <div className="bg-white">
      <Slate editor={editor} initialValue={editorValue} onChange={handleChange}>
        {/* Toolbar inside Slate context */}
        <Toolbar />

        {/* Editor */}
        <div className="bg-gray-100 p-6 overflow-auto flex justify-center min-h-96 max-h-screen">
          {/* Document Pages */}
          <div className="space-y-6 py-6">
            {/* Page 1 */}
            <div className="bg-white shadow-lg mx-auto flex-shrink-0" style={{
              width: '8.5in',
              height: '11in',
              padding: '1in',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
              <Editable
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                placeholder={placeholder}
                spellCheck
                autoFocus
                onKeyDown={handleKeyDown}
                className="outline-none w-full h-full leading-relaxed overflow-y-auto"
                style={{ 
                  fontFamily: "Arial, sans-serif", 
                  fontSize: "14px", 
                  lineHeight: "1.6",
                  height: "100%",
                  overflowY: "auto"
                }}
              />
            </div>
          </div>
        </div>
      </Slate>
    </div>
  )
}

// Element component
const Element = ({ attributes, children, element }: any) => {
  const style = { textAlign: element.align }
  switch (element.type) {
    case "bulleted-list":
      return (
        <ul style={style} {...attributes}>
          {children}
        </ul>
      )
    case "heading-one":
      return (
        <h1 style={style} {...attributes}>
          {children}
        </h1>
      )
    case "heading-two":
      return (
        <h2 style={style} {...attributes}>
          {children}
        </h2>
      )
    case "heading-three":
      return (
        <h3 style={style} {...attributes}>
          {children}
        </h3>
      )
    case "list-item":
      return (
        <li style={style} {...attributes}>
          {children}
        </li>
      )
    case "numbered-list":
      return (
        <ol style={style} {...attributes}>
          {children}
        </ol>
      )
    case "link":
      return (
        <a {...attributes} href={element.url} className="text-blue-600 underline">
          {children}
        </a>
      )
    default:
      return (
        <p style={style} {...attributes}>
          {children}
        </p>
      )
  }
}

// Leaf component
const Leaf = ({ attributes, children, leaf }: any) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underline) {
    children = <u>{children}</u>
  }

  const style: React.CSSProperties = {}
  if (leaf.color) {
    style.color = leaf.color
  }
  if (leaf.fontSize) {
    style.fontSize = `${leaf.fontSize}px`
  }

  return (
    <span {...attributes} style={style}>
      {children}
    </span>
  )
}
