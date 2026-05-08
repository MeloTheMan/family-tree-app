import { Member, Relationship } from '@/lib/types';

type RelType = 'parent' | 'child' | 'spouse';

interface PathNode {
  id: string;
  path: string[];
  relPath: RelType[];
}

/**
 * ============================================================
 * SAFE COMPATIBILITY VERSION
 * ============================================================
 *
 * This version:
 * - keeps your current DB structure
 * - supports parent + child + spouse
 * - fixes relationship inconsistencies
 * - fixes uncle/nephew bugs
 * - fixes cousin detection
 * - fixes spouse shortcuts
 * - keeps your existing architecture
 *
 * ============================================================
 */

export function calculateRelationship(
  fromMemberId: string,
  toMemberId: string,
  members: Member[],
  relationships: Relationship[]
): string {

  if (fromMemberId === toMemberId) {
    return 'Vous';
  }

  /**
   * Weighted BFS
   */
  const result = findBestRelationshipPath(
    fromMemberId,
    toMemberId,
    relationships
  );

  if (!result) {
    return 'Aucun lien de parenté direct';
  }

  return analyzeRelationshipPath(result.relPath);
}

/**
 * ============================================================
 * FIND BEST PATH
 * ============================================================
 *
 * We avoid weird spouse shortcuts
 *
 * ============================================================
 */

function findBestRelationshipPath(
  start: string,
  end: string,
  relationships: Relationship[]
): PathNode | null {

  const queue: PathNode[] = [{
    id: start,
    path: [start],
    relPath: [],
  }];

  const visited = new Map<string, number>();

  while (queue.length > 0) {

    const current = queue.shift()!;

    if (current.id === end) {
      return current;
    }

    /**
     * Path weight
     * spouse is penalized
     */
    const weight =
      current.relPath.filter(r => r === 'spouse').length * 3 +
      current.relPath.length;

    const existingWeight = visited.get(current.id);

    if (
      existingWeight !== undefined &&
      existingWeight <= weight
    ) {
      continue;
    }

    visited.set(current.id, weight);

    /**
     * Explore neighbors
     */
    const neighbors = getNeighbors(current.id, relationships);

    for (const neighbor of neighbors) {

      if (!current.path.includes(neighbor.id)) {

        queue.push({
          id: neighbor.id,
          path: [...current.path, neighbor.id],
          relPath: [...current.relPath, neighbor.type],
        });
      }
    }
  }

  return null;
}

/**
 * ============================================================
 * GET NEIGHBORS
 * ============================================================
 */

function getNeighbors(
  memberId: string,
  relationships: Relationship[]
): { id: string; type: RelType }[] {

  const neighbors: { id: string; type: RelType }[] = [];

  relationships.forEach(rel => {

    /**
     * Parent relation
     *
     * A parent B
     *
     * From A:
     *   -> B = parent
     *
     * From B:
     *   -> A = child
     */
    if (rel.relationship_type === 'parent') {

      if (rel.member_id === memberId) {

        neighbors.push({
          id: rel.related_member_id,
          type: 'parent',
        });
      }

      if (rel.related_member_id === memberId) {

        neighbors.push({
          id: rel.member_id,
          type: 'child',
        });
      }
    }

    /**
     * Child relation
     *
     * A child B
     *
     * Means:
     * A is child of B
     */
    if (rel.relationship_type === 'child') {

      if (rel.member_id === memberId) {

        neighbors.push({
          id: rel.related_member_id,
          type: 'child',
        });
      }

      if (rel.related_member_id === memberId) {

        neighbors.push({
          id: rel.member_id,
          type: 'parent',
        });
      }
    }

    /**
     * Spouse
     */
    if (rel.relationship_type === 'spouse') {

      if (rel.member_id === memberId) {

        neighbors.push({
          id: rel.related_member_id,
          type: 'spouse',
        });
      }

      if (rel.related_member_id === memberId) {

        neighbors.push({
          id: rel.member_id,
          type: 'spouse',
        });
      }
    }
  });

  return neighbors;
}

/**
 * ============================================================
 * ANALYZE RELATIONSHIP
 * ============================================================
 */

function analyzeRelationshipPath(
  relPath: RelType[]
): string {

  /**
   * Remove spouse temporarily
   */
  const bloodPath = relPath.filter(r => r !== 'spouse');

  const hasSpouse = relPath.includes('spouse');


  /**
 * Pure spouse relationship
 */
if (
  relPath.length === 1 &&
  relPath[0] === 'spouse'
) {
  return 'Conjoint(e)';
}

  /**
   * Compact pattern
   */
  const pattern = bloodPath.join('-');

  /**
   * ========================================================
   * DIRECT RELATIONS
   * ========================================================
   */

  if (pattern === 'parent') {
    return hasSpouse
      ? 'Gendre / Belle-fille'
      : 'Enfant';
  }

  if (pattern === 'child') {
    return hasSpouse
      ? 'Beau-parent'
      : 'Parent';
  }

  /**
   * ========================================================
   * GRANDPARENTS
   * ========================================================
   */

  if (pattern === 'child-child') {
    return hasSpouse
      ? 'Grand-parent par alliance'
      : 'Grand-parent';
  }

  if (pattern === 'parent-parent') {
    return hasSpouse
      ? 'Petit-enfant par alliance'
      : 'Petit-enfant';
  }

  /**
   * ========================================================
   * SIBLINGS
   * ========================================================
   */

  if (
    pattern === 'child-parent' ||
    pattern === 'parent-child'
  ) {

    /**
     * parent-child
     * can be sibling OR uncle/nephew
     *
     * need exact distinction
     */

    if (bloodPath.length === 2) {

      return hasSpouse
        ? 'Beau-frère / Belle-sœur'
        : 'Frère / Sœur';
    }
  }

  /**
   * ========================================================
   * UNCLE / AUNT
   * ========================================================
   */

  if (
    pattern === 'child-child-parent'
  ) {

    return hasSpouse
      ? 'Oncle / Tante par alliance'
      : 'Oncle / Tante';
  }

  /**
   * ========================================================
   * NEPHEW / NIECE
   * ========================================================
   */

  if (
    pattern === 'child-parent-parent'
  ) {

    return hasSpouse
      ? 'Neveu / Nièce par alliance'
      : 'Neveu / Nièce';
  }

  /**
   * ========================================================
   * COUSINS
   * ========================================================
   */

  if (
    pattern === 'child-child-parent-parent'
  ) {

    return 'Cousin / Cousine';
  }

  /**
 * ========================================================
 * GRAND UNCLE / AUNT
 * ========================================================
 */

if (pattern === 'child-child-child-parent') {

  return hasSpouse
    ? 'Grand-oncle / Grande-tante par alliance'
    : 'Grand-oncle / Grande-tante';
}

/**
 * ========================================================
 * GRAND NEPHEW / NIECE
 * ========================================================
 */

if (pattern === 'child-parent-parent-parent') {

  return hasSpouse
    ? 'Petit-neveu / Petite-nièce par alliance'
    : 'Petit-neveu / Petite-nièce';
}

  /**
   * ========================================================
   * GREAT GRANDPARENTS
   * ========================================================
   */

  if (pattern === 'child-child-child') {
    return 'Arrière-grand-parent';
  }

  if (pattern === 'parent-parent-parent') {
    return 'Arrière-petit-enfant';
  }

  /**
   * ========================================================
   * GENERIC UNCLE / AUNT
   * ========================================================
   */

  if (pattern === 'child-child-child-parent-parent') {

  return hasSpouse
    ? 'Oncle / Tante éloigné par alliance'
    : 'Oncle / Tante éloigné';
}

/**
   * ========================================================
   * GENERIC NEPHEW / NIECE
   * ========================================================
   */

  if (pattern === 'child-child-parent-parent-parent') {

    return hasSpouse
    ? 'Neveu / Nièce éloigné par alliance'
    : 'Neveu / Nièce éloigné';
}

  /**
   * ========================================================
   * GENERIC ANCESTORS
   * ========================================================
   */

  const onlyChild =
  bloodPath.length > 0 &&
  bloodPath.every(r => r === 'child');

  if (onlyChild) {

    return `Ancêtre (${bloodPath.length} générations)`;
  }

  /**
   * ========================================================
   * GENERIC DESCENDANTS
   * ========================================================
   */

  const onlyParent =
  bloodPath.length > 0 &&
  bloodPath.every(r => r === 'parent');

  if (onlyParent) {

    return `Descendant (${bloodPath.length} générations)`;
  }

  /**
   * ========================================================
   * COMPLEX MIXED CASES
   * ========================================================
   */

  /**
   * Count ups/downs
   */
  let up = 0;
  let down = 0;

  bloodPath.forEach(r => {

    if (r === 'child') up++;
    if (r === 'parent') down++;
  });

  /**
   * Cousin fallback
   */
  if (up >= 2 && down >= 2) {

    const degree = Math.min(up, down) - 1;

    if (degree <= 1) {
      return 'Cousin / Cousine';
    }

    return `Cousin(e) au ${degree}ème degré`;
  }

  /**
   * Extended ancestor branch
   */
  if (up > down) {

    const diff = up - down;

    if (diff === 1) {
      return 'Oncle / Tante éloigné(e)';
    }

    return 'Ancêtre éloigné';
  }

  /**
   * Extended descendant branch
   */
  if (down > up) {

    const diff = down - up;

    if (diff === 1) {
      return 'Neveu / Nièce éloigné(e)';
    }

    return 'Descendant éloigné';
  }

  return 'Membre de la famille étendue';
}