import { useEffect, useRef } from "react"

// Type declaration for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (element: HTMLElement, config: any) => void
        }
      }
    }
  }
}

interface GoogleLoginButtonProps {
  onSuccess: (credential: string) => void
  buttonText?: string
}

export default function GoogleLoginButton({ onSuccess, buttonText = "Continue with Google" }: GoogleLoginButtonProps) {
  const divRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load Google script if not already present
    if (typeof window === "undefined") return
    const existing = document.getElementById("google-identity-services")
    if (!existing) {
      const script = document.createElement("script")
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.id = "google-identity-services"
      script.onload = () => initialize()
      document.body.appendChild(script)
    } else {
      initialize()
    }

    function initialize() {
      if (!window.google || !divRef.current) return
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (!clientId) {
        console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID env var not set")
        return
      }
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp: any) => {
          if (resp.credential) {
            onSuccess(resp.credential)
          }
        },
      })
      window.google.accounts.id.renderButton(divRef.current, {
        type: "standard",
        theme: "filled_blue",
        size: "large",
        text: buttonText,
      })
    }
  }, [onSuccess, buttonText])

  return <div ref={divRef} />
} 