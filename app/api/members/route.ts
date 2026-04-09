import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MemberCreateSchema } from '@/lib/validations';
import { ErrorCode } from '@/lib/types';
import type { Member, Relationship } from '@/lib/types';

// GET /api/members - Fetch all members and relationships
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all members
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: true });

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Erreur lors de la récupération des membres',
            details: membersError.message,
          },
        },
        { status: 500 }
      );
    }

    // Fetch all relationships
    const { data: relationships, error: relationshipsError } = await supabase
      .from('relationships')
      .select('*')
      .order('created_at', { ascending: true });

    if (relationshipsError) {
      console.error('Error fetching relationships:', relationshipsError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Erreur lors de la récupération des relations',
            details: relationshipsError.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        members: members as Member[],
        relationships: relationships as Relationship[],
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/members:', error);
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

// POST /api/members - Create a new member with optional photo
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const formData = await request.formData();

    // Extract form fields
    const name = formData.get('name') as string;
    const last_name = formData.get('last_name') as string;
    const birth_date = formData.get('birth_date') as string | null;
    const birthplace = formData.get('birthplace') as string | null;
    const work = formData.get('work') as string | null;
    const photo = formData.get('photo') as File | null;

    // Validate member data
    const validationResult = MemberCreateSchema.safeParse({
      name,
      last_name,
      birth_date: birth_date || null,
      birthplace: birthplace || null,
      work: work || null,
    });

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

    // Validate photo if provided
    if (photo && photo.size > 0) {
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
    }

    let photo_url: string | null = null;

    // Upload photo to Supabase storage if provided
    if (photo && photo.size > 0) {
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

      photo_url = urlData.publicUrl;
    }

    // Insert member record
    const { data: member, error: insertError } = await supabase
      .from('members')
      .insert({
        name: validationResult.data.name,
        last_name: validationResult.data.last_name,
        birth_date: validationResult.data.birth_date || null,
        birthplace: validationResult.data.birthplace || null,
        work: validationResult.data.work || null,
        photo_url,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting member:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: "Erreur lors de la création du membre",
            details: insertError.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: member as Member,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/members:', error);
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
