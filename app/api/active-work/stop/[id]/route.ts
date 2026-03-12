import { NextResponse, NextRequest } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServiceRoleClient()

    const { data, error } = await supabase
      .from('dashboard_active_work')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to stop work session' },
      { status: 500 }
    )
  }
}
