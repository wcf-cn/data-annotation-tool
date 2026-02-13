# 部署指南

本项目使用 Vercel 进行部署。

## 快速部署

### 1. 准备工作

- GitHub 账号
- Vercel 账号（可使用 GitHub 登录）
- Supabase 项目已配置

### 2. 部署步骤

1. 访问 https://vercel.com
2. 使用 GitHub 登录
3. 导入 GitHub 仓库
4. 配置 Root Directory: `.worktrees/data-annotation-tool`
5. 添加环境变量
6. 点击 Deploy

### 3. 环境变量

在 Vercel 项目设置中添加以下环境变量：

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
DATABASE_URL=<your-database-url>
```

### 4. Supabase 配置

在 Supabase Dashboard 中配置：

**Authentication → URL Configuration:**
- Site URL: `https://your-project.vercel.app`
- Redirect URLs: 添加你的 Vercel 域名

### 5. 自动部署

Vercel 已配置自动部署：
- 推送到 main 分支 → 自动部署
- Pull Request → 预览环境

## 详细文档

查看完整部署计划：
```
docs/plans/2026-02-13-vercel-deployment.md
```

## 故障排查

如有问题，请查看：
- Vercel 部署日志
- Vercel 函数日志
- 浏览器控制台错误
