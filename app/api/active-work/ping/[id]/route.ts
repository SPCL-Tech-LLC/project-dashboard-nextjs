import { NextResponse, NextRequest } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServiceRoleClient()

    // Verify the session exists and is still active
    const { data, error } = await supabase
      .from('dashboard_active_work')
      .select('id')
      .eq('id', id)
      .is('ended_at', null)
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to ping work session' },
      { status: 500 }
    )
  }
}
