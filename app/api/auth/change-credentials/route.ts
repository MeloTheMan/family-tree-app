import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ErrorCode } from '@/lib/types';
import { cookies } from 'next/headers';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    
    // Check if user is authenticated
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Non authentifié',
          },
        },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);
    const userId = session.userId;

    const body = await request.json();
    const { currentPassword, newUsername, newPassword } = body;

    // Validate input
    if (!currentPassword || !newUsername || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Tous les champs sont requis',
          },
        },
        { status: 400 }
      );
    }

    if (newUsername.length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères',
          },
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Le mot de passe doit contenir au moins 6 caractères',
          },
        },
        { status: 400 }
      );
    }

    // Get current user
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Utilisateur non trouvé',
          },
        },
        { status: 404 }
      );
    }

    // Verify current password
    if (currentPassword !== user.password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Mot de passe actuel incorrect',
          },
        },
        { status: 401 }
      );
    }

    // Check if new username is already taken by another user
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', newUsername)
      .neq('id', userId)
      .single();

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DUPLICATE,
            message: 'Ce nom d\'utilisateur est déjà utilisé',
          },
        },
        { status: 400 }
      );
    }

    // Update user credentials
    const { error: updateError } = await supabase
      .from('users')
      .update({
        username: newUsername,
        password: newPassword,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating credentials:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Erreur lors de la modification des identifiants',
            details: updateError.message,
          },
        },
        { status: 500 }
      );
    }

    // Clear session cookie to force re-login
    cookieStore.delete('session');

    return NextResponse.json({
      success: true,
      data: { message: 'Identifiants modifiés avec succès' },
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/auth/change-credentials:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: 'Erreur inattendue',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
