# 数据标注工具实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 构建一个企业级图像数据标注工具，支持多种标注模式、团队协作、质量控制和模型预标注。

**架构：** Next.js 14+ 全栈应用，使用 Supabase 作为后端服务（PostgreSQL + Auth + Storage + Realtime），支持 Web 和 Electron 桌面应用。

**技术栈：** Next.js 14, React 18, TypeScript, shadcn/ui, Tailwind CSS, Fabric.js, Supabase, Prisma, Jest, Playwright

---

## 阶段一：项目初始化与基础设施（Phase 1）

### Task 1.1: 初始化 Next.js 项目

**文件：**
- 创建：`package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.js`, `postcss.config.js`

**Step 1: 创建 Next.js 项目**

```bash
npx create-next-app@latest . --typescript --tailwind --app --import-alias "@/*"
```

**Step 2: 安装核心依赖**

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @prisma/client
npm install zod
npm install date-fns
npm install -D prisma @types/node
```

**Step 3: 安装 UI 组件库**

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label select dialog dropdown-menu
```

**Step 4: 安装标注画布库**

```bash
npm install fabric
npm install -D @types/fabric
```

**Step 5: 验证项目结构**

```bash
npm run dev
```

预期：项目成功启动在 http://localhost:3000

**Step 6: 提交**

```bash
git add .
git commit -m "chore: initialize Next.js project with dependencies"
```

---

### Task 1.2: 配置 Supabase 连接

**文件：**
- 创建：`.env.local`, `lib/supabase/client.ts`, `lib/supabase/server.ts`

**Step 1: 创建环境变量文件**

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url
```

**Step 2: 编写 Supabase 客户端配置测试**

```typescript
// __tests__/lib/supabase/client.test.ts
import { createClient } from '@/lib/supabase/client'

describe('Supabase Client', () => {
  it('should create a Supabase client', () => {
    const client = createClient()
    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
    expect(client.from).toBeDefined()
  })
})
```

**Step 3: 实现客户端配置**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 4: 实现服务端配置**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle cookie error
          }
        },
      },
    }
  )
}
```

**Step 5: 运行测试**

```bash
npm test -- __tests__/lib/supabase/client.test.ts
```

预期：测试通过

**Step 6: 提交**

```bash
git add .
git commit -m "feat: add Supabase client configuration"
```

---

### Task 1.3: 配置 Prisma

**文件：**
- 创建：`prisma/schema.prisma`, `lib/prisma.ts`

**Step 1: 初始化 Prisma**

```bash
npx prisma init
```

**Step 2: 定义数据库 Schema**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  fullName      String?  @map("full_name")
  avatarUrl     String?  @map("avatar_url")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  projects      ProjectMember[]
  annotations   Annotation[]
  reviews       Review[]
  models        Model[]
  tasks         PreAnnotationTask[]

  @@map("users")
}

model Project {
  id              String   @id @default(uuid())
  name            String
  description     String?
  ownerId         String   @map("owner_id")
  status          String   @default("active")
  annotationTypes Json?   @map("annotation_types")
  labels          Json?
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  owner           User              @relation(fields: [ownerId], references: [id])
  members         ProjectMember[]
  datasets        Dataset[]
  models          Model[]
  tasks           PreAnnotationTask[]

  @@map("projects")
}

model ProjectMember {
  id        String   @id @default(uuid())
  projectId String   @map("project_id")
  userId    String   @map("user_id")
  role      String
  joinedAt  DateTime @default(now()) @map("joined_at")

  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id])

  @@unique([projectId, userId])
  @@map("project_members")
}

model Dataset {
  id              String   @id @default(uuid())
  projectId       String   @map("project_id")
  name            String
  description     String?
  totalImages     Int      @default(0) @map("total_images")
  annotatedCount  Int      @default(0) @map("annotated_count")
  createdAt       DateTime @default(now()) @map("created_at")

  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  images          Image[]
  tasks           PreAnnotationTask[]

  @@map("datasets")
}

model Image {
  id           String   @id @default(uuid())
  datasetId    String   @map("dataset_id")
  filename     String
  storagePath  String   @map("storage_path")
  width        Int?
  height       Int?
  status       String   @default("pending")
  uploadedBy   String   @map("uploaded_by")
  uploadedAt   DateTime @default(now()) @map("uploaded_at")

  dataset      Dataset       @relation(fields: [datasetId], references: [id], onDelete: Cascade)
  annotations  Annotation[]

  @@index([datasetId, status])
  @@map("images")
}

model Annotation {
  id              String   @id @default(uuid())
  imageId         String   @map("image_id")
  annotatorId     String   @map("annotator_id")
  annotationType  String   @map("annotation_type")
  data            Json
  isPreAnnotated  Boolean  @default(false) @map("is_pre_annotated")
  modelId         String?  @map("model_id")
  status          String   @default("draft")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  image           Image    @relation(fields: [imageId], references: [id], onDelete: Cascade)
  annotator       User      @relation(fields: [annotatorId], references: [id])
  reviews         Review[]

  @@index([imageId, status])
  @@map("annotations")
}

model Review {
  id           String   @id @default(uuid())
  annotationId String   @map("annotation_id")
  reviewerId   String   @map("reviewer_id")
  status       String
  comment      String?
  reviewedAt   DateTime @default(now()) @map("reviewed_at")

  annotation   Annotation @relation(fields: [annotationId], references: [id], onDelete: Cascade)
  reviewer     User       @relation(fields: [reviewerId], references: [id])

  @@map("reviews")
}

model Model {
  id        String   @id @default(uuid())
  name      String
  type      String
  provider  String
  config    Json?
  isActive  Boolean  @default(true) @map("is_active")
  createdBy String   @map("created_by")
  createdAt DateTime @default(now()) @map("created_at")

  creator   User                @relation(fields: [createdBy], references: [id])
  project   Project?            @relation(fields: [projectId], references: [id])
  projectId String?             @map("project_id")
  tasks     PreAnnotationTask[]

  @@map("models")
}

model PreAnnotationTask {
  id               String    @id @default(uuid())
  projectId        String    @map("project_id")
  datasetId        String    @map("dataset_id")
  modelId          String    @map("model_id")
  status           String    @default("pending")
  totalImages      Int?      @map("total_images")
  processedImages  Int?      @map("processed_images")
  createdBy        String    @map("created_by")
  createdAt        DateTime  @default(now()) @map("created_at")
  completedAt      DateTime? @map("completed_at")

  project          Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  dataset          Dataset   @relation(fields: [datasetId], references: [id], onDelete: Cascade)
  model            Model     @relation(fields: [modelId], references: [id])
  creator          User      @relation(fields: [createdBy], references: [id])

  @@index([status])
  @@map("pre_annotation_tasks")
}
```

**Step 3: 创建 Prisma 客户端**

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Step 4: 生成 Prisma 客户端**

```bash
npx prisma generate
npx prisma db push
```

**Step 5: 提交**

```bash
git add .
git commit -m "feat: add Prisma schema and client configuration"
```

---

### Task 1.4: 配置测试环境

**文件：**
- 创建：`jest.config.js`, `jest.setup.js`, `__mocks__/`

**Step 1: 安装测试依赖**

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
npm install -D @playwright/test
```

**Step 2: 配置 Jest**

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

**Step 3: 配置 Jest Setup**

```javascript
// jest.setup.js
import '@testing-library/jest-dom'
```

**Step 4: 配置 Playwright**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**Step 5: 添加测试脚本到 package.json**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test"
  }
}
```

**Step 6: 提交**

```bash
git add .
git commit -m "chore: configure Jest and Playwright testing"
```

---

## 阶段二：用户认证系统（Phase 2）

### Task 2.1: 创建认证上下文

**文件：**
- 创建：`contexts/AuthContext.tsx`, `hooks/useAuth.ts`

**Step 1: 编写认证 Hook 测试**

```typescript
// __tests__/hooks/useAuth.test.ts
import { renderHook } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'

describe('useAuth', () => {
  it('should return auth state and methods', () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(true)
    expect(typeof result.current.signIn).toBe('function')
    expect(typeof result.current.signUp).toBe('function')
    expect(typeof result.current.signOut).toBe('function')
  })
})
```

**Step 2: 实现认证上下文**

```typescript
// contexts/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

**Step 3: 创建 useAuth Hook**

```typescript
// hooks/useAuth.ts
export { useAuth } from '@/contexts/AuthContext'
```

**Step 4: 运行测试**

```bash
npm test -- __tests__/hooks/useAuth.test.ts
```

预期：测试通过

**Step 5: 提交**

```bash
git add .
git commit -m "feat: add authentication context and hooks"
```

---

### Task 2.2: 创建登录/注册页面

**文件：**
- 创建：`app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`
- 创建：`components/auth/LoginForm.tsx`, `components/auth/SignupForm.tsx`

**Step 1: 编写登录表单测试**

```typescript
// __tests__/components/auth/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '@/components/auth/LoginForm'

describe('LoginForm', () => {
  it('should render login form', () => {
    render(<LoginForm />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('should call onSubmit with form data', async () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })
})
```

**Step 2: 实现登录表单组件**

```typescript
// components/auth/LoginForm.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LoginFormProps {
  onSubmit?: (data: { email: string; password: string }) => void
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.({ email, password })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Login
      </Button>
    </form>
  )
}
```

**Step 3: 实现登录页面**

```typescript
// app/(auth)/login/page.tsx
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
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-center">Sign in</h2>
          <p className="text-center text-muted-foreground mt-2">
            Data Annotation Tool
          </p>
        </div>
        <LoginForm onSubmit={handleLogin} />
        <p className="text-center text-sm">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
```

**Step 4: 运行测试**

```bash
npm test -- __tests__/components/auth/LoginForm.test.tsx
```

预期：测试通过

**Step 5: 提交**

```bash
git add .
git commit -m "feat: add login page and form component"
```

---

### Task 2.3: 创建认证中间件

**文件：**
- 创建：`middleware.ts`, `app/(protected)/layout.tsx`

**Step 1: 创建认证中间件**

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { data: { session } } = await supabase.auth.getSession()

  // Protected routes
  if (req.nextUrl.pathname.startsWith('/projects') ||
      req.nextUrl.pathname.startsWith('/settings')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Auth routes - redirect if already logged in
  if (req.nextUrl.pathname === '/login' || 
      req.nextUrl.pathname === '/signup') {
    if (session) {
      return NextResponse.redirect(new URL('/projects', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/projects/:path*', '/settings/:path*', '/login', '/signup']
}
```

**Step 2: 创建受保护布局**

```typescript
// app/(protected)/layout.tsx
import { AuthProvider } from '@/contexts/AuthContext'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthProvider>{children}</AuthProvider>
}
```

**Step 3: 提交**

```bash
git add .
git commit -m "feat: add authentication middleware"
```

---

## 阶段三：项目管理模块（Phase 3）

### Task 3.1: 创建项目列表页面

**文件：**
- 创建：`app/(protected)/projects/page.tsx`, `components/projects/ProjectList.tsx`

**Step 1: 编写项目列表测试**

```typescript
// __tests__/components/projects/ProjectList.test.tsx
import { render, screen } from '@testing-library/react'
import { ProjectList } from '@/components/projects/ProjectList'

const mockProjects = [
  {
    id: '1',
    name: 'Project 1',
    description: 'Description 1',
    status: 'active',
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Project 2',
    description: 'Description 2',
    status: 'active',
    createdAt: new Date(),
  },
]

describe('ProjectList', () => {
  it('should render list of projects', () => {
    render(<ProjectList projects={mockProjects} />)
    
    expect(screen.getByText('Project 1')).toBeInTheDocument()
    expect(screen.getByText('Project 2')).toBeInTheDocument()
  })

  it('should show empty state when no projects', () => {
    render(<ProjectList projects={[]} />)
    
    expect(screen.getByText(/no projects/i)).toBeInTheDocument()
  })
})
```

**Step 2: 实现项目列表组件**

```typescript
// components/projects/ProjectList.tsx
import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  createdAt: Date
}

interface ProjectListProps {
  projects: Project[]
}

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No projects yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Link key={project.id} href={`/projects/${project.id}`}>
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <h3 className="text-lg font-semibold">{project.name}</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {project.description}
            </p>
            <div className="flex items-center mt-4">
              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                {project.status}
              </span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
```

**Step 3: 实现项目列表页面**

```typescript
// app/(protected)/projects/page.tsx
import { createClient } from '@/lib/supabase/server'
import { ProjectList } from '@/components/projects/ProjectList'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ProjectsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .or(`owner_id.eq.${user?.id},members.cs.${user?.id}`)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Link href="/projects/new">
          <Button>New Project</Button>
        </Link>
      </div>
      <ProjectList projects={projects || []} />
    </div>
  )
}
```

**Step 4: 运行测试**

```bash
npm test -- __tests__/components/projects/ProjectList.test.tsx
```

预期：测试通过

**Step 5: 提交**

```bash
git add .
git commit -m "feat: add project list page and component"
```

---

*（由于篇幅限制，实施计划将继续包含以下阶段...）*

## 后续阶段概览

- **Phase 4：** 数据集和图像管理
- **Phase 5：** 标注工作台开发
- **Phase 6：** 数据导入导出功能
- **Phase 7：** 任务分配与协作功能
- **Phase 8：** 质量控制与审核流程
- **Phase 9：** 模型预标注功能
- **Phase 10：** 桌面应用打包（Electron）

每个阶段将按照相同的 TDD 方式实施，包含详细测试用例和完整代码。
