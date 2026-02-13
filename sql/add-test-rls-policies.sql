-- 添加测试用的 RLS 策略
-- 这些策略允许 anon 用户（未认证）访问表，仅用于开发测试

-- Projects 表策略
CREATE POLICY "Allow anon read access for testing"
ON projects FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon insert for testing"
ON projects FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon update for testing"
ON projects FOR UPDATE
TO anon
USING (true);

-- Datasets 表策略
CREATE POLICY "Allow anon read access for testing"
ON datasets FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon insert for testing"
ON datasets FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon update for testing"
ON datasets FOR UPDATE
TO anon
USING (true);

-- Project Members 表策略
CREATE POLICY "Allow anon read access for testing"
ON project_members FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon insert for testing"
ON project_members FOR INSERT
TO anon
WITH CHECK (true);

-- Users 表策略（如果还没有）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users'
    AND policyname = 'Allow anon read access for testing'
  ) THEN
    CREATE POLICY "Allow anon read access for testing"
    ON users FOR SELECT
    TO anon
    USING (true);
  END IF;
END $$;

-- Images 表策略（如果还没有）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'images'
    AND policyname = 'Allow anon read access for testing'
  ) THEN
    CREATE POLICY "Allow anon read access for testing"
    ON images FOR SELECT
    TO anon
    USING (true);
  END IF;
END $$;

-- Annotations 表策略（如果还没有）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'annotations'
    AND policyname = 'Allow anon read access for testing'
  ) THEN
    CREATE POLICY "Allow anon read access for testing"
    ON annotations FOR SELECT
    TO anon
    USING (true);
  END IF;
END $$;

-- Reviews 表策略
CREATE POLICY "Allow anon read access for testing"
ON reviews FOR SELECT
TO anon
USING (true);

-- Models 表策略
CREATE POLICY "Allow anon read access for testing"
ON models FOR SELECT
TO anon
USING (true);

-- Pre Annotation Tasks 表策略
CREATE POLICY "Allow anon read access for testing"
ON pre_annotation_tasks FOR SELECT
TO anon
USING (true);
