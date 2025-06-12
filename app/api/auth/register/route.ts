import { NextRequest, NextResponse } from "next/server"
import { createUser, getUser } from "@/lib/db"
import { hashPassword, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await getUser(email)
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Create new user
    const passwordHash = await hashPassword(password)
    const user = await createUser(email, name, passwordHash)

    // Generate token
    const token = generateToken(user.id, user.email)

    return NextResponse.json({
      access_token: token,
      type: "bearer",
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error("Register API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 