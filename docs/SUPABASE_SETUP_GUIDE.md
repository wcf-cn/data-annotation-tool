# Supabase 配置指南

本指南将帮助你从零开始配置 Supabase 项目。

---

## 第一步：创建 Supabase 账号

### 1.1 访问 Supabase 官网

访问：https://supabase.com

### 1.2 注册账号

1. 点击右上角 **"Start your project"**
2. 选择注册方式：
   - GitHub 账号（推荐）
   - Google 账号
   - 邮箱注册

### 1.3 验证邮箱

如果使用邮箱注册，检查收件箱并点击验证链接。

---

## 第二步：创建新项目

### 2.1 创建组织

首次使用需要创建组织：

1. 点击 **"New Organization"**
2. 填写组织名称（如：`Personal` 或 `MyCompany`）
3. 选择计划：**Free** （免费计划足够开发使用）
4. 点击 **"Create Organization"**

### 2.2 创建项目

在组织下创建项目：

1. 点击 **"New Project"**
2. 填写项目信息：
   - **Name**: `data-annotation-tool`（或你喜欢的名称）
   - **Database Password**: 设置一个强密码（记住这个密码！）
   - **Region**: 选择离你最近的区域
     - 亚洲用户推荐：`Northeast Asia (Tokyo)` 或 `Southeast Asia (Singapore)`
   - **Plan**: Free
3. 点击 **"Create new project"**
4. 等待 1-2 分钟，项目初始化完成

---

## 第三步：获取 API 密钥

### 3.1 打开项目设置

1. 在项目仪表板中，点击左侧菜单的 **"Settings"**（齿轮图标）
2. 点击 **"API"** 选项

### 3.2 复制 API 密钥

你需要复制以下信息：

#### Project URL
```
https://xxxxxxxxxxxxx.supabase.co
```

#### anon key (公开密钥)
在 **"Project API keys"** 部分找到 `anon public` 密钥，点击复制。

#### service_role key (服务端密钥)
在 **"Project API keys"** 部分找到 `service_role` 密钥，点击复制。

⚠️ **重要提示：**
- `anon key` 可以暴露给前端，用于客户端调用
- `service_role key` 必须保密，只能在服务端使用，拥有完全权限

### 3.4 获取数据库连接字符串

1. 在 Settings 中点击 **"Database"** 选项
2. 找到 **"Connection string"** 部分
3. 选择 **"URI"** 格式
4. 复制连接字符串，格式如下：
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

⚠️ **注意：** 将 `[YOUR-PASSWORD]` 替换为你在第二步创建项目时设置的数据库密码。

---

## 第四步：配置环境变量

### 4.1 创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
# 在 /Users/wcf/CodeBuddy 目录下
touch .env.local
```

### 4.2 填写环境变量

打开 `.env.local` 文件，粘贴以下内容并替换为你的实际值：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 服务端密钥（保密！）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 数据库连接字符串（替换 [YOUR-PASSWORD] 为你的数据库密码）
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"
```

---

## 第五步：配置数据库表

有两种方式配置数据库表：

### 方式一：使用 SQL 编辑器（推荐新手）

#### 5.1 打开 SQL 编辑器

1. 在 Supabase 项目仪表板，点击左侧菜单的 **"SQL Editor"**
2. 点击 **"New query"**

#### 5.2 执行建表 SQL

复制以下 SQL 语句到编辑器中，然后点击 **"Run"**：

```sql
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建项目表
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id),
  status VARCHAR DEFAULT 'active',
  annotation_types JSONB,
  labels JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建项目成员表
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role VARCHAR NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 创建数据集表
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  total_images INT DEFAULT 0,
  annotated_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建图像表
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  filename VARCHAR NOT NULL,
  storage_path TEXT NOT NULL,
  width INT,
  height INT,
  status VARCHAR DEFAULT 'pending',
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- 创建标注表
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  annotator_id UUID REFERENCES users(id),
  annotation_type VARCHAR NOT NULL,
  data JSONB NOT NULL,
  is_pre_annotated BOOLEAN DEFAULT FALSE,
  model_id UUID,
  status VARCHAR DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建审核表
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annotation_id UUID REFERENCES annotations(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id),
  status VARCHAR NOT NULL,
  comment TEXT,
  reviewed_at TIMESTAMP DEFAULT NOW()
);

-- 创建模型表
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  provider VARCHAR NOT NULL,
  config JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建预标注任务表
CREATE TABLE pre_annotation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  model_id UUID REFERENCES models(id),
  status VARCHAR DEFAULT 'pending',
  total_images INT,
  processed_images INT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_images_dataset_status ON images(dataset_id, status);
CREATE INDEX idx_annotations_image_status ON annotations(image_id, status);
CREATE INDEX idx_annotations_annotator ON annotations(annotator_id);
CREATE INDEX idx_project_members_lookup ON project_members(project_id, user_id);
CREATE INDEX idx_pre_annotation_tasks_status ON pre_annotation_tasks(status);
```

### 方式二：使用 Prisma（后续自动同步）

使用 Prisma 时，只需执行：

```bash
npx prisma db push
```

Prisma 会自动根据 `prisma/schema.prisma` 创建表结构。

---

## 第六步：配置身份认证

### 6.1 启用邮箱认证

1. 点击左侧菜单 **"Authentication"** → **"Providers"**
2. 确保 **"Email"** 已启用
3. 可选：配置邮件模板

### 6.2 配置邮件设置（开发环境）

开发阶段可以禁用邮箱验证：

1. 点击 **"Authentication"** → **"Settings"**
2. 找到 **"Email"** 部分
3. 关闭 **"Enable email confirmations"**（开发时方便测试）

⚠️ **生产环境必须开启邮箱验证！**

### 6.3 配置 URL 设置

1. 在 **"Authentication"** → **"URL Configuration"**
2. 设置 **"Site URL"**: `http://localhost:3000`
3. 添加 **"Redirect URLs"**:
   - `http://localhost:3000/**`
   - `http://localhost:3000/auth/callback`

---

## 第七步：配置存储桶

### 7.1 创建存储桶

1. 点击左侧菜单 **"Storage"**
2. 点击 **"New bucket"**
3. 创建以下存储桶：

#### images 存储桶
- **Name**: `images`
- **Public bucket**: ✅ 勾选（允许公开访问图像）
- **File size limit**: `52428800` (50MB)
- **Allowed MIME types**: `image/*`

#### models 存储桶
- **Name**: `models`
- **Public bucket**: ❌ 不勾选（私有存储）
- **File size limit**: `524288000` (500MB)
- **Allowed MIME types**: `*` (允许所有类型)

### 7.2 配置存储策略

#### images 存储桶策略

1. 点击 `images` 存储桶
2. 点击 **"Policies"** 标签
3. 点击 **"New Policy"**

**允许所有人查看图像：**
```sql
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');
```

**允许认证用户上传图像：**
```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);
```

**允许用户更新自己的图像：**
```sql
CREATE POLICY "Allow users to update own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**允许用户删除自己的图像：**
```sql
CREATE POLICY "Allow users to delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 第八步：配置 Row Level Security (RLS)

RLS 确保用户只能访问自己的数据。

### 8.1 启用 RLS

在 SQL 编辑器中执行：

```sql
-- 启用所有表的 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_annotation_tasks ENABLE ROW LEVEL SECURITY;
```

### 8.2 创建 RLS 策略

```sql
-- 用户表：用户只能查看自己的信息
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- 项目表：用户可以查看自己是成员的项目
CREATE POLICY "Users can view their projects"
ON projects FOR SELECT
USING (
  auth.uid() = owner_id 
  OR EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_members.project_id = projects.id 
    AND project_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update projects"
ON projects FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete projects"
ON projects FOR DELETE
USING (auth.uid() = owner_id);

-- 项目成员表
CREATE POLICY "Users can view project members"
ON project_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_members.project_id 
    AND (projects.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = projects.id 
      AND pm.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Project owners can add members"
ON project_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_members.project_id 
    AND projects.owner_id = auth.uid()
  )
);

-- 数据集表
CREATE POLICY "Users can view datasets in their projects"
ON datasets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = datasets.project_id 
    AND (projects.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_members.project_id = projects.id 
      AND project_members.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Users can create datasets in their projects"
ON datasets FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = datasets.project_id 
    AND (projects.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_members.project_id = projects.id 
      AND project_members.user_id = auth.uid() 
      AND project_members.role IN ('owner', 'admin')
    ))
  )
);
```

---

## 第九步：验证配置

### 9.1 检查表结构

1. 点击左侧菜单 **"Table Editor"**
2. 应该能看到所有创建的表

### 9.2 检查存储桶

1. 点击左侧菜单 **"Storage"**
2. 应该能看到 `images` 和 `models` 存储桶

### 9.3 测试 API 连接

创建一个测试文件：

```typescript
// test-supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.from('users').select('count')
  console.log('Test result:', { data, error })
}

test()
```

---

## 常见问题

### Q1: 忘记数据库密码怎么办？

在 **Settings** → **Database** 中可以重置密码。

### Q2: 如何重置项目？

在 **Settings** → **General** 底部有 **"Delete Project"** 选项。

### Q3: 免费计划有限制吗？

免费计划限制：
- 数据库：500MB
- 存储：1GB
- 带宽：5GB/月
- 并发连接：2 个

对于开发和小规模使用足够。

### Q4: 如何获取帮助？

- Supabase 文档：https://supabase.com/docs
- Discord 社区：https://discord.supabase.com
- GitHub 讨论：https://github.com/supabase/supabase/discussions

---

## 下一步

配置完成后，你可以：

1. ✅ 开始执行实施计划
2. ✅ 在新会话中运行：`执行实施计划`

祝你开发顺利！🚀
