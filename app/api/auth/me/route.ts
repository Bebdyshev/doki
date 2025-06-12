import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromToken } from "@/lib/auth"
import { getUser } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix
    const payload = getCurrentUserFromToken(token)
    
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get full user data from database
    const user = await getUser(payload.email)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      type: "user"
    })
  } catch (error) {
    console.error("Get me API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 