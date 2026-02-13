-- 创建项目表
CREATE TABLE IF NOT EXISTS projects (
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

-- 创建数据集表
CREATE TABLE IF NOT EXISTS datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  total_images INT DEFAULT 0,
  annotated_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建项目成员表
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role VARCHAR NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 创建审核表（如果不存在）
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annotation_id UUID REFERENCES annotations(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id),
  status VARCHAR NOT NULL,
  comment TEXT,
  reviewed_at TIMESTAMP DEFAULT NOW()
);

-- 创建模型表
CREATE TABLE IF NOT EXISTS models (
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
CREATE TABLE IF NOT EXISTS pre_annotation_tasks (
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
CREATE INDEX IF NOT EXISTS idx_images_dataset_status ON images(dataset_id, status);
CREATE INDEX IF NOT EXISTS idx_annotations_image_status ON annotations(image_id, status);
CREATE INDEX IF NOT EXISTS idx_annotations_annotator ON annotations(annotator_id);
CREATE INDEX IF NOT EXISTS idx_project_members_lookup ON project_members(project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_pre_annotation_tasks_status ON pre_annotation_tasks(status);

-- 启用 RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_annotation_tasks ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
-- 项目表策略
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

-- 数据集表策略
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

-- 项目成员表策略
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
