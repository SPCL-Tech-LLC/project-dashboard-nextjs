import { NextResponse } from 'next/server'
import { listRepos } from '@/lib/github'
import { getServiceRoleClient } from '@/lib/supabase'

export async function GET() {
  try {
    const org = process.env.GITHUB_ORG || 'SPCL-Tech-LLC'

    const [repos, supabase] = [await listRepos(org), getServiceRoleClient()]

    // Fetch project metadata to enrich repos with Supabase/Vercel links
    const { data: projects } = await supabase
      .from('dashboard_project_metadata')
      .select('*')

    // Index projects by repo name extracted from repo_url
    const projectsByRepo = new Map<string, any>()
    for (const project of projects || []) {
      if (project.repo_url) {
        const repoName = project.repo_url.split('/').pop()?.replace('.git', '')
        if (repoName) {
          projectsByRepo.set(repoName, project)
        }
      }
    }

    return NextResponse.json({
      success: true,
      repos: repos.map((r) => {
        const meta = projectsByRepo.get(r.name)
        return {
          name: r.name,
          full_name: r.full_name,
          description: r.description,
          html_url: r.html_url,
          updated_at: r.updated_at,
          default_branch: r.default_branch,
          language: r.language,
          stargazers_count: r.stargazers_count,
          metadata: meta
            ? {
                supabase_project_url: meta.supabase_project_url || null,
                supabase_project_id: meta.supabase_project_id || null,
                vercel_project_url: meta.vercel_project_url || null,
                vercel_deployment_url: meta.vercel_deployment_url || null,
              }
            : null,
        }
      }),
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch repos' },
      { status: 500 }
    )
  }
}
