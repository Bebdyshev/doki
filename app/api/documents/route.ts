import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromToken } from "@/lib/auth"
import { getUserDocuments } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = getCurrentUserFromToken(token)
    
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const documents = await getUserDocuments(payload.userId)
    
    return NextResponse.json(documents)
  } catch (error) {
    console.error("Get documents API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 