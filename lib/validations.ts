import { z } from 'zod';

// Member validation schema
export const MemberSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  last_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  birth_date: z.string().nullable().optional(),
  birthplace: z.string().max(255).nullable().optional(),
  work: z.string().max(255).nullable().optional(),
  photo: z.instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, "La photo doit faire moins de 5MB")
    .refine(
      file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      "Format accepté: JPEG, PNG, WEBP"
    )
    .optional()
});

// Member creation schema (for API)
export const MemberCreateSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  last_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  birth_date: z.string().nullable().optional(),
  birthplace: z.string().max(255).nullable().optional(),
  work: z.string().max(255).nullable().optional(),
});

// Member update schema (for API)
export const MemberUpdateSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").optional(),
  last_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères").optional(),
  birth_date: z.string().nullable().optional(),
  birthplace: z.string().max(255).nullable().optional(),
  work: z.string().max(255).nullable().optional(),
});

// Relationship validation schema
export const RelationshipSchema = z.object({
  member_id: z.string().uuid("L'identifiant du membre doit être un UUID valide"),
  related_member_id: z.string().uuid("L'identifiant du membre lié doit être un UUID valide"),
  relationship_type: z.enum(['parent', 'child', 'spouse'], {
    message: "Le type de relation doit être 'parent', 'child' ou 'spouse'"
  })
}).refine(
  data => data.member_id !== data.related_member_id,
  {
    message: "Un membre ne peut pas être en relation avec lui-même",
    path: ['related_member_id']
  }
);

// Type exports for use in components
export type MemberFormInput = z.infer<typeof MemberSchema>;
export type MemberCreateInput = z.infer<typeof MemberCreateSchema>;
export type MemberUpdateInput = z.infer<typeof MemberUpdateSchema>;
export type RelationshipFormInput = z.infer<typeof RelationshipSchema>;
