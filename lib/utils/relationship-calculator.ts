import { Member, Relationship } from '@/lib/types';

interface RelationshipPath {
    path: string[];
    distance: number;
    type: 'blood' | 'marriage' | 'mixed';
}

/**
 * Calculate the family relationship between two members
 * @param fromMemberId - The reference member (current user)
 * @param toMemberId - The target member
 * @param members - All family members
 * @param relationships - All family relationships
 * @returns The relationship label in French
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

    // Build adjacency map for graph traversal
    const graph = buildFamilyGraph(relationships);

    // Find shortest path using BFS
    const path = findShortestPath(fromMemberId, toMemberId, graph, relationships);

    if (!path) {
        return 'Aucun lien de parenté direct';
    }

    // Determine relationship based on path
    return determineRelationship(path, fromMemberId, toMemberId, relationships, members);
}

function buildFamilyGraph(relationships: Relationship[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();

    relationships.forEach(rel => {
        if (!graph.has(rel.member_id)) {
            graph.set(rel.member_id, new Set());
        }
        if (!graph.has(rel.related_member_id)) {
            graph.set(rel.related_member_id, new Set());
        }

        graph.get(rel.member_id)!.add(rel.related_member_id);

        // For parent-child, add bidirectional
        if (rel.relationship_type === 'parent' || rel.relationship_type === 'child') {
            graph.get(rel.related_member_id)!.add(rel.member_id);
        }

        // For spouse, add bidirectional
        if (rel.relationship_type === 'spouse') {
            graph.get(rel.related_member_id)!.add(rel.member_id);
        }
    });

    return graph;
}

function findShortestPath(
    start: string,
    end: string,
    graph: Map<string, Set<string>>,
    relationships: Relationship[]
): string[] | null {
    const queue: { node: string; path: string[] }[] = [{ node: start, path: [start] }];
    const visited = new Set<string>([start]);

    while (queue.length > 0) {
        const { node, path } = queue.shift()!;

        if (node === end) {
            return path;
        }

        const neighbors = graph.get(node) || new Set();
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push({ node: neighbor, path: [...path, neighbor] });
            }
        }
    }

    return null;
}

function determineRelationship(
    path: string[],
    fromId: string,
    toId: string,
    relationships: Relationship[],
    members: Member[]
): string {
    if (path.length === 2) {
        // Direct relationship
        return getDirectRelationship(fromId, toId, relationships, members);
    }

    // Analyze the path to determine complex relationships
    const pathTypes: ('parent' | 'child' | 'spouse')[] = [];

    for (let i = 0; i < path.length - 1; i++) {
        const relType = getRelationshipType(path[i], path[i + 1], relationships);
        if (relType) {
            pathTypes.push(relType);
        }
    }

    return analyzeComplexRelationship(pathTypes, members.find(m => m.id === toId));
}

function getDirectRelationship(
    fromId: string,
    toId: string,
    relationships: Relationship[],
    members: Member[]
): string {
    const targetMember = members.find(m => m.id === toId);

    // Check if it's a parent
    const isParent = relationships.some(
        r => r.member_id === fromId && r.related_member_id === toId && r.relationship_type === 'parent'
    );
    if (isParent) return 'Parent';

    // Check if it's a child
    const isChild = relationships.some(
        r => r.member_id === fromId && r.related_member_id === toId && r.relationship_type === 'child'
    );
    if (isChild) return 'Enfant';

    // Check if it's a spouse
    const isSpouse = relationships.some(
        r => r.member_id === fromId && r.related_member_id === toId && r.relationship_type === 'spouse'
    );
    if (isSpouse) return 'Conjoint(e)';

    return 'Membre de la famille';
}

function getRelationshipType(
    fromId: string,
    toId: string,
    relationships: Relationship[]
): 'parent' | 'child' | 'spouse' | null {
    // Check parent relationship
    const parentRel = relationships.find(
        r => r.member_id === fromId && r.related_member_id === toId && r.relationship_type === 'parent'
    );
    if (parentRel) return 'parent';

    // Check child relationship
    const childRel = relationships.find(
        r => r.member_id === fromId && r.related_member_id === toId && r.relationship_type === 'child'
    );
    if (childRel) return 'child';

    // Check reverse parent (means current is child)
    const reverseParent = relationships.find(
        r => r.member_id === toId && r.related_member_id === fromId && r.relationship_type === 'parent'
    );
    if (reverseParent) return 'child';

    // Check reverse child (means current is parent)
    const reverseChild = relationships.find(
        r => r.member_id === toId && r.related_member_id === fromId && r.relationship_type === 'child'
    );
    if (reverseChild) return 'parent';

    // Check spouse
    const spouseRel = relationships.find(
        r => ((r.member_id === fromId && r.related_member_id === toId) ||
            (r.member_id === toId && r.related_member_id === fromId)) &&
            r.relationship_type === 'spouse'
    );
    if (spouseRel) return 'spouse';

    return null;
}

function analyzeComplexRelationship(
    pathTypes: ('parent' | 'child' | 'spouse')[],
    targetMember?: Member
): string {
    // Remove spouse connections for cleaner analysis
    const bloodPath = pathTypes.filter(t => t !== 'spouse');
    const hasSpouse = pathTypes.includes('spouse');

    // Count generations up (child) and down (parent)
    let generationsUp = 0;
    let generationsDown = 0;
    let isSibling = false;

    for (let i = 0; i < bloodPath.length; i++) {
        if (bloodPath[i] === 'child') {
            generationsUp++;
        } else if (bloodPath[i] === 'parent') {
            generationsDown++;
        }
    }

    // Check for siblings (up then down by same amount)
    if (generationsUp > 0 && generationsDown > 0 && generationsUp === generationsDown) {
        isSibling = true;
        generationsUp = 0;
        generationsDown = 0;
    }

    // Determine relationship
    if (isSibling) {
        if (hasSpouse) {
            return 'Beau-frère/Belle-sœur';
        }
        if (pathTypes.length === 2) {
            return 'Frère/Sœur';
        }
        if (pathTypes.length === 4) {
            return 'Cousin(e)';
        }
        if (pathTypes.length === 6) {
            return 'Cousin(e) au 2ème degré';
        }
        return 'Cousin(e) éloigné(e)';
    }

    // Ascending relationships (ancestors)
    if (generationsUp > 0 && generationsDown === 0) {
        if (hasSpouse) {
            if (generationsUp === 1) return 'Beau-parent';
            if (generationsUp === 2) return 'Grand-parent par alliance';
            return 'Ancêtre par alliance';
        }

        if (generationsUp === 1) return 'Parent';
        if (generationsUp === 2) return 'Grand-parent';
        if (generationsUp === 3) return 'Arrière-grand-parent';
        if (generationsUp === 4) return 'Arrière-arrière-grand-parent';
        return `Ancêtre (${generationsUp}ème génération)`;
    }

    // Descending relationships (descendants)
    if (generationsDown > 0 && generationsUp === 0) {
        if (hasSpouse) {
            if (generationsDown === 1) return 'Gendre/Belle-fille';
            if (generationsDown === 2) return 'Petit-enfant par alliance';
            return 'Descendant par alliance';
        }

        if (generationsDown === 1) return 'Enfant';
        if (generationsDown === 2) return 'Petit-enfant';
        if (generationsDown === 3) return 'Arrière-petit-enfant';
        if (generationsDown === 4) return 'Arrière-arrière-petit-enfant';
        return `Descendant (${generationsDown}ème génération)`;
    }

    // Collateral relationships (aunts, uncles, nieces, nephews)
    if (generationsUp === 1 && generationsDown === 1) {
        if (hasSpouse) return 'Oncle/Tante par alliance';
        return 'Oncle/Tante';
    }

    if (generationsUp === 2 && generationsDown === 1) {
        return 'Grand-oncle/Grand-tante';
    }

    if (generationsDown === 1 && generationsUp === 1) {
        if (hasSpouse) return 'Neveu/Nièce par alliance';
        return 'Neveu/Nièce';
    }

    if (generationsDown === 2 && generationsUp === 1) {
        return 'Petit-neveu/Petite-nièce';
    }

    // Default for complex relationships
    return 'Membre de la famille étendue';
}
