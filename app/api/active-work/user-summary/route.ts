import { NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabase'

function getUserName(userId: string): string {
  if (userId.includes('@')) {
    const name = userId.split('@')[0]
    return name.charAt(0).toUpperCase() + name.slice(1)
  }
  return userId
}

export async function GET() {
  try {
    const supabase = getServiceRoleClient()

    const { data, error } = await supabase
      .from('dashboard_active_work')
      .select('*')
      .is('ended_at', null)
      .order('started_at', { ascending: false })

    if (error) throw error

    // Group by user_id
    const userMap = new Map<
      string,
      { user_id: string; user_name: string; user_type: string; projects: string[] }
    >()

    for (const row of data || []) {
      if (!userMap.has(row.user_id)) {
        userMap.set(row.user_id, {
          user_id: row.user_id,
          user_name: row.user_name || getUserName(row.user_id),
          user_type: row.user_type || 'human',
          projects: [],
        })
      }
      const user = userMap.get(row.user_id)!
      if (!user.projects.includes(row.project_name)) {
        user.projects.push(row.project_name)
      }
    }

    const summary = Array.from(userMap.values()).map((u) => ({
      ...u,
      project_count: u.projects.length,
    }))

    return NextResponse.json(summary)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user summary' },
      { status: 500 }
    )
  }
}
