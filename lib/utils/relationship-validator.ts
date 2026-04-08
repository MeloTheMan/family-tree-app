import { Relationship } from '../types';

/**
 * Get the reciprocal relationship type for a given relationship
 * @param relationshipType - The original relationship type
 * @returns The reciprocal relationship type
 */
export function getReciprocalRelationshipType(
  relationshipType: 'parent' | 'child' | 'spouse'
): 'parent' | 'child' | 'spouse' {
  switch (relationshipType) {
    case 'parent':
      return 'child';
    case 'child':
      return 'parent';
    case 'spouse':
      return 'spouse';
  }
}

/**
 * Check if adding a parent-child relationship would create a cycle in the family tree
 * A cycle occurs when a member would become their own ancestor
 * 
 * @param memberId - The ID of the member who will have a new parent
 * @param parentId - The ID of the proposed parent
 * @param existingRelationships - All existing relationships in the database
 * @returns true if adding this relationship would create a cycle, false otherwise
 */
export function wouldCreateCycle(
  memberId: string,
  parentId: string,
  existingRelationships: Relationship[]
): boolean {
  // If member and parent are the same, it's a cycle
  if (memberId === parentId) {
    return true;
  }

  // Check if the proposed parent is already a descendant of the member
  // This would create a cycle: member -> ... -> parentId -> member
  const visited = new Set<string>();

  /**
   * Depth-first search to check if targetId is a descendant of currentId
   */
  function hasDescendant(currentId: string, targetId: string): boolean {
    // If we found the target, there's a path from current to target
    if (currentId === targetId) {
      return true;
    }

    // Avoid infinite loops by tracking visited nodes
    if (visited.has(currentId)) {
      return false;
    }

    visited.add(currentId);

    // Find all children of the current member
    const children = existingRelationships
      .filter(r => r.member_id === currentId && r.relationship_type === 'parent')
      .map(r => r.related_member_id);

    // Recursively check if any child has the target as a descendant
    return children.some(childId => hasDescendant(childId, targetId));
  }

  // Check if parentId is a descendant of memberId
  // If true, making parentId a parent of memberId would create a cycle
  return hasDescendant(memberId, parentId);
}

/**
 * Validate a relationship before creation
 * @param memberId - The first member ID
 * @param relatedMemberId - The second member ID
 * @param relationshipType - The type of relationship
 * @param existingRelationships - All existing relationships
 * @returns An error message if validation fails, null if valid
 */
export function validateRelationship(
  memberId: string,
  relatedMemberId: string,
  relationshipType: 'parent' | 'child' | 'spouse',
  existingRelationships: Relationship[]
): string | null {
  // Check if members are the same
  if (memberId === relatedMemberId) {
    return 'Un membre ne peut pas être en relation avec lui-même';
  }

  // Check for cycles in parent-child relationships
  if (relationshipType === 'parent') {
    if (wouldCreateCycle(relatedMemberId, memberId, existingRelationships)) {
      return 'Cette relation créerait une incohérence logique (cycle dans l\'arbre généalogique)';
    }
  } else if (relationshipType === 'child') {
    if (wouldCreateCycle(memberId, relatedMemberId, existingRelationships)) {
      return 'Cette relation créerait une incohérence logique (cycle dans l\'arbre généalogique)';
    }
  }

  return null;
}
