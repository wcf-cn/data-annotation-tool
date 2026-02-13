# Vercel 部署计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 将数据标注工具部署到 Vercel，使其可以在互联网上访问。

**部署平台：** Vercel（Next.js 官方推荐）

**访问地址：** `https://[project-name].vercel.app`

---

## 前置条件检查

在开始部署前，请确认：

- [ ] GitHub 账号已创建
- [ ] 代码已推送到 GitHub
- [ ] Supabase 项目配置正确
- [ ] 本地测试已通过

---

## Task 1: 准备部署配置文件

**文件：**
- 创建：`.gitignore`
- 创建：`vercel.json`
- 创建：`DEPLOYMENT.md`

**Step 1: 检查 .gitignore 文件**

确保 `.gitignore` 包含敏感文件：

```gitignore
# dependencies
node_modules
.pnp
.pnp.js

# testing
coverage

# next.js
.next/
out/

# production
build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# prisma
prisma/*.db
prisma/*.db-journal
```

**Step 2: 创建 vercel.json 配置**

```json
{
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["hnd1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

**Step 3: 创建部署文档**

创建 `DEPLOYMENT.md` 文件，记录部署步骤和环境变量配置。

**Step 4: 提交配置文件**

```bash
git add .gitignore vercel.json DEPLOYMENT.md
git commit -m "chore: add deployment configuration"
git push origin main
```

---

## Task 2: 更新 Supabase 配置

**Step 1: 添加生产环境 URL**

在 Supabase Dashboard 中：

1. 打开 https://supabase.com/dashboard
2. 选择项目
3. 点击 **Authentication → URL Configuration**
4. 添加以下配置：

```
Site URL: https://[your-project].vercel.app

Redirect URLs (添加到允许列表):
- https://[your-project].vercel.app
- https://[your-project].vercel.app/**
- https://[your-project].vercel.app/auth/callback
```

⚠️ **注意：** 先使用占位符 `[your-project]`，部署后替换为实际的 Vercel 项目名。

**Step 2: 配置邮件模板（可选）**

在 **Authentication → Email Templates** 中：
- 自定义邮件模板
- 更新邮件中的链接为生产环境 URL

---

## Task 3: 创建 Vercel 项目

**Step 1: 访问 Vercel**

1. 打开 https://vercel.com
2. 使用 GitHub 账号登录
3. 授权 Vercel 访问你的 GitHub 仓库

**Step 2: 导入项目**

1. 点击 **"Add New..." → "Project"**
2. 选择 GitHub 仓库：`data-annotation-tool`
3. 点击 **"Import"**

**Step 3: 配置项目**

**General Settings:**
- **Project Name**: `data-annotation-tool` (或你喜欢的名称)
- **Framework Preset**: Next.js (自动检测)
- **Root Directory**: `.worktrees/data-annotation-tool` ⚠️ 重要！

**Build & Development Settings:**
- **Build Command**: `next build` (默认)
- **Output Directory**: `.next` (默认)
- **Install Command**: `npm install` (默认)

**Environment Variables (添加以下变量):**

```
NEXT_PUBLIC_SUPABASE_URL=https://ylkpslcqdyyenwhvtegr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsa3BzbGNxZHl5ZW53aHZ0ZWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NzMxOTgsImV4cCI6MjA4NjU0OTE5OH0.2ufNyHEFm_FGBVzZv3bSzhhH9mY2085CVM1lTQPNHKM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsa3BzbGNxZHl5ZW53aHZ0ZWdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk3MzE5OCwiZXhwIjoyMDg2NTQ5MTk4fQ.VDXalWGcJoFDQXMlyVZVETHtVNzT8fnDUripsqzcG8o
DATABASE_URL=postgresql://postgres:8643240wcf!@db.ylkpslcqdyyenwhvtegr.supabase.co:5432/postgres
```

⚠️ **重要：** 这些是敏感信息，请确保正确复制。

**Step 4: 开始部署**

1. 点击 **"Deploy"**
2. 等待构建完成（约 2-5 分钟）
3. 看到 🎉 庆祝动画表示部署成功

---

## Task 4: 验证部署

**Step 1: 获取部署 URL**

部署完成后，Vercel 会显示：
```
https://data-annotation-tool.vercel.app
```

或类似的 URL。

**Step 2: 测试功能**

访问部署的 URL，测试：

1. **首页访问**
   - 打开 `https://[your-project].vercel.app`
   - 应该显示首页或跳转到登录页面

2. **用户注册**
   - 访问 `/signup`
   - 注册新用户
   - 检查是否成功

3. **用户登录**
   - 访问 `/login`
   - 使用注册的用户登录
   - 检查是否成功跳转

4. **项目列表**
   - 登录后访问 `/projects`
   - 检查项目列表是否正常显示

**Step 3: 更新 Supabase 配置**

使用实际的 Vercel URL 更新 Supabase：

1. 在 Supabase Dashboard 中更新 Site URL 和 Redirect URLs
2. 将 `[your-project]` 替换为实际的 Vercel 项目名

**Step 4: 检查日志**

如果有问题，检查：
- Vercel 部署日志
- Vercel 函数日志（Functions 标签）
- 浏览器控制台错误

---

## Task 5: 配置自定义域名（可选）

如果你有自己的域名，可以配置：

**Step 1: 添加域名**

1. 在 Vercel 项目中，点击 **Settings → Domains**
2. 输入你的域名（如 `annotation.yourdomain.com`）
3. 点击 **Add**

**Step 2: 配置 DNS**

根据 Vercel 提示，在你的域名服务商处配置 DNS：

```
类型: CNAME
名称: annotation
值: cname.vercel-dns.com
```

**Step 3: 等待生效**

DNS 配置通常需要几分钟到几小时生效。

**Step 4: 更新 Supabase**

在 Supabase 中更新 Site URL 为你的自定义域名。

---

## Task 6: 配置自动部署

Vercel 会自动配置 CI/CD：

- ✅ 推送到 `main` 分支 → 自动部署到生产环境
- ✅ 创建 Pull Request → 自动创建预览环境
- ✅ 合并 PR → 自动更新生产环境

**测试自动部署：**

```bash
# 修改一个文件
git add .
git commit -m "test: auto deployment"
git push origin main
```

Vercel 会在 1-2 分钟内自动部署更新。

---

## 故障排查

### 问题 1: 构建失败

**可能原因：**
- 依赖安装失败
- 环境变量未配置
- TypeScript 类型错误

**解决方案：**
1. 检查 Vercel 构建日志
2. 确认所有环境变量已添加
3. 在本地运行 `npm run build` 测试

### 问题 2: 认证失败

**可能原因：**
- Supabase URL 配置错误
- Redirect URL 未添加

**解决方案：**
1. 检查环境变量
2. 更新 Supabase 的 Redirect URLs

### 问题 3: 数据库连接失败

**可能原因：**
- DATABASE_URL 错误
- IP 白名单限制

**解决方案：**
1. 检查 DATABASE_URL 环境变量
2. Supabase 默认允许所有 IP，无需额外配置

### 问题 4: 404 错误

**可能原因：**
- Root Directory 配置错误

**解决方案：**
1. 在 Vercel Settings 中确认 Root Directory 为 `.worktrees/data-annotation-tool`

---

## 部署检查清单

部署完成后，确认以下事项：

- [ ] 应用可以正常访问
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] 项目列表显示正常
- [ ] Supabase URL 配置已更新
- [ ] 环境变量配置正确
- [ ] HTTPS 正常工作
- [ ] 自动部署已配置

---

## 下一步

部署成功后：

1. **分享 URL** - 团队成员可以访问
2. **继续开发** - 推送代码自动部署
3. **监控日志** - Vercel Analytics 和 Logs
4. **配置域名** - 使用自定义域名（可选）
5. **性能优化** - 图片优化、缓存策略

---

## 验收标准

部署成功的标准：

✅ 应用可以通过 Vercel URL 访问
✅ 用户认证功能正常
✅ 数据库连接正常
✅ 页面加载速度合理
✅ HTTPS 正常工作
✅ 自动部署已配置

**完成以上任务即表示部署成功！** 🎉
