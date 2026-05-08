import { hierarchy, tree } from 'd3-hierarchy';
import * as d3 from 'd3-hierarchy';
import { Member, Relationship, TreeNode, TreeEdge } from '../types';

export interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalGap: number;
  verticalGap: number;
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  nodeWidth: 200,
  nodeHeight: 120,
  horizontalGap: 80,
  verticalGap: 180,
};

interface HierarchyNode {
  id: string;
  member: Member;
  children?: HierarchyNode[];
}

/**
 * MAIN LAYOUT FUNCTION
 */
export function calculateTreeLayout(
  members: Member[],
  relationships: Relationship[],
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): { nodes: TreeNode[]; edges: TreeEdge[] } {

  if (!members.length) {
    return { nodes: [], edges: [] };
  }

  /**
   * ---------------------------------------------------
   * STEP 1 — BUILD LOOKUP MAPS
   * ---------------------------------------------------
   */

  const memberMap = new Map<string, Member>();
  members.forEach(m => memberMap.set(m.id, m));

  const childrenMap = new Map<string, string[]>();
  const parentsMap = new Map<string, string[]>();
  const spousesMap = new Map<string, string[]>();

  members.forEach(member => {
    childrenMap.set(member.id, []);
    parentsMap.set(member.id, []);
    spousesMap.set(member.id, []);
  });

  relationships.forEach(rel => {

    if (rel.relationship_type === 'parent') {

      childrenMap.get(rel.member_id)?.push(rel.related_member_id);

      parentsMap.get(rel.related_member_id)?.push(rel.member_id);
    }

    if (rel.relationship_type === 'spouse') {

      spousesMap.get(rel.member_id)?.push(rel.related_member_id);

      spousesMap.get(rel.related_member_id)?.push(rel.member_id);
    }
  });

  /**
   * ---------------------------------------------------
   * STEP 2 — FIND ROOTS
   * Members without parents
   * ---------------------------------------------------
   */

  const roots = members.filter(member => {
    return (parentsMap.get(member.id)?.length || 0) === 0;
  });

  /**
   * ---------------------------------------------------
   * STEP 3 — BUILD HIERARCHY TREE
   * ---------------------------------------------------
   */

  const visited = new Set<string>();

  function buildHierarchy(memberId: string): HierarchyNode {

    visited.add(memberId);

    const member = memberMap.get(memberId)!;

    const childrenIds = childrenMap.get(memberId) || [];

    const children: HierarchyNode[] = [];

    childrenIds.forEach(childId => {

      if (!visited.has(childId)) {

        children.push(buildHierarchy(childId));
      }
    });

    return {
      id: memberId,
      member,
      children,
    };
  }

  /**
   * Multiple roots support
   */
  const forest: HierarchyNode = {
    id: 'virtual-root',
    member: {} as Member,
    children: roots.map(root => buildHierarchy(root.id)),
  };

  /**
   * ---------------------------------------------------
   * STEP 4 — D3 TREE LAYOUT
   * ---------------------------------------------------
   */

  const root = hierarchy(forest);

  const layout = tree<HierarchyNode>()
    .nodeSize([
      config.nodeWidth + config.horizontalGap,
      config.nodeHeight + config.verticalGap,
    ]);

  layout(root);

  /**
   * ---------------------------------------------------
   * STEP 5 — CREATE NODES
   * ---------------------------------------------------
   */

  const nodes: TreeNode[] = [];

  root.descendants().forEach((node: d3.HierarchyNode<HierarchyNode>) => {

    if (node.data.id === 'virtual-root') return;

    nodes.push({
      id: node.data.id,
      type: 'member',
      data: node.data.member,
      position: {
        x: node.x ?? 0,
        y: node.y ?? 0,
      },
    });
  });

  /**
   * ---------------------------------------------------
   * STEP 6 — CREATE EDGES
   * ---------------------------------------------------
   */

  const edges: TreeEdge[] = [];

  const processedSpouses = new Set<string>();

  relationships.forEach(rel => {

    /**
     * Parent → Child
     */
    if (rel.relationship_type === 'parent') {

      edges.push({
        id: `parent-${rel.member_id}-${rel.related_member_id}`,
        source: rel.member_id,
        target: rel.related_member_id,
        type: 'parent',
      });
    }

    /**
     * Spouses
     */
    if (rel.relationship_type === 'spouse') {

      const pairKey = [rel.member_id, rel.related_member_id]
        .sort()
        .join('-');

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

  /**
   * ---------------------------------------------------
   * STEP 7 — CENTER TREE
   * ---------------------------------------------------
   */

  centerTree(nodes);

  return { nodes, edges };
}

/**
 * CENTER TREE AROUND X = 0
 */
function centerTree(nodes: TreeNode[]) {

  if (!nodes.length) return;

  const minX = Math.min(...nodes.map(n => n.position.x));
  const maxX = Math.max(...nodes.map(n => n.position.x));

  const offset = -(minX + maxX) / 2;

  nodes.forEach(node => {
    node.position.x += offset;
  });
}