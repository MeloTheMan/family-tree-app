import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');

    if (!sessionCookie) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NO_SESSION',
          message: 'Aucune session active',
        },
      }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INVALID_SESSION',
        message: 'Session invalide',
      },
    }, { status: 401 });
  }
}
