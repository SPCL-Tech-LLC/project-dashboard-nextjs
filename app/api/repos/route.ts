import { NextResponse } from 'next/server'
import { listRepos } from '@/lib/github'

export async function GET() {
  try {
    const org = process.env.GITHUB_ORG || 'SPCL-Tech-LLC'
    const repos = await listRepos(org)
    
    return NextResponse.json({
      repos: repos.map(r => ({
        name: r.name,
        full_name: r.full_name,
        description: r.description,
        html_url: r.html_url,
        updated_at: r.updated_at,
        language: r.language,
        stargazers_count: r.stargazers_count,
      }))
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch repos' },
      { status: 500 }
    )
  }
}
