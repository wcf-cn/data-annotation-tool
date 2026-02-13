'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      await signIn(data.email, data.password)
      router.push('/projects')
    } catch (error) {
      console.error('Login failed:', error)
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
        <LoginForm onSubmit={handleLogin} />
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
