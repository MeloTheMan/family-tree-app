import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/positions - Get all member positions
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('member_positions')
      .select('*');

    if (error) {
      console.error('Error fetching positions:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch positions' } },
      { status: 500 }
    );
  }
}

// POST /api/positions - Save/update member positions
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate input
    if (!body.positions || !Array.isArray(body.positions)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid positions data' } },
        { status: 400 }
      );
    }

    // Prepare data for upsert
    const positionsData = body.positions.map((pos: any) => ({
      member_id: pos.member_id,
      position_x: pos.position_x,
      position_y: pos.position_y,
    }));

    // Upsert positions (insert or update if exists)
    const { data, error } = await supabase
      .from('member_positions')
      .upsert(positionsData, { onConflict: 'member_id' })
      .select();

    if (error) {
      console.error('Error saving positions:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to save positions' } },
      { status: 500 }
    );
  }
}
