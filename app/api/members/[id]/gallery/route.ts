import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ErrorCode } from '@/lib/types';
import type { GalleryPhoto } from '@/lib/types';
import { cookies } from 'next/headers';

// GET /api/members/[id]/gallery - Fetch all gallery photos for a member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: photos, error } = await supabase
      .from('member_gallery_photos')
      .select('*')
      .eq('member_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching gallery photos:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Erreur lors de la récupération des photos',
            details: error.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: photos as GalleryPhoto[],
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/members/[id]/gallery:', error);
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

// POST /api/members/[id]/gallery - Add a photo to member's gallery
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params;
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

    const formData = await request.formData();
    const photo = formData.get('photo') as File | null;
    const caption = formData.get('caption') as string | null;

    if (!photo || photo.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Photo requise',
          },
        },
        { status: 400 }
      );
    }

    // Validate photo
    if (photo.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'La photo doit faire moins de 5MB',
          },
        },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(photo.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Format accepté: JPEG, PNG, WEBP',
          },
        },
        { status: 400 }
      );
    }

    // Upload photo to Supabase storage
    const fileExt = photo.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `gallery/${memberId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('member-photos')
      .upload(filePath, photo, {
        contentType: photo.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading gallery photo:', uploadError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.UPLOAD_FAILED,
            message: "Erreur lors de l'upload de la photo",
            details: uploadError.message,
          },
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('member-photos')
      .getPublicUrl(filePath);

    // Insert gallery photo record
    const { data: galleryPhoto, error: insertError } = await supabase
      .from('member_gallery_photos')
      .insert({
        member_id: memberId,
        uploaded_by_user_id: userId,
        photo_url: urlData.publicUrl,
        caption: caption || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting gallery photo:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: "Erreur lors de l'ajout de la photo",
            details: insertError.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: galleryPhoto as GalleryPhoto,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/members/[id]/gallery:', error);
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
