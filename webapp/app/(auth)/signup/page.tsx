'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { SignupForm } from '@/components/auth/SignupForm'
import Link from 'next/link'
import { AuthProvider } from '@/contexts/AuthContext'

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic'

export default function SignupPage() {
  return (
    <AuthProvider>
      <SignupPageContent />
    </AuthProvider>
  )
}

function SignupPageContent() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (data: { email: string; password: string; fullName: string }) => {
    try {
      setError(null)
      setLoading(true)
      await signUp(data.email, data.password, data.fullName)
      router.push('/projects')
    } catch (error: any) {
      console.error('Signup failed:', error)
      setError(error?.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div>
          <h2 className="text-3xl font-bold text-center">Sign up</h2>
          <p className="text-center text-muted-foreground mt-2">
            Data Annotation Tool
          </p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}
        <SignupForm onSubmit={handleSignup} loading={loading} />
        <p className="text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
