import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ErrorCode } from '@/lib/types';
import { cookies } from 'next/headers';

// DELETE /api/members/[id]/gallery/[photoId] - Delete a gallery photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id: memberId, photoId } = await params;
    const supabase = await createClient();

    // Get current user session
    const cookieStore = await cookies();
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
    const userType = session.userType;
    const userMemberId = session.memberId;

    // Fetch the photo to check ownership
    const { data: photo, error: fetchError } = await supabase
      .from('member_gallery_photos')
      .select('*')
      .eq('id', photoId)
      .eq('member_id', memberId)
      .single();

    if (fetchError || !photo) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Photo non trouvée',
          },
        },
        { status: 404 }
      );
    }

    // Check permissions:
    // - Admin can delete any photo in any gallery
    // - User can delete any photo in their own gallery (member_id === userMemberId)
    const canDelete = 
      userType === 'admin' || 
      memberId === userMemberId;

    if (!canDelete) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Vous ne pouvez supprimer que les photos de votre propre galerie',
          },
        },
        { status: 403 }
      );
    }

    // Delete photo from storage
    try {
      const photoPath = photo.photo_url.split('/').slice(-3).join('/'); // Extract path from URL
      await supabase.storage
        .from('member-photos')
        .remove([photoPath]);
    } catch (error) {
      console.warn('Failed to delete photo from storage:', error);
    }

    // Delete photo record from database
    const { error: deleteError } = await supabase
      .from('member_gallery_photos')
      .delete()
      .eq('id', photoId);

    if (deleteError) {
      console.error('Error deleting gallery photo:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Erreur lors de la suppression de la photo',
            details: deleteError.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Photo supprimée avec succès' },
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/members/[id]/gallery/[photoId]:', error);
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
