import { Member, Relationship, TreeNode, TreeEdge } from '../types';

/**
 * Configuration for tree layout positioning
 */
export interface LayoutConfig {
  nodeWidth: number;      // Width of each node in pixels
  nodeHeight: number;     // Height of each node in pixels
  horizontalGap: number;  // Horizontal spacing between nodes within a group
  verticalGap: number;    // Vertical spacing between generations
  groupGap: number;       // Horizontal spacing between family groups (nuclear families)
}

/**
 * Default layout configuration
 */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  nodeWidth: 200,
  nodeHeight: 120,
  horizontalGap: 300,  // Spacing between siblings within a group
  verticalGap: 1000,    // Vertical spacing between generations
  groupGap: 2500,       // Spacing between different family groups
};

/**
 * Minimum spacing to maintain between nodes for collision detection
 */
const MIN_NODE_SPACING = 80;

/**
 * Calculate the tree layout for family members and their relationships
 * Uses a layered layout approach (Sugiyama-style) with generation-based positioning
 * 
 * @param members - Array of all family members
 * @param relationships - Array of all relationships between members
 * @param config - Optional layout configuration (uses defaults if not provided)
 * @param existingPositions - Optional existing positions to preserve manual adjustments
 * @returns Object containing positioned nodes and edges for visualization
 */
export function calculateTreeLayout(
  members: Member[],
  relationships: Relationship[],
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG,
  existingPositions?: Map<string, { x: number; y: number }>
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
 * Apply automatic layout to specific members while preserving others
 * Useful when adding new relationships
 */
export function applyAutoLayoutToNewMembers(
  members: Member[],
  relationships: Relationship[],
  existingPositions: Map<string, { x: number; y: number }>,
  newMemberIds: string[],
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): Map<string, { x: number; y: number }> {
  // Calculate full layout
  const { nodes } = calculateTreeLayout(members, relationships, config);

  // Create new positions map
  const newPositions = new Map(existingPositions);

  // Update positions only for new members and their immediate family
  const affectedIds = new Set(newMemberIds);

  // Add related members to affected set
  const relationshipMap = buildRelationshipMap(members, relationships);
  newMemberIds.forEach(id => {
    const rels = relationshipMap.get(id);
    if (rels) {
      rels.parents.forEach(pid => affectedIds.add(pid));
      rels.children.forEach(cid => affectedIds.add(cid));
      rels.spouses.forEach(sid => affectedIds.add(sid));
    }
  });

  // Apply new positions to affected members
  nodes.forEach(node => {
    if (affectedIds.has(node.id)) {
      newPositions.set(node.id, node.position);
    }
  });

  return newPositions;
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
 * Uses intelligent spacing with collision detection and automatic repositioning
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

  // Process each level with intelligent positioning
  membersByLevel.forEach((levelMembers, level) => {
    const levelPositions = calculateLevelPositions(
      levelMembers,
      level,
      relationshipMap,
      levels,
      config,
      positions
    );

    levelPositions.forEach((pos, memberId) => {
      positions.set(memberId, pos);
    });
  });

  // Resolve collisions and optimize spacing
  resolveCollisionsAndOptimize(positions, levels, config);

  return positions;
}

/**
 * Calculate positions for a single level with spouse grouping and nuclear family detection
 */
function calculateLevelPositions(
  levelMembers: Member[],
  level: number,
  relationshipMap: Map<string, { parents: string[]; children: string[]; spouses: string[] }>,
  levels: Map<string, number>,
  config: LayoutConfig,
  existingPositions: Map<string, { x: number; y: number }>
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const processed = new Set<string>();
  const y = level * (config.nodeHeight + config.verticalGap);

  // Group spouses together and identify their parent groups
  const groups: { members: string[]; parentIds: Set<string>; parentX?: number }[] = [];

  levelMembers.forEach(member => {
    if (processed.has(member.id)) return;

    const group: string[] = [member.id];
    processed.add(member.id);

    // Collect parent IDs for this group
    const parentIds = new Set<string>();
    const rels = relationshipMap.get(member.id);
    if (rels) {
      rels.parents.forEach(pid => parentIds.add(pid));

      // Add spouses to the same group
      rels.spouses.forEach(spouseId => {
        const spouseLevel = levels.get(spouseId);
        if (spouseLevel === level && !processed.has(spouseId)) {
          group.push(spouseId);
          processed.add(spouseId);

          // Add spouse's parents too
          const spouseRels = relationshipMap.get(spouseId);
          if (spouseRels) {
            spouseRels.parents.forEach(pid => parentIds.add(pid));
          }
        }
      });
    }

    // Try to position children below their parents
    let parentX: number | undefined;
    if (parentIds.size > 0) {
      const parentPositions = Array.from(parentIds)
        .map(parentId => existingPositions.get(parentId))
        .filter(pos => pos !== undefined);

      if (parentPositions.length > 0) {
        // Calculate average parent position
        const avgX = parentPositions.reduce((sum, pos) => sum + pos!.x, 0) / parentPositions.length;
        parentX = avgX;
      }
    }

    groups.push({ members: group, parentIds, parentX });
  });

  // Sort groups: those with parent positions first, then by parent X position
  groups.sort((a, b) => {
    if (a.parentX !== undefined && b.parentX === undefined) return -1;
    if (a.parentX === undefined && b.parentX !== undefined) return 1;
    if (a.parentX !== undefined && b.parentX !== undefined) {
      return a.parentX - b.parentX;
    }
    return 0;
  });

  // Position groups with intelligent spacing
  let currentX = 0;

  groups.forEach((group, groupIndex) => {
    // Calculate group width with proper spacing between siblings
    const siblingSpacing = config.horizontalGap;
    const groupWidth = group.members.length * config.nodeWidth +
      (group.members.length - 1) * siblingSpacing;

    let targetX: number;

    if (group.parentX !== undefined && groupIndex === 0) {
      // First group with parents: center under parent(s)
      targetX = group.parentX - groupWidth / 2;
      currentX = targetX;
    } else if (group.parentX !== undefined && groupIndex > 0) {
      // Subsequent groups: check if we should align under parents or continue from currentX
      const idealX = group.parentX - groupWidth / 2;
      // Use the rightmost position to avoid overlaps
      targetX = Math.max(currentX, idealX);
    } else {
      // No parents: position to the right of previous groups
      targetX = currentX;
    }

    // Position members in the group with proper spacing
    group.members.forEach((memberId, index) => {
      const x = targetX + index * (config.nodeWidth + siblingSpacing);
      positions.set(memberId, { x, y });
    });

    // Determine spacing for next group
    const hasNextGroup = groupIndex + 1 < groups.length;
    let spacingToUse = config.groupGap;

    if (hasNextGroup) {
      const nextGroup = groups[groupIndex + 1];
      // Check if groups share ALL the same parents (siblings from same parents)
      const sameParents = group.parentIds.size > 0 &&
        nextGroup.parentIds.size > 0 &&
        group.parentIds.size === nextGroup.parentIds.size &&
        Array.from(group.parentIds).every(pid => nextGroup.parentIds.has(pid));

      if (sameParents) {
        // Siblings from same parents: use larger spacing to separate their parent lines
        spacingToUse = config.horizontalGap * 1.5;
      }

      console.log(`Group ${groupIndex} to ${groupIndex + 1}: sameParents=${sameParents}, spacing=${spacingToUse}`);
    }

    currentX = targetX + groupWidth + spacingToUse;
  });

  return positions;
}

/**
 * Resolve collisions and optimize spacing across all levels
 */
function resolveCollisionsAndOptimize(
  positions: Map<string, { x: number; y: number }>,
  levels: Map<string, number>,
  config: LayoutConfig
): void {
  // Group positions by level
  const positionsByLevel = new Map<number, Array<{ id: string; pos: { x: number; y: number } }>>();

  positions.forEach((pos, id) => {
    const level = levels.get(id) || 0;
    if (!positionsByLevel.has(level)) {
      positionsByLevel.set(level, []);
    }
    positionsByLevel.get(level)!.push({ id, pos });
  });

  // Check and resolve collisions within each level
  positionsByLevel.forEach((levelNodes) => {
    // Sort by x position
    levelNodes.sort((a, b) => a.pos.x - b.pos.x);

    // Detect and resolve overlaps - use minimum spacing to avoid collisions
    for (let i = 0; i < levelNodes.length - 1; i++) {
      const current = levelNodes[i];
      const next = levelNodes[i + 1];

      // Minimum distance to avoid node overlap
      const minDistance = config.nodeWidth + MIN_NODE_SPACING;
      const actualDistance = next.pos.x - current.pos.x;

      if (actualDistance < minDistance) {
        // Push subsequent nodes to the right
        const shift = minDistance - actualDistance;
        for (let j = i + 1; j < levelNodes.length; j++) {
          const node = levelNodes[j];
          node.pos.x += shift;
          positions.set(node.id, node.pos);
        }
      }
    }
  });

  // Center the entire tree
  centerTree(positions);
}

/**
 * Center the tree around x=0
 */
function centerTree(positions: Map<string, { x: number; y: number }>): void {
  if (positions.size === 0) return;

  const xPositions = Array.from(positions.values()).map(pos => pos.x);
  const minX = Math.min(...xPositions);
  const maxX = Math.max(...xPositions);
  const centerOffset = -(minX + maxX) / 2;

  positions.forEach((pos, id) => {
    positions.set(id, { x: pos.x + centerOffset, y: pos.y });
  });
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
