# 数据标注工具设计文档

**日期：** 2026-02-13  
**项目：** 数据标注工具 (Data Annotation Tool)

---

## 1. 项目概述

### 1.1 目标

开发一个企业级的图像数据标注工具，支持多种标注模式、团队协作、质量控制，以及模型预标注功能。

### 1.2 核心特性

- 多种标注模式：图像分类、目标检测（矩形框）、语义分割、关键点标注
- Web 应用 + 桌面应用（Electron）
- 大规模团队协作：权限管理、任务分配、质量控制、审核流程
- 多格式数据导入导出：COCO、Pascal VOC、YOLO、LabelMe、VGG 等 + 自定义格式
- 模型预标注：支持自托管模型和云服务 API

---

## 2. 技术架构

### 2.1 技术栈

**前端：**
- Next.js 14+ (App Router)
- React 18
- TypeScript
- shadcn/ui
- Tailwind CSS
- Fabric.js 或 Konva.js（标注画布）

**后端：**
- Supabase
  - PostgreSQL（数据库）
  - Auth（认证）
  - Storage（文件存储）
  - Realtime（实时协作）
  - Edge Functions（无服务器函数）

**桌面打包：**
- Electron

### 2.2 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        用户界面层                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  标注工作台   │  │  项目管理     │  │  用户管理     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  数据管理     │  │  质量审核     │  │  统计报表     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  模型管理     │  │  预标注任务   │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│   Supabase       │  │   模型服务    │  │  模型存储     │
│   后端服务        │  │   (推理)      │  │  (权重文件)   │
│  ┌────────────┐  │  │              │  │              │
│  │ PostgreSQL │  │  │ Python API   │  │ Supabase     │
│  │ Auth       │  │  │ 或 云服务     │  │ Storage      │
│  │ Storage    │  │  │              │  │              │
│  │ Realtime   │  │  │              │  │              │
│  └────────────┘  │  │              │  │              │
└──────────────────┘  └──────────────┘  └──────────────┘
```

---

## 3. 数据库设计

### 3.1 核心数据表

#### users 表
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### projects 表
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id),
  status VARCHAR DEFAULT 'active', -- active/archived/completed
  annotation_types JSONB, -- 支持的标注类型配置
  labels JSONB, -- 标签定义
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### project_members 表
```sql
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role VARCHAR NOT NULL, -- owner/admin/annotator/reviewer
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
```

#### datasets 表
```sql
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  total_images INT DEFAULT 0,
  annotated_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### images 表
```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  filename VARCHAR NOT NULL,
  storage_path TEXT NOT NULL, -- Supabase Storage 路径
  width INT,
  height INT,
  status VARCHAR DEFAULT 'pending', -- pending/annotating/annotated/reviewed
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

#### annotations 表
```sql
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  annotator_id UUID REFERENCES users(id),
  annotation_type VARCHAR NOT NULL, -- classification/bbox/segmentation/keypoint
  data JSONB NOT NULL, -- 标注数据（坐标、标签等）
  is_pre_annotated BOOLEAN DEFAULT FALSE, -- 是否为预标注
  model_id UUID, -- 如果是预标注，记录使用的模型
  status VARCHAR DEFAULT 'draft', -- draft/submitted/rejected/approved
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### reviews 表
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annotation_id UUID REFERENCES annotations(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id),
  status VARCHAR NOT NULL, -- approved/rejected
  comment TEXT,
  reviewed_at TIMESTAMP DEFAULT NOW()
);
```

#### models 表
```sql
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL, -- classification/detection/segmentation/keypoint
  provider VARCHAR NOT NULL, -- local_http/local_grpc/cloud_api/custom
  config JSONB, -- 模型配置（endpoint、参数、输入输出映射等）
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### pre_annotation_tasks 表
```sql
CREATE TABLE pre_annotation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  model_id UUID REFERENCES models(id),
  status VARCHAR DEFAULT 'pending', -- pending/processing/completed/failed
  total_images INT,
  processed_images INT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### 3.2 索引设计

```sql
-- 图像查询优化
CREATE INDEX idx_images_dataset_status ON images(dataset_id, status);

-- 标注查询优化
CREATE INDEX idx_annotations_image_status ON annotations(image_id, status);
CREATE INDEX idx_annotations_annotator ON annotations(annotator_id);

-- 权限验证优化
CREATE INDEX idx_project_members_lookup ON project_members(project_id, user_id);

-- 预标注任务查询优化
CREATE INDEX idx_pre_annotation_tasks_status ON pre_annotation_tasks(status);
```

---

## 4. 核心功能模块

### 4.1 标注工作台

**界面布局：**
- 左侧：图像缩略图列表，支持过滤和搜索
- 中央：标注画布区域，支持缩放、平移
- 右侧：标签面板、属性面板

**标注工具：**
1. 选择工具：选中、移动、删除标注对象
2. 矩形框工具：目标检测标注，拖拽绘制
3. 多边形工具：语义分割标注，点选绘制
4. 画笔工具：实例分割标注，自由绘制
5. 关键点工具：姿态标注，点击添加关键点

**交互功能：**
- 快捷键支持：数字键快速切换标签
- 自动保存：每 5 秒自动保存草稿
- 撤销/重做：Ctrl+Z / Ctrl+Y
- 预标注编辑：接受/修改/拒绝预标注结果

### 4.2 项目管理

**项目创建流程：**
1. 创建项目（名称、描述）
2. 配置标注类型
3. 定义标签（名称、颜色、属性）
4. 邀请团队成员
5. 导入数据集

**项目配置项：**
- 标注类型：选择支持的标注模式
- 标签定义：支持层级标签、属性标签
- 成员权限：owner、admin、annotator、reviewer
- 质量设置：审核流程、一致性要求

### 4.3 数据导入导出

**导入格式：**
- COCO JSON
- Pascal VOC XML
- YOLO TXT
- LabelMe JSON
- VGG JSON
- 自定义格式（通过配置文件映射）

**导出功能：**
- 选择导出范围：全部/已审核/指定数据集
- 选择导出格式
- 数据集划分：训练集/验证集/测试集
- 导出文件下载（ZIP 压缩包）

### 4.4 任务分配与协作

**任务分配方式：**
1. 手动分配：管理员指定任务给标注员
2. 自动分配：按标注员负载均衡分配
3. 领取模式：标注员主动领取待标注图像

**实时协作：**
- Supabase Realtime 监听状态变更
- 显示当前谁在标注哪张图像
- 避免重复标注冲突

**进度跟踪：**
- 项目总进度
- 个人完成数量
- 标注质量统计

### 4.5 质量控制

**审核流程：**
```
标注员提交 → 审核员审核 → 通过/驳回
                ↓ 驳回
            标注员修改 → 重新提交
```

**质量指标：**
- 标注一致性：多人标注同一图像的一致性评分
- 审核通过率：标注员提交审核的通过率
- 标注速度：单位时间完成数量

**质量控制机制：**
- 交叉验证：随机分配部分图像给多人标注
- 黄金标准：内置标准答案集，定期测试标注员
- 异常检测：自动检测异常标注

### 4.6 模型预标注

**工作流程：**
```
选择模型 → 选择数据集 → 启动预标注 → 查看结果 → 人工修正
```

**支持的模型类型：**

**自托管模型：**
- 目标检测：YOLOv8/v9、Faster R-CNN
- 图像分类：ResNet、EfficientNet
- 语义分割：U-Net、DeepLabV3+
- 关键点检测：HRNet、OpenPose

**云服务 API：**
- 百度 AI
- 腾讯 AI
- 阿里云
- OpenAI GPT-4 Vision

**自定义模型支持：**
- 支持用户自定义训练的模型
- 灵活的推理接口配置（HTTP/gRPC）
- 自定义输入输出格式映射
- 标签映射配置

---

## 5. 数据流设计

### 5.1 图像导入与预标注流程

```
上传图像 → 存储(Storage) → 创建记录(pending)
                ↓
          是否启用预标注？
           ↓ 是        ↓ 否
    调用模型推理    进入标注队列
           ↓
    保存预标注结果
           ↓
    状态改为"待审核"
           ↓
       进入标注队列
```

### 5.2 标注工作流程

```
打开图像 → 有预标注？
           ↓ 是        ↓ 否
      显示预标注    开始标注
           ↓            ↓
      编辑/修改      创建标注
           ↓            ↓
       实时保存草稿
           ↓
       提交标注
           ↓
       状态改为"待审核"
           ↓
       通知审核员
```

### 5.3 审核流程

```
审核员查看待审核 → 审核标注 → 通过？
                              ↓ 是    ↓ 否
                         状态改为    状态改为"需修改"
                         "已审核"        ↓
                            ↓       通知标注员修改
                        通知标注员
```

### 5.4 数据导出流程

```
选择导出条件 → 查询数据 → 数据集划分
                            ↓
                       格式转换
                            ↓
                       打包 ZIP
                            ↓
                       生成下载链接
```

---

## 6. 错误处理与测试

### 6.1 错误处理策略

**前端错误处理：**
- 错误边界捕获 React 错误
- API 调用错误自动提示
- 网络错误自动重试

**后端错误处理：**
- 统一错误响应格式
- 错误分类（验证错误、认证错误、服务器错误）
- 详细日志记录

**关键场景错误处理：**
- 图像上传失败：重试机制、格式验证
- 标注保存失败：自动重试、冲突提示
- 模型推理失败：超时配置、降级处理

### 6.2 测试策略

**测试金字塔：**
- 单元测试（60%）：工具函数、组件、数据验证
- 集成测试（30%）：API、数据库操作
- E2E 测试（10%）：关键用户流程

**测试覆盖：**
- 标注工具测试
- API 集成测试
- 数据导入导出测试
- 协作功能测试
- 性能测试

---

## 7. 非功能性需求

### 7.1 性能要求

- 页面加载时间：< 3 秒
- API 响应时间：< 500ms（P95）
- 标注画布流畅度：60fps
- 支持大图像：最大 10000x10000 像素

### 7.2 安全要求

- 用户认证：Supabase Auth
- 权限控制：基于角色的访问控制（RBAC）
- 数据加密：传输加密（HTTPS）、存储加密
- SQL 注入防护：使用参数化查询

### 7.3 可扩展性

- 水平扩展：Supabase 支持自动扩展
- 存储扩展：Supabase Storage 支持无限存储
- 模型扩展：支持动态注册新模型

---

## 8. 实施计划

详见实施计划文档。
