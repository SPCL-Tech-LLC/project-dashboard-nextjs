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
    const days = parseInt(url.searchParams.get('days') || '7')

    const since = new Date()
    since.setDate(since.getDate() - days)

    const supabase = getServiceRoleClient()

    const { data, error } = await supabase
      .from('dashboard_active_work')
      .select('*')
      .not('ended_at', 'is', null)
      .gte('started_at', since.toISOString())
      .order('ended_at', { ascending: false })
      .limit(100)

    if (error) throw error

    const history = (data || []).map((row) => {
      const startedAt = new Date(row.started_at)
      const endedAt = new Date(row.ended_at)
      const durationMs = endedAt.getTime() - startedAt.getTime()
      const durationMinutes = Math.max(0, Math.round(durationMs / (1000 * 60)))

      return {
        id: row.id,
        user_name: row.user_name || getUserName(row.user_id),
        project_name: row.project_name,
        task_description: row.notes || row.task_description || null,
        duration_minutes: durationMinutes,
        ended_at_iso: row.ended_at,
        user_type: row.user_type || 'human',
      }
    })

    return NextResponse.json(history)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
