import { NextResponse, NextRequest } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient()
    
    const { data, error } = await supabase
      .from('dashboard_active_work')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ work: data || [] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch work' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = getServiceRoleClient()

    const { data, error } = await supabase
      .from('dashboard_active_work')
      .insert({
        user_id: body.user_id,
        project_name: body.project_name,
        session_id: body.session_id || null,
        notes: body.notes || null,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ work: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create work entry' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = getServiceRoleClient()

    const { data, error } = await supabase
      .from('dashboard_active_work')
      .update({
        ended_at: new Date().toISOString(),
        notes: body.notes,
      })
      .eq('id', body.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ work: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update work entry' },
      { status: 500 }
    )
  }
}
