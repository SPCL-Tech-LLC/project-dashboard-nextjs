import { NextResponse, NextRequest } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabase'

function getUserName(userId: string): string {
  if (userId.includes('@')) {
    const name = userId.split('@')[0]
    return name.charAt(0).toUpperCase() + name.slice(1)
  }
  return userId
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')

    const supabase = getServiceRoleClient()
    let query = supabase
      .from('dashboard_active_work')
      .select('*')
      .is('ended_at', null)
      .order('started_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query
    if (error) throw error

    const sessions = (data || []).map((row) => {
      const startedAt = new Date(row.started_at)
      const now = new Date()
      const elapsedHours = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60)

      return {
        id: row.id,
        project_name: row.project_name,
        task_description: row.notes || row.task_description || null,
        elapsed_hours: parseFloat(elapsedHours.toFixed(2)),
        started_at: row.started_at,
        user_id: row.user_id,
        user_name: row.user_name || getUserName(row.user_id),
        user_type: row.user_type || 'human',
      }
    })

    return NextResponse.json(sessions)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch active sessions' },
      { status: 500 }
    )
  }
}
