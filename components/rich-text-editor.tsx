"use client"

import type React from "react"
import { useCallback, useMemo, useState, useEffect, useRef, memo } from "react"
import { createEditor, type Descendant, Editor, Transforms, Element as SlateElement, Range, Point, Path } from "slate"
import { Slate, Editable, withReact, useSlateStatic, type ReactEditor } from "slate-react"
import { withHistory, type HistoryEditor } from "slate-history"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
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
  Indent,
  Outdent,
  Highlighter,
  Type,
  Subscript,
  Superscript,
  RemoveFormatting,
  Search,
  Printer,
  SpellCheck,
  MoreHorizontal,
} from "lucide-react"
import { KeyboardEvent } from "react"

// Define custom types for Slate
type CustomElement = {
  type:
    | "paragraph"
    | "heading-one"
    | "heading-two"
    | "heading-three"
    | "heading-four"
    | "heading-five"
    | "heading-six"
    | "list-item"
    | "numbered-list"
    | "bulleted-list"
    | "link"
    | "blockquote"
    | "code-block"
  align?: "left" | "center" | "right" | "justify"
  url?: string
  indent?: number
  children: CustomText[]
}

type CustomText = {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  superscript?: boolean
  subscript?: boolean
  color?: string
  backgroundColor?: string
  fontSize?: string
  fontFamily?: string
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
const HEADING_TYPES = ["heading-one", "heading-two", "heading-three", "heading-four", "heading-five", "heading-six"]

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

// Enhanced list helpers
const isInList = (editor: Editor) => {
  const [match] = Array.from(
    Editor.nodes(editor, {
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && LIST_TYPES.includes(n.type),
    })
  )
  return !!match
}

const getCurrentListType = (editor: Editor) => {
  const [match] = Array.from(
    Editor.nodes(editor, {
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && LIST_TYPES.includes(n.type),
    })
  )
  return match ? (match[0] as CustomElement).type : null
}

const insertListItem = (editor: Editor) => {
  if (isInList(editor)) {
    Transforms.insertNodes(editor, {
      type: "list-item",
      children: [{ text: "" }],
    })
  }
}

const toggleList = (editor: Editor, format: "numbered-list" | "bulleted-list") => {
  const currentListType = getCurrentListType(editor)
  
  if (currentListType === format) {
    // Remove list formatting
    Transforms.unwrapNodes(editor, {
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && LIST_TYPES.includes(n.type),
      split: true,
    })
    Transforms.setNodes(editor, { type: "paragraph" })
  } else if (currentListType && currentListType !== format) {
    // Change list type
    Transforms.setNodes(editor, { type: format }, {
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && LIST_TYPES.includes(n.type),
    })
  } else {
    // Create new list
    Transforms.setNodes(editor, { type: "list-item" })
    Transforms.wrapNodes(editor, { type: format, children: [] })
  }
}

// Indent/outdent functions
const indentListItem = (editor: Editor) => {
  if (isInList(editor)) {
    const currentIndent = 0 // You can track this in element properties
    Transforms.setNodes(editor, { indent: currentIndent + 1 } as Partial<CustomElement>)
  }
}

const outdentListItem = (editor: Editor) => {
  if (isInList(editor)) {
    const currentIndent = 0 // You can track this in element properties
    if (currentIndent > 0) {
      Transforms.setNodes(editor, { indent: currentIndent - 1 } as Partial<CustomElement>)
    }
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

// Clear formatting
const clearFormatting = (editor: Editor) => {
  const marks = Editor.marks(editor) || {}
  Object.keys(marks).forEach(mark => {
    Editor.removeMark(editor, mark)
  })
}

// Memoized button components for performance
const MarkButton = memo(({ format, icon, tooltip }: { format: string; icon: React.ReactNode; tooltip: string }) => {
  const editor = useSlateStatic()
  const isActive = isMarkActive(editor, format)
  
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    toggleMark(editor, format)
  }, [editor, format])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
    <Button
          variant={isActive ? "default" : "ghost"}
      size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={handleMouseDown}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
})

const BlockButton = memo(({ format, icon, tooltip }: { format: string; icon: React.ReactNode; tooltip: string }) => {
  const editor = useSlateStatic()
  const isActive = isBlockActive(editor, format, TEXT_ALIGN_TYPES.includes(format) ? "align" : "type")
  
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
        event.preventDefault()
    toggleBlock(editor, format)
  }, [editor, format])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isActive ? "default" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={handleMouseDown}
    >
      {icon}
    </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
})

const ListButton = memo(({ format, icon, tooltip }: { format: "numbered-list" | "bulleted-list"; icon: React.ReactNode; tooltip: string }) => {
  const editor = useSlateStatic()
  const currentListType = getCurrentListType(editor)
  
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    toggleList(editor, format)
  }, [editor, format])
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
    <Button
          variant={currentListType === format ? "default" : "ghost"}
      size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={handleMouseDown}
    >
      {icon}
    </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
})

const ColorButton = memo(() => {
  const editor = useSlateStatic()
  
  const handleColorClick = useCallback((color: string, isBackground = false) => (event: React.MouseEvent) => {
    event.preventDefault()
    toggleMark(editor, isBackground ? "backgroundColor" : "color", color)
  }, [editor])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <Palette className="h-4 w-4" />
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <div className="p-2">
          <div className="text-xs font-medium mb-2">Text Color</div>
          <div className="grid grid-cols-8 gap-1 mb-3">
          {[
              "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9ead3", "#fce5cd",
              "#fff2cc", "#f4cccc", "#d0e0e3", "#c9daf8", "#34a853", "#ff9900", "#fbbc04", "#ea4335",
              "#4285f4", "#9900ff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"
            ].map((color) => (
              <button
                key={color}
                className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onMouseDown={handleColorClick(color, false)}
              />
            ))}
          </div>
          <div className="text-xs font-medium mb-2">Highlight Color</div>
          <div className="grid grid-cols-8 gap-1">
            {[
              "#ffeb3b", "#4caf50", "#2196f3", "#ff9800", "#f44336", "#9c27b0", "#607d8b", "#795548"
          ].map((color) => (
            <button
              key={color}
              className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
                onMouseDown={handleColorClick(color, true)}
            />
          ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

const FontFamilySelect = memo(() => {
  const editor = useSlateStatic()
  const marks = Editor.marks(editor) || {}
  const currentFont = (marks.fontFamily as string) || "Arial"

  const handleFontChange = useCallback((value: string) => {
    toggleMark(editor, "fontFamily", value)
  }, [editor])

  return (
    <Select value={currentFont} onValueChange={handleFontChange}>
      <SelectTrigger className="w-40 h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Arial">Arial</SelectItem>
        <SelectItem value="Helvetica">Helvetica</SelectItem>
        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
        <SelectItem value="Courier New">Courier New</SelectItem>
        <SelectItem value="Georgia">Georgia</SelectItem>
        <SelectItem value="Verdana">Verdana</SelectItem>
        <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
        <SelectItem value="Impact">Impact</SelectItem>
        <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
      </SelectContent>
    </Select>
  )
})

const FontSizeSelect = memo(() => {
  const editor = useSlateStatic()
  const marks = Editor.marks(editor) || {}
  const currentSize = (marks.fontSize as string) || "14"

  const handleSizeChange = useCallback((value: string) => {
    toggleMark(editor, "fontSize", value)
  }, [editor])

  return (
    <Select value={currentSize} onValueChange={handleSizeChange}>
      <SelectTrigger className="w-16 h-8 text-sm">
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
        <SelectItem value="48">48</SelectItem>
        <SelectItem value="72">72</SelectItem>
      </SelectContent>
    </Select>
  )
})

const HeadingSelect = memo(() => {
  const editor = useSlateStatic()
  const [match] = Array.from(
    Editor.nodes(editor, {
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n),
    })
  )
  
  const currentType = match ? (match[0] as CustomElement).type : "paragraph"

  const handleHeadingChange = useCallback((value: string) => {
    toggleBlock(editor, value)
  }, [editor])

  return (
    <Select value={currentType} onValueChange={handleHeadingChange}>
      <SelectTrigger className="w-32 h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="paragraph">Normal text</SelectItem>
        <SelectItem value="heading-one">Heading 1</SelectItem>
        <SelectItem value="heading-two">Heading 2</SelectItem>
        <SelectItem value="heading-three">Heading 3</SelectItem>
        <SelectItem value="heading-four">Heading 4</SelectItem>
        <SelectItem value="heading-five">Heading 5</SelectItem>
        <SelectItem value="heading-six">Heading 6</SelectItem>
        <SelectItem value="blockquote">Quote</SelectItem>
      </SelectContent>
    </Select>
  )
})

const LinkButton = memo(() => {
  const editor = useSlateStatic()
  
  const handleLinkClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    const url = window.prompt("Enter the URL of the link:")
    if (url && !isLinkActive(editor)) {
      wrapLink(editor, url)
    }
  }, [editor])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={handleLinkClick}
        >
          <Link className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Insert link (⌘K)</p>
      </TooltipContent>
    </Tooltip>
  )
})

// Memoized Toolbar to prevent unnecessary re-renders
const Toolbar = memo(() => {
  const editor = useSlateStatic()

  const handleUndo = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    ;(editor as unknown as HistoryEditor).undo()
  }, [editor])

  const handleRedo = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    ;(editor as unknown as HistoryEditor).redo()
  }, [editor])

  const handleIndentClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    indentListItem(editor)
  }, [editor])

  const handleOutdentClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    outdentListItem(editor)
  }, [editor])

  return (
    <TooltipProvider>
      <div className="border-b border-gray-200 bg-white">
        <div className="flex items-center gap-1 p-2 flex-wrap">
          {/* File operations */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Printer className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Print (⌘P)</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onMouseDown={handleUndo}
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Undo (⌘Z)</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onMouseDown={handleRedo}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Redo (⌘Y)</p></TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Zoom and spell check */}
          <Select defaultValue="100%">
            <SelectTrigger className="w-20 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50%">50%</SelectItem>
              <SelectItem value="75%">75%</SelectItem>
              <SelectItem value="100%">100%</SelectItem>
              <SelectItem value="125%">125%</SelectItem>
              <SelectItem value="150%">150%</SelectItem>
              <SelectItem value="200%">200%</SelectItem>
          </SelectContent>
        </Select>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <SpellCheck className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Spell check</p></TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Style and formatting */}
          <HeadingSelect />
          <FontFamilySelect />
          <FontSizeSelect />

        <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text formatting */}
          <MarkButton format="bold" icon={<Bold className="h-4 w-4" />} tooltip="Bold (⌘B)" />
          <MarkButton format="italic" icon={<Italic className="h-4 w-4" />} tooltip="Italic (⌘I)" />
          <MarkButton format="underline" icon={<Underline className="h-4 w-4" />} tooltip="Underline (⌘U)" />
          <MarkButton format="strikethrough" icon={<Strikethrough className="h-4 w-4" />} tooltip="Strikethrough" />

        <ColorButton />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
          <BlockButton format="left" icon={<AlignLeft className="h-4 w-4" />} tooltip="Align left (⌘⇧L)" />
          <BlockButton format="center" icon={<AlignCenter className="h-4 w-4" />} tooltip="Align center (⌘⇧E)" />
          <BlockButton format="right" icon={<AlignRight className="h-4 w-4" />} tooltip="Align right (⌘⇧R)" />
          <BlockButton format="justify" icon={<AlignJustify className="h-4 w-4" />} tooltip="Justify (⌘⇧J)" />

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Line spacing and indentation */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <Type className="h-4 w-4" />
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Single</DropdownMenuItem>
              <DropdownMenuItem>1.15</DropdownMenuItem>
              <DropdownMenuItem>1.5</DropdownMenuItem>
              <DropdownMenuItem>Double</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onMouseDown={handleOutdentClick}
              >
                <Outdent className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Decrease indent (⌘[)</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onMouseDown={handleIndentClick}
              >
                <Indent className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Increase indent (⌘])</p></TooltipContent>
          </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
          <ListButton format="bulleted-list" icon={<List className="h-4 w-4" />} tooltip="Bulleted list (⌘⇧8)" />
          <ListButton format="numbered-list" icon={<ListOrdered className="h-4 w-4" />} tooltip="Numbered list (⌘⇧7)" />

        <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Insert and format */}
        <LinkButton />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <MoreHorizontal className="h-4 w-4" />
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => toggleMark(editor, "superscript")}>
                Superscript
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleMark(editor, "subscript")}>
                Subscript
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => clearFormatting(editor)}>
                Clear formatting
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  )
})

export function RichTextEditor({ value, onChange, placeholder = "Start writing..." }: RichTextEditorProps) {
  const renderElement = useCallback((props: any) => <Element {...props} />, [])
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, [])
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])

  // Use useState for immediate local updates without debouncing
  const [editorValue, setEditorValue] = useState<Descendant[]>(() => {
    if (value) {
      try {
        return JSON.parse(value)
      } catch {
        return [{ type: "paragraph", children: [{ text: value }] }]
      }
    }
    return [{ type: "paragraph", children: [{ text: "" }] }]
  })

  // Batch parent updates with RAF for smooth performance
  const parentUpdateRef = useRef<number | undefined>(undefined)
  
  const handleChange = useCallback((newValue: Descendant[]) => {
    // Immediate local state update for instant typing
    setEditorValue(newValue)

    // Batch parent updates with requestAnimationFrame
    if (parentUpdateRef.current) {
      cancelAnimationFrame(parentUpdateRef.current)
    }
    
    parentUpdateRef.current = requestAnimationFrame(() => {
      onChange(JSON.stringify(newValue))
    })
  }, [onChange])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (parentUpdateRef.current) {
        cancelAnimationFrame(parentUpdateRef.current)
      }
    }
  }, [])

  // Optimized keyboard handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle these shortcuts here - let them bubble up to global handlers
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'c') {
      return // Let global word count dialog handle this
    }
    if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'k') {
      return // Let global link dialog handle this
    }

    // Handle Enter key in lists
    if (event.key === 'Enter') {
      if (isInList(editor)) {
        const { selection } = editor
        if (selection && Range.isCollapsed(selection)) {
          const [node] = Editor.node(editor, selection.anchor.path)
          if (SlateElement.isElement(node) && node.type === 'list-item') {
            const isEmpty = Editor.string(editor, [selection.anchor.path[0]]) === ''
            if (isEmpty) {
              // Exit list on empty list item
              event.preventDefault()
              Transforms.unwrapNodes(editor, {
                match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && LIST_TYPES.includes(n.type),
                split: true,
              })
              Transforms.setNodes(editor, { type: 'paragraph' })
              return
            } else {
              // Create new list item
              event.preventDefault()
              insertListItem(editor)
              return
            }
          }
        }
      }
    }

    // Handle Tab for indentation
    if (event.key === 'Tab') {
      event.preventDefault()
      if (isInList(editor)) {
        if (event.shiftKey) {
          outdentListItem(editor)
        } else {
          indentListItem(editor)
        }
      } else {
        // Insert four spaces for normal paragraphs
        Transforms.insertText(editor, "    ")
      }
      return
    }

    // Bold, Italic, Underline, Strikethrough
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
        case "y":
          event.preventDefault()
          ;(editor as unknown as HistoryEditor).redo()
          return
        case "\\":
          event.preventDefault()
          clearFormatting(editor)
          return
        case "[":
          event.preventDefault()
          outdentListItem(editor)
          return
        case "]":
          event.preventDefault()
          indentListItem(editor)
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
          toggleList(editor, "numbered-list")
          return
        case "8":
          event.preventDefault()
          toggleList(editor, "bulleted-list")
          return
        case ".":
          event.preventDefault()
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
            4: "heading-four",
            5: "heading-five",
            6: "heading-six",
          }
          toggleBlock(editor, map[num] || "paragraph")
        }
      }
      
      // Strikethrough
      if (event.key.toLowerCase() === 'x') {
        event.preventDefault()
        toggleMark(editor, "strikethrough")
        return
      }
    }

    // Superscript and subscript
    if (event.ctrlKey && !event.shiftKey && !event.altKey) {
      if (event.key === '.') {
        event.preventDefault()
        toggleMark(editor, "superscript")
        return
      }
      if (event.key === ',') {
        event.preventDefault()
        toggleMark(editor, "subscript")
        return
      }
    }
  }, [editor])

  // Simple page calculation
  const pageCount = Math.max(1, Math.ceil(JSON.stringify(editorValue).length / 1800))

  return (
    <div className="bg-white h-full flex flex-col">
      <Slate editor={editor} initialValue={editorValue} onChange={handleChange}>
        <Toolbar />
        <div className="bg-gray-100 flex-1 overflow-auto">
          <div className="py-8 px-6">
            <div className="max-w-none flex flex-col items-center space-y-6">
              {/* Main content page */}
              <div
                className="bg-white shadow-lg flex-shrink-0 relative"
                style={{
                  width: '8.5in',
                  minHeight: '11in',
                  padding: '1in',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                }}
              >
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder={placeholder}
            spellCheck
            autoFocus
                  onKeyDown={handleKeyDown}
                  className="outline-none w-full leading-relaxed resize-none"
                  style={{ 
                    fontFamily: "Arial, sans-serif", 
                    fontSize: "14px", 
                    lineHeight: "1.6",
                    minHeight: "9in",
                    overflow: "visible",
                  }}
                />
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
                  1
                </div>
              </div>

              {/* Additional pages */}
              {pageCount > 1 && Array.from({ length: pageCount - 1 }, (_, index) => (
                <div
                  key={`page-${index + 2}`}
                  className="bg-white shadow-lg flex-shrink-0 relative"
                  style={{
                    width: '8.5in',
                    height: '11in',
                    padding: '1in',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  }}
                >
                  <div 
                    className="w-full h-full"
                    style={{
                      fontFamily: "Arial, sans-serif", 
                      fontSize: "14px", 
                      lineHeight: "1.6",
                      minHeight: "9in",
                    }}
          />
                  
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
                    {index + 2}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Slate>
    </div>
  )
}

// Memoized Element component
const Element = memo(({ attributes, children, element }: any) => {
  const style: React.CSSProperties = { 
    textAlign: element.align,
    marginLeft: element.indent ? `${element.indent * 20}px` : undefined,
  }
  
  switch (element.type) {
    case "bulleted-list":
      return (
        <ul style={style} className="list-disc pl-6 my-2" {...attributes}>
          {children}
        </ul>
      )
    case "numbered-list":
      return (
        <ol style={style} className="list-decimal pl-6 my-2" {...attributes}>
          {children}
        </ol>
      )
    case "list-item":
      return (
        <li style={style} className="my-1" {...attributes}>
          {children}
        </li>
      )
    case "heading-one":
      return (
        <h1 style={style} className="text-3xl font-bold my-4" {...attributes}>
          {children}
        </h1>
      )
    case "heading-two":
      return (
        <h2 style={style} className="text-2xl font-bold my-3" {...attributes}>
          {children}
        </h2>
      )
    case "heading-three":
      return (
        <h3 style={style} className="text-xl font-bold my-3" {...attributes}>
          {children}
        </h3>
      )
    case "heading-four":
      return (
        <h4 style={style} className="text-lg font-bold my-2" {...attributes}>
          {children}
        </h4>
      )
    case "heading-five":
      return (
        <h5 style={style} className="text-base font-bold my-2" {...attributes}>
          {children}
        </h5>
      )
    case "heading-six":
      return (
        <h6 style={style} className="text-sm font-bold my-2" {...attributes}>
          {children}
        </h6>
      )
    case "blockquote":
      return (
        <blockquote style={style} className="border-l-4 border-gray-300 pl-4 my-4 italic" {...attributes}>
          {children}
        </blockquote>
      )
    case "code-block":
      return (
        <pre style={style} className="bg-gray-100 p-4 rounded font-mono text-sm my-4" {...attributes}>
          <code>{children}</code>
        </pre>
      )
    case "link":
      return (
        <a {...attributes} href={element.url} className="text-blue-600 underline hover:text-blue-800">
          {children}
        </a>
      )
    default:
      return (
        <p style={style} className="my-2" {...attributes}>
          {children}
        </p>
      )
  }
})

// Memoized Leaf component
const Leaf = memo(({ attributes, children, leaf }: any) => {
  const style: React.CSSProperties = {}
  
  if (leaf.color) {
    style.color = leaf.color
  }
  if (leaf.backgroundColor) {
    style.backgroundColor = leaf.backgroundColor
  }
  if (leaf.fontSize) {
    style.fontSize = `${leaf.fontSize}px`
  }
  if (leaf.fontFamily) {
    style.fontFamily = leaf.fontFamily
  }

  if (leaf.bold) {
    children = <strong>{children}</strong>
  }
  if (leaf.italic) {
    children = <em>{children}</em>
  }
  if (leaf.underline) {
    children = <u>{children}</u>
  }
  if (leaf.strikethrough) {
    children = <s>{children}</s>
  }
  if (leaf.superscript) {
    children = <sup>{children}</sup>
  }
  if (leaf.subscript) {
    children = <sub>{children}</sub>
  }

  return (
    <span {...attributes} style={style}>
      {children}
    </span>
  )
})
