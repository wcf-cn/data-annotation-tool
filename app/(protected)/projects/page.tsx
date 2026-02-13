import { createClient } from '@/lib/supabase/server'
import { ProjectList } from '@/components/projects/ProjectList'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .or(`owner_id.eq.${user?.id}`)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage your data annotation projects</p>
        </div>
        <Link href="/projects/new">
          <Button>New Project</Button>
        </Link>
      </div>
      <ProjectList projects={projects || []} />
    </div>
  )
}
