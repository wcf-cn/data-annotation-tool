'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { SignupForm } from '@/components/auth/SignupForm'
import Link from 'next/link'
import { AuthProvider } from '@/contexts/AuthContext'

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

  const handleSignup = async (data: { email: string; password: string; fullName: string }) => {
    try {
      await signUp(data.email, data.password, data.fullName)
      router.push('/projects')
    } catch (error) {
      console.error('Signup failed:', error)
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
        <SignupForm onSubmit={handleSignup} />
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
