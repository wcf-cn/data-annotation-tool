#!/bin/bash

# Git项目初始化脚本

echo "🚀 开始初始化Git项目..."

# 初始化git仓库
git init
echo "✅ Git仓库已初始化"

# 添加所有文件
git add .
echo "✅ 文件已添加到暂存区"

# 创建初始提交
git commit -m "Initial commit: 数据标注工具项目初始化"
echo "✅ 初始提交已完成"

# 提示创建GitHub仓库
echo ""
echo "📋 接下来请执行以下步骤："
echo ""
echo "1. 在GitHub上创建一个新仓库 (https://github.com/new)"
echo "   - 仓库名称建议: data-annotation-tool"
echo "   - 不要初始化README、.gitignore或license"
echo ""
echo "2. 添加远程仓库并推送："
echo "   git remote add origin https://github.com/YOUR_USERNAME/data-annotation-tool.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "💡 或者使用GitHub CLI (如果已安装gh):"
echo "   gh repo create data-annotation-tool --public --source=. --push"
echo ""
