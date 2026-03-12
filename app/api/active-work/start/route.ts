import { NextResponse, NextRequest } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = getServiceRoleClient()

    const { data, error } = await supabase
      .from('dashboard_active_work')
      .insert({
        user_id: body.user_id,
        project_name: body.project_name,
        notes: body.task_description || null,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to start work session' },
      { status: 500 }
    )
  }
}
