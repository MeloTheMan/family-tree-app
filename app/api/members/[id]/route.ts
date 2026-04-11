import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MemberUpdateSchema } from '@/lib/validations';
import { ErrorCode } from '@/lib/types';
import type { Member } from '@/lib/types';

// PUT /api/members/[id] - Update an existing member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { cookies } = await import('next/headers');

    // Validate member ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'ID de membre invalide',
          },
        },
        { status: 400 }
      );
    }

    // Check if member exists
    const { data: existingMember, error: fetchError } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingMember) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Membre non trouvé',
          },
        },
        { status: 404 }
      );
    }

    // Check permissions: admin can edit anyone, users can only edit themselves
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (sessionCookie) {
      const session = JSON.parse(sessionCookie.value);
      const isAdmin = session.userType === 'admin';
      const isOwnProfile = session.memberId === id;

      if (!isAdmin && !isOwnProfile) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCode.VALIDATION_ERROR,
              message: 'Vous ne pouvez modifier que vos propres informations',
            },
          },
          { status: 403 }
        );
      }
    }

    const formData = await request.formData();

    // Extract form fields
    const name = formData.get('name') as string | null;
    const last_name = formData.get('last_name') as string | null;
    const birth_date = formData.get('birth_date') as string | null;
    const birthplace = formData.get('birthplace') as string | null;
    const work = formData.get('work') as string | null;
    const photo = formData.get('photo') as File | null;

    // Build update object with only provided fields
    const updateData: Partial<{
      name: string;
      last_name: string;
      birth_date: string | null;
      birthplace: string | null;
      work: string | null;
      photo_url: string | null;
    }> = {};

    if (name !== null) {
      updateData.name = name;
    }
    if (last_name !== null) {
      updateData.last_name = last_name;
    }
    if (birth_date !== null) {
      updateData.birth_date = birth_date || null;
    }
    if (birthplace !== null) {
      updateData.birthplace = birthplace || null;
    }
    if (work !== null) {
      updateData.work = work || null;
    }

    // Validate update data
    const validationResult = MemberUpdateSchema.safeParse(updateData);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Données invalides',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Handle photo upload if new photo provided
    if (photo && photo.size > 0) {
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

      // Upload new photo
      const fileExt = photo.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('member-photos')
        .upload(filePath, photo, {
          contentType: photo.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading photo:', uploadError);
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

      // Get public URL for the uploaded photo
      const { data: urlData } = supabase.storage
        .from('member-photos')
        .getPublicUrl(filePath);

      updateData.photo_url = urlData.publicUrl;

      // Optionally delete old photo if it exists
      if (existingMember.photo_url) {
        try {
          const oldPhotoPath = existingMember.photo_url.split('/').pop();
          if (oldPhotoPath) {
            await supabase.storage
              .from('member-photos')
              .remove([oldPhotoPath]);
          }
        } catch (error) {
          // Log but don't fail the update if old photo deletion fails
          console.warn('Failed to delete old photo:', error);
        }
      }
    }

    // Update member record
    const { data: updatedMember, error: updateError } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating member:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Erreur lors de la mise à jour du membre',
            details: updateError.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedMember as Member,
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/members/[id]:', error);
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


// DELETE /api/members/[id] - Delete a member and all related data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Validate member ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'ID de membre invalide',
          },
        },
        { status: 400 }
      );
    }

    // Check if member exists
    const { data: existingMember, error: fetchError } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingMember) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Membre non trouvé',
          },
        },
        { status: 404 }
      );
    }

    // Delete member's photo from storage if exists
    if (existingMember.photo_url) {
      try {
        const photoPath = existingMember.photo_url.split('/').pop();
        if (photoPath) {
          await supabase.storage
            .from('member-photos')
            .remove([photoPath]);
        }
      } catch (error) {
        console.warn('Failed to delete member photo:', error);
      }
    }

    // Delete member's gallery photos from storage
    try {
      const { data: galleryPhotos } = await supabase
        .from('member_gallery_photos')
        .select('photo_url')
        .eq('member_id', id);

      if (galleryPhotos && galleryPhotos.length > 0) {
        const photoPaths = galleryPhotos
          .map(photo => photo.photo_url.split('/').pop())
          .filter(Boolean) as string[];
        
        if (photoPaths.length > 0) {
          await supabase.storage
            .from('gallery-photos')
            .remove(photoPaths);
        }
      }
    } catch (error) {
      console.warn('Failed to delete gallery photos:', error);
    }

    // Delete relationships (CASCADE should handle this, but we do it explicitly)
    await supabase
      .from('relationships')
      .delete()
      .or(`member_id.eq.${id},related_member_id.eq.${id}`);

    // Delete position data
    await supabase
      .from('member_positions')
      .delete()
      .eq('member_id', id);

    // Delete gallery photos records
    await supabase
      .from('member_gallery_photos')
      .delete()
      .eq('member_id', id);

    // Delete user account if exists
    await supabase
      .from('users')
      .delete()
      .eq('member_id', id);

    // Finally, delete the member
    const { error: deleteError } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting member:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Erreur lors de la suppression du membre',
            details: deleteError.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Membre supprimé avec succès',
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/members/[id]:', error);
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
