import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ErrorCode } from '@/lib/types';

// DELETE /api/members/delete-all - Delete all members and related data (admin only)
export async function DELETE() {
  try {
    const supabase = await createClient();
    const { cookies } = await import('next/headers');

    // Check if user is admin
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
    if (session.userType !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Accès refusé. Seuls les administrateurs peuvent supprimer tout l\'arbre.',
          },
        },
        { status: 403 }
      );
    }

    // Get all members to delete their photos
    const { data: members } = await supabase
      .from('members')
      .select('photo_url');

    // Delete all member photos from storage
    if (members && members.length > 0) {
      const photoPaths = members
        .filter(m => m.photo_url)
        .map(m => m.photo_url!.split('/').pop())
        .filter(Boolean) as string[];
      
      if (photoPaths.length > 0) {
        try {
          await supabase.storage
            .from('member-photos')
            .remove(photoPaths);
        } catch (error) {
          console.warn('Failed to delete some member photos:', error);
        }
      }
    }

    // Get all gallery photos to delete them
    const { data: galleryPhotos } = await supabase
      .from('member_gallery_photos')
      .select('photo_url');

    // Delete all gallery photos from storage
    if (galleryPhotos && galleryPhotos.length > 0) {
      const galleryPaths = galleryPhotos
        .map(photo => photo.photo_url.split('/').pop())
        .filter(Boolean) as string[];
      
      if (galleryPaths.length > 0) {
        try {
          await supabase.storage
            .from('gallery-photos')
            .remove(galleryPaths);
        } catch (error) {
          console.warn('Failed to delete some gallery photos:', error);
        }
      }
    }

    // Delete all gallery photos records
    await supabase
      .from('member_gallery_photos')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    // Delete all relationships
    await supabase
      .from('relationships')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    // Delete all positions
    await supabase
      .from('member_positions')
      .delete()
      .neq('member_id', '00000000-0000-0000-0000-000000000000'); // Delete all

    // Delete all user accounts (except admin)
    await supabase
      .from('users')
      .delete()
      .neq('user_type', 'admin');

    // Finally, delete all members
    const { error: deleteError } = await supabase
      .from('members')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('Error deleting all members:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Erreur lors de la suppression de l\'arbre',
            details: deleteError.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Arbre généalogique supprimé avec succès',
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/members/delete-all:', error);
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
