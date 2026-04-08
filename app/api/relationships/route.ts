import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RelationshipSchema } from '@/lib/validations';
import { ErrorCode } from '@/lib/types';
import type { Relationship } from '@/lib/types';
import {
  validateRelationship,
  getReciprocalRelationshipType,
} from '@/lib/utils/relationship-validator';

// POST /api/relationships - Create a new relationship with automatic reciprocal
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate relationship data
    const validationResult = RelationshipSchema.safeParse(body);

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

    const { member_id, related_member_id, relationship_type } = validationResult.data;

    // Verify both members exist
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id')
      .in('id', [member_id, related_member_id]);

    if (membersError) {
      console.error('Error checking members:', membersError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Erreur lors de la vérification des membres',
            details: membersError.message,
          },
        },
        { status: 500 }
      );
    }

    if (!members || members.length !== 2) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Un ou plusieurs membres n\'existent pas',
          },
        },
        { status: 404 }
      );
    }

    // Fetch all existing relationships for cycle detection
    const { data: existingRelationships, error: relationshipsError } = await supabase
      .from('relationships')
      .select('*');

    if (relationshipsError) {
      console.error('Error fetching relationships:', relationshipsError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Erreur lors de la vérification des relations',
            details: relationshipsError.message,
          },
        },
        { status: 500 }
      );
    }

    // Validate relationship (check for cycles)
    const validationError = validateRelationship(
      member_id,
      related_member_id,
      relationship_type,
      existingRelationships as Relationship[]
    );

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.CYCLE_DETECTED,
            message: validationError,
          },
        },
        { status: 400 }
      );
    }

    // Get reciprocal relationship type
    const reciprocalType = getReciprocalRelationshipType(relationship_type);

    // Create both relationships in a transaction-like manner
    // First, create the primary relationship
    const { data: primaryRelationship, error: primaryError } = await supabase
      .from('relationships')
      .insert({
        member_id,
        related_member_id,
        relationship_type,
      })
      .select()
      .single();

    if (primaryError) {
      // Check for duplicate relationship
      if (primaryError.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCode.DUPLICATE,
              message: 'Cette relation existe déjà',
            },
          },
          { status: 409 }
        );
      }

      console.error('Error creating primary relationship:', primaryError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Erreur lors de la création de la relation',
            details: primaryError.message,
          },
        },
        { status: 500 }
      );
    }

    // Create the reciprocal relationship
    const { data: reciprocalRelationship, error: reciprocalError } = await supabase
      .from('relationships')
      .insert({
        member_id: related_member_id,
        related_member_id: member_id,
        relationship_type: reciprocalType,
      })
      .select()
      .single();

    if (reciprocalError) {
      // If reciprocal creation fails, we should delete the primary relationship
      // to maintain consistency
      await supabase
        .from('relationships')
        .delete()
        .eq('id', primaryRelationship.id);

      console.error('Error creating reciprocal relationship:', reciprocalError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Erreur lors de la création de la relation réciproque',
            details: reciprocalError.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          primary: primaryRelationship as Relationship,
          reciprocal: reciprocalRelationship as Relationship,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/relationships:', error);
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
