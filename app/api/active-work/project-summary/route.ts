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

    if (error) throw error

    const projectMap = new Map<string, { project_name: string; workers: string[] }>()

    for (const row of data || []) {
      if (!projectMap.has(row.project_name)) {
        projectMap.set(row.project_name, { project_name: row.project_name, workers: [] })
      }
      const project = projectMap.get(row.project_name)!
      const workerName = row.user_name || getUserName(row.user_id)
      if (!project.workers.includes(workerName)) {
        project.workers.push(workerName)
      }
    }

    const summary = Array.from(projectMap.values()).map((p) => ({
      ...p,
      active_count: p.workers.length,
    }))

    return NextResponse.json(summary)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch project summary' },
      { status: 500 }
    )
  }
}
