import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: project } = await supabase
    .from('projects')
    .select(`
      *,
      datasets (*)
    `)
    .eq('id', id)
    .single()

  if (!project) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground mt-1">{project.description || 'No description'}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${id}/datasets/new`}>
            <Button variant="outline">Add Dataset</Button>
          </Link>
          <Link href={`/projects/${id}/annotate`}>
            <Button>Start Annotating</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
              {project.status}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Datasets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.datasets?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.datasets?.reduce((sum: number, d: { total_images: number }) => sum + (d.total_images || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{new Date(project.created_at).toLocaleDateString()}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mb-4">Datasets</h2>
      {project.datasets && project.datasets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {project.datasets.map((dataset: { id: string; name: string; description: string | null; total_images: number; annotated_count: number }) => (
            <Link key={dataset.id} href={`/projects/${id}/datasets/${dataset.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{dataset.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {dataset.description || 'No description'}
                  </p>
                  <div className="flex justify-between text-sm">
                    <span>{dataset.total_images || 0} images</span>
                    <span>{dataset.annotated_count || 0} annotated</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No datasets yet. Add your first dataset to start annotating.</p>
        </Card>
      )}
    </div>
  )
}
