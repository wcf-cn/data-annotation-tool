'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'
import { AuthProvider } from '@/contexts/AuthContext'

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginPageContent />
    </AuthProvider>
  )
}

function LoginPageContent() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      setError(null)
      setLoading(true)
      await signIn(data.email, data.password)
      router.push('/projects')
    } catch (error: any) {
      console.error('Login failed:', error)
      setError(error?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div>
          <h2 className="text-3xl font-bold text-center">Sign in</h2>
          <p className="text-center text-muted-foreground mt-2">
            Data Annotation Tool
          </p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}
        <LoginForm onSubmit={handleLogin} loading={loading} />
        <p className="text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
