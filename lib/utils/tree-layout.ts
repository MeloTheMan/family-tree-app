import { Member, Relationship, TreeNode, TreeEdge } from '../types';

/**
 * Configuration for tree layout positioning
 */
export interface LayoutConfig {
  nodeWidth: number;      // Width of each node in pixels
  nodeHeight: number;     // Height of each node in pixels
  horizontalGap: number;  // Horizontal spacing between nodes
  verticalGap: number;    // Vertical spacing between generations
}

/**
 * Default layout configuration
 */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  nodeWidth: 200,
  nodeHeight: 120,
  horizontalGap: 100,
  verticalGap: 150,
};

/**
 * Calculate the tree layout for family members and their relationships
 * Uses a layered layout approach (Sugiyama-style) with generation-based positioning
 * 
 * @param members - Array of all family members
 * @param relationships - Array of all relationships between members
 * @param config - Optional layout configuration (uses defaults if not provided)
 * @returns Object containing positioned nodes and edges for visualization
 */
export function calculateTreeLayout(
  members: Member[],
  relationships: Relationship[],
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): { nodes: TreeNode[]; edges: TreeEdge[] } {
  if (members.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Step 1: Build relationship maps for efficient lookup
  const relationshipMap = buildRelationshipMap(members, relationships);

  // Step 2: Assign levels (generations) to each member
  const memberLevels = assignLevels(members, relationshipMap);

  // Step 3: Group members by level and calculate horizontal positions
  const positionedMembers = calculateHorizontalPositions(
    members,
    memberLevels,
    relationshipMap,
    config
  );

  // Step 4: Create TreeNode objects with calculated positions
  const nodes = createTreeNodes(members, positionedMembers);

  // Step 5: Create TreeEdge objects for relationships
  const edges = createTreeEdges(relationships);

  return { nodes, edges };
}

/**
 * Build maps of relationships for efficient lookup
 */
function buildRelationshipMap(
  members: Member[],
  relationships: Relationship[]
): Map<string, { parents: string[]; children: string[]; spouses: string[] }> {
  const map = new Map<string, { parents: string[]; children: string[]; spouses: string[] }>();

  // Initialize map for all members
  members.forEach(member => {
    map.set(member.id, { parents: [], children: [], spouses: [] });
  });

  // Populate relationships
  relationships.forEach(rel => {
    const memberData = map.get(rel.member_id);
    if (!memberData) return;

    if (rel.relationship_type === 'parent') {
      memberData.children.push(rel.related_member_id);
    } else if (rel.relationship_type === 'child') {
      memberData.parents.push(rel.related_member_id);
    } else if (rel.relationship_type === 'spouse') {
      memberData.spouses.push(rel.related_member_id);
    }
  });

  return map;
}

/**
 * Assign generation levels to members using breadth-first traversal
 * Root members (those without parents) start at level 0
 */
function assignLevels(
  members: Member[],
  relationshipMap: Map<string, { parents: string[]; children: string[]; spouses: string[] }>
): Map<string, number> {
  const levels = new Map<string, number>();
  const visited = new Set<string>();

  // Find root members (those without parents)
  const roots = members.filter(member => {
    const rels = relationshipMap.get(member.id);
    return !rels || rels.parents.length === 0;
  });

  // If no roots found (circular relationships), use all members as potential roots
  const startingMembers = roots.length > 0 ? roots : members;

  // Breadth-first search to assign levels
  const queue: Array<{ id: string; level: number }> = startingMembers.map(m => ({
    id: m.id,
    level: 0,
  }));

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;

    // Skip if already visited with a lower or equal level
    if (visited.has(id)) {
      const existingLevel = levels.get(id) || 0;
      if (level <= existingLevel) continue;
    }

    visited.add(id);
    levels.set(id, level);

    // Add children to queue with next level
    const rels = relationshipMap.get(id);
    if (rels) {
      rels.children.forEach(childId => {
        queue.push({ id: childId, level: level + 1 });
      });

      // Spouses should be at the same level
      rels.spouses.forEach(spouseId => {
        if (!visited.has(spouseId)) {
          queue.push({ id: spouseId, level });
        }
      });
    }
  }

  // Assign level 0 to any unvisited members
  members.forEach(member => {
    if (!levels.has(member.id)) {
      levels.set(member.id, 0);
    }
  });

  return levels;
}

/**
 * Calculate horizontal positions for members within their generation level
 * Groups spouses together and spaces members evenly
 */
function calculateHorizontalPositions(
  members: Member[],
  levels: Map<string, number>,
  relationshipMap: Map<string, { parents: string[]; children: string[]; spouses: string[] }>,
  config: LayoutConfig
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  // Group members by level
  const membersByLevel = new Map<number, Member[]>();
  members.forEach(member => {
    const level = levels.get(member.id) || 0;
    if (!membersByLevel.has(level)) {
      membersByLevel.set(level, []);
    }
    membersByLevel.get(level)!.push(member);
  });

  // Process each level
  membersByLevel.forEach((levelMembers, level) => {
    // Group spouses together
    const processed = new Set<string>();
    const groups: string[][] = [];

    levelMembers.forEach(member => {
      if (processed.has(member.id)) return;

      const group = [member.id];
      processed.add(member.id);

      // Add spouses to the same group
      const rels = relationshipMap.get(member.id);
      if (rels) {
        rels.spouses.forEach(spouseId => {
          const spouseLevel = levels.get(spouseId);
          if (spouseLevel === level && !processed.has(spouseId)) {
            group.push(spouseId);
            processed.add(spouseId);
          }
        });
      }

      groups.push(group);
    });

    // Calculate positions for this level
    const y = level * (config.nodeHeight + config.verticalGap);
    const totalWidth = groups.length * config.nodeWidth + (groups.length - 1) * config.horizontalGap;
    let currentX = -totalWidth / 2;

    groups.forEach(group => {
      // For spouse groups, position them side by side
      const groupWidth = group.length * config.nodeWidth + (group.length - 1) * (config.horizontalGap / 2);
      let groupX = currentX;

      group.forEach((memberId, index) => {
        const x = groupX + index * (config.nodeWidth + config.horizontalGap / 2);
        positions.set(memberId, { x, y });
      });

      currentX += groupWidth + config.horizontalGap;
    });
  });

  return positions;
}

/**
 * Create TreeNode objects from positioned members
 */
function createTreeNodes(
  members: Member[],
  positions: Map<string, { x: number; y: number }>
): TreeNode[] {
  const nodes: TreeNode[] = [];
  const memberMap = new Map(members.map(m => [m.id, m]));

  positions.forEach((position, memberId) => {
    const member = memberMap.get(memberId);
    if (member) {
      nodes.push({
        id: memberId,
        data: member,
        position,
        type: 'member',
      });
    }
  });

  return nodes;
}

/**
 * Create TreeEdge objects for visualizing relationships
 */
function createTreeEdges(
  relationships: Relationship[]
): TreeEdge[] {
  const edges: TreeEdge[] = [];
  const processedSpouses = new Set<string>();

  relationships.forEach(rel => {
    // Create edges for parent-child relationships (only from parent to child)
    if (rel.relationship_type === 'parent') {
      edges.push({
        id: `${rel.member_id}-${rel.related_member_id}`,
        source: rel.member_id,
        target: rel.related_member_id,
        type: 'parent',
      });
    }

    // Create edges for spouse relationships (only once per pair)
    if (rel.relationship_type === 'spouse') {
      const pairKey = [rel.member_id, rel.related_member_id].sort().join('-');
      if (!processedSpouses.has(pairKey)) {
        processedSpouses.add(pairKey);
        edges.push({
          id: `spouse-${pairKey}`,
          source: rel.member_id,
          target: rel.related_member_id,
          type: 'spouse',
        });
      }
    }
  });

  return edges;
}
