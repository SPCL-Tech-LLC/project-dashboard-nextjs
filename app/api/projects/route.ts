import { NextResponse, NextRequest } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = getServiceRoleClient()
    
    const { data, error } = await supabase
      .from('dashboard_project_metadata')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ projects: data || [] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = getServiceRoleClient()

    const { data, error } = await supabase
      .from('dashboard_project_metadata')
      .insert({
        project_name: body.project_name,
        repo_url: body.repo_url || null,
        status: body.status || 'active',
        tags: body.tags || [],
        notes: body.notes || null,
        last_worked_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ project: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    )
  }
}
