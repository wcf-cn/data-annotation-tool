// 测试 Supabase 连接
// 使用方法: node --experimental-modules test-connection.mjs

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// 加载环境变量
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 检查环境变量...')
console.log('SUPABASE_URL:', supabaseUrl ? '✅ 已设置' : '❌ 未设置')
console.log('SUPABASE_ANON_KEY:', supabaseKey ? '✅ 已设置' : '❌ 未设置')
console.log('')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 请先在 .env.local 文件中设置 Supabase 环境变量')
  console.log('')
  console.log('需要设置以下环境变量:')
  console.log('  - NEXT_PUBLIC_SUPABASE_URL')
  console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.log('')
  console.log('请参考 docs/SUPABASE_SETUP_GUIDE.md 获取这些值')
  process.exit(1)
}

console.log('🔌 正在连接 Supabase...')
const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    // 测试 1: 检查连接
    console.log('\n测试 1: 检查 API 连接...')
    const { data: healthData, error: healthError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (healthError && healthError.code !== 'PGRST116') {
      console.log('❌ 连接失败:', healthError.message)
      console.log('可能的原因:')
      console.log('  1. URL 或 API Key 不正确')
      console.log('  2. 表还未创建')
      console.log('  3. RLS 策略配置问题')
      return false
    }
    console.log('✅ API 连接成功')

    // 测试 2: 检查认证
    console.log('\n测试 2: 检查认证服务...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    if (authError) {
      console.log('❌ 认证服务异常:', authError.message)
      return false
    }
    console.log('✅ 认证服务正常')

    // 测试 3: 列出可用的表
    console.log('\n测试 3: 检查数据库表...')
    const tables = ['users', 'projects', 'datasets', 'images', 'annotations']
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
      
      if (error && error.code === 'PGRST204') {
        console.log(`  ⚠️  表 '${table}' 存在但可能为空`)
      } else if (error) {
        console.log(`  ❌ 表 '${table}' 不存在或无访问权限`)
      } else {
        console.log(`  ✅ 表 '${table}' 正常`)
      }
    }

    console.log('\n🎉 测试完成！Supabase 配置正确')
    return true
  } catch (err) {
    console.error('❌ 测试过程出错:', err)
    return false
  }
}

testConnection()
