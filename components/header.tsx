'use client'
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, LogOut, User as UserIcon } from "lucide-react"

interface HeaderProps {
  user?: {
    name?: string
    email?: string
    avatar_url?: string | null
  }
  onLogout?: () => void
}

export default function Header({ user, onLogout }: HeaderProps) {
  let storedAvatar: string | null = null
  if (typeof window !== 'undefined') {
    storedAvatar = localStorage.getItem('avatar_url')
  }

  // Determine avatar: Google picture from localStorage > backend avatar_url > ui-avatars
  const avatarSrc = storedAvatar || user?.avatar_url ||
    (user?.name
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff&size=128`
      : null)

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2">
          <FileText className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">Doki</span>
        </Link>

        {/* User menu */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                {avatarSrc ? (
                  <Image src={avatarSrc} alt={user.name || "User"} width={24} height={24} className="rounded-full" />
                ) : (
                  <UserIcon className="h-5 w-5" />
                )}
                {user.name && <span className="hidden sm:inline-block max-w-[120px] truncate">{user.name}</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/login">
            <Button variant="outline" size="sm">Login</Button>
          </Link>
        )}
      </div>
    </header>
  )
} 