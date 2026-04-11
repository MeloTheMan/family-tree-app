import { Member, Relationship } from '@/lib/types';

export interface NuclearFamily {
  parents: Member[];
  siblings: Member[];
}

/**
 * Calculate the nuclear family (parents and siblings) of a member
 * @param memberId - The member whose nuclear family to calculate
 * @param allMembers - All family members
 * @param allRelationships - All family relationships
 * @returns Object containing parents and siblings arrays
 */
export function calculateNuclearFamily(
  memberId: string,
  allMembers: Member[],
  allRelationships: Relationship[]
): NuclearFamily {
  const parents: Member[] = [];
  const siblings: Member[] = [];

  // Find parents
  const parentRelationships = allRelationships.filter(
    r => r.member_id === memberId && r.relationship_type === 'child'
  );

  parentRelationships.forEach(rel => {
    const parent = allMembers.find(m => m.id === rel.related_member_id);
    if (parent) {
      parents.push(parent);
    }
  });

  // Find siblings (people who share at least one parent)
  if (parents.length > 0) {
    const parentIds = parents.map(p => p.id);

    // Find all children of these parents
    const siblingRelationships = allRelationships.filter(
      r => parentIds.includes(r.member_id) && r.relationship_type === 'parent'
    );

    const siblingIds = new Set<string>();
    siblingRelationships.forEach(rel => {
      if (rel.related_member_id !== memberId) {
        siblingIds.add(rel.related_member_id);
      }
    });

    siblingIds.forEach(siblingId => {
      const sibling = allMembers.find(m => m.id === siblingId);
      if (sibling) {
        siblings.push(sibling);
      }
    });
  }

  return { parents, siblings };
}
