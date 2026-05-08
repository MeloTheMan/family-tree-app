import { hierarchy, tree } from 'd3-hierarchy';
import * as d3 from 'd3-hierarchy';

import {
  Member,
  Relationship,
  TreeNode,
  TreeEdge,
} from '../types';

/**
 * ============================================================
 * CONFIG
 * ============================================================
 */

export interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalGap: number;
  verticalGap: number;
  spouseGap: number;
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  nodeWidth: 200,
  nodeHeight: 120,
  horizontalGap: 120,
  verticalGap: 220,
  spouseGap: 260,
};

interface HierarchyNode {
  id: string;
  member: Member;
  children?: HierarchyNode[];
}

/**
 * ============================================================
 * MAIN LAYOUT FUNCTION
 * ============================================================
 *
 * GOALS:
 *
 * ✅ Auto regroup family members
 * ✅ Auto reposition when adding people
 * ✅ Children always under parents
 * ✅ Spouses stay together
 * ✅ Siblings stay grouped
 * ✅ Automatic full relayout
 * ✅ No manual intervention
 *
 * ============================================================
 */

export function calculateTreeLayout(
  members: Member[],
  relationships: Relationship[],
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): { nodes: TreeNode[]; edges: TreeEdge[] } {

  if (!members.length) {
    return {
      nodes: [],
      edges: [],
    };
  }

  /**
   * ========================================================
   * STEP 1 — BUILD MAPS
   * ========================================================
   */

  const memberMap = new Map<string, Member>();

  members.forEach(m => {
    memberMap.set(m.id, m);
  });

  const childrenMap = new Map<string, Set<string>>();
  const parentsMap = new Map<string, Set<string>>();
  const spousesMap = new Map<string, Set<string>>();

  members.forEach(member => {

    childrenMap.set(member.id, new Set());

    parentsMap.set(member.id, new Set());

    spousesMap.set(member.id, new Set());
  });

  relationships.forEach(rel => {

    /**
     * Parent relationship
     */
    if (rel.relationship_type === 'parent') {

      childrenMap
        .get(rel.member_id)
        ?.add(rel.related_member_id);

      parentsMap
        .get(rel.related_member_id)
        ?.add(rel.member_id);
    }

    /**
     * Child relationship compatibility
     */
    if (rel.relationship_type === 'child') {

      childrenMap
        .get(rel.related_member_id)
        ?.add(rel.member_id);

      parentsMap
        .get(rel.member_id)
        ?.add(rel.related_member_id);
    }

    /**
     * Spouses
     */
    if (rel.relationship_type === 'spouse') {

      spousesMap
        .get(rel.member_id)
        ?.add(rel.related_member_id);

      spousesMap
        .get(rel.related_member_id)
        ?.add(rel.member_id);
    }
  });

  /**
   * ========================================================
   * STEP 2 — FIND ROOTS
   * ========================================================
   */

  const roots = members.filter(member => {

    return (
      parentsMap.get(member.id)?.size || 0
    ) === 0;
  });

  /**
   * ========================================================
   * STEP 3 — BUILD HIERARCHY
   * ========================================================
   */

  const visited = new Set<string>();

  function buildHierarchy(memberId: string): HierarchyNode {

    visited.add(memberId);

    const member = memberMap.get(memberId)!;

    /**
     * Collect ALL children
     */
    const childrenIds = Array.from(
      childrenMap.get(memberId) || []
    );

    /**
     * Sort children:
     * spouses first together
     */
    childrenIds.sort((a, b) => {

      const aChildren =
        childrenMap.get(a)?.size || 0;

      const bChildren =
        childrenMap.get(b)?.size || 0;

      return bChildren - aChildren;
    });

    const children: HierarchyNode[] = [];

    childrenIds.forEach(childId => {

      if (!visited.has(childId)) {

        children.push(
          buildHierarchy(childId)
        );
      }
    });

    return {
      id: memberId,
      member,
      children,
    };
  }

  /**
   * ========================================================
   * STEP 4 — CREATE FOREST
   * ========================================================
   */

  const forest: HierarchyNode = {
    id: 'virtual-root',
    member: {} as Member,
    children: roots.map(root =>
      buildHierarchy(root.id)
    ),
  };

  /**
   * ========================================================
   * STEP 5 — D3 LAYOUT
   * ========================================================
   */

  const root = hierarchy(forest);

  const layout = tree<HierarchyNode>()
    .nodeSize([
      config.nodeWidth + config.horizontalGap,
      config.nodeHeight + config.verticalGap,
    ])
    .separation((a, b) => {

      /**
       * Same parent = closer
       */
      if (
        a.parent &&
        b.parent &&
        a.parent === b.parent
      ) {
        return 1;
      }

      /**
       * Different family branch
       */
      return 2.2;
    });

  layout(root);

  /**
   * ========================================================
   * STEP 6 — CREATE NODES
   * ========================================================
   */

  const nodes: TreeNode[] = [];

  const nodeMap = new Map<string, TreeNode>();

  root.descendants().forEach((
    node: d3.HierarchyNode<HierarchyNode>
  ) => {

    if (node.data.id === 'virtual-root') {
      return;
    }

    const treeNode: TreeNode = {
      id: node.data.id,
      type: 'member',
      data: node.data.member,
      position: {
        x: node.x ?? 0,
        y: node.y ?? 0,
      },
    };

    nodes.push(treeNode);

    nodeMap.set(treeNode.id, treeNode);
  });

  /**
   * ========================================================
   * STEP 7 — SPOUSE POSITIONING
   * ========================================================
   *
   * IMPORTANT:
   *
   * D3 trees do NOT naturally support spouses.
   *
   * So we manually place spouses beside each other.
   *
   * ========================================================
   */

  const processedSpouses = new Set<string>();

  relationships.forEach(rel => {

    if (rel.relationship_type !== 'spouse') {
      return;
    }

    const pairKey = [
      rel.member_id,
      rel.related_member_id,
    ]
      .sort()
      .join('-');

    if (processedSpouses.has(pairKey)) {
      return;
    }

    processedSpouses.add(pairKey);

    const a = nodeMap.get(rel.member_id);
    const b = nodeMap.get(rel.related_member_id);

    if (!a || !b) return;

    /**
     * Average Y
     */
    const avgY =
      (a.position.y + b.position.y) / 2;

    a.position.y = avgY;
    b.position.y = avgY;

    /**
     * Place side by side
     */
    const centerX =
      (a.position.x + b.position.x) / 2;

    a.position.x =
      centerX - config.spouseGap / 2;

    b.position.x =
      centerX + config.spouseGap / 2;
  });

  /**
   * ========================================================
   * STEP 8 — CHILD RECENTERING
   * ========================================================
   *
   * CRITICAL:
   *
   * Children must always appear centered
   * below their parents/spouse group.
   *
   * ========================================================
   */

  members.forEach(member => {

    const children = Array.from(
      childrenMap.get(member.id) || []
    );

    if (!children.length) {
      return;
    }

    const parentNode = nodeMap.get(member.id);

    if (!parentNode) return;

    /**
     * Find spouse center
     */
    const spouses = Array.from(
      spousesMap.get(member.id) || []
    );

    let parentCenterX = parentNode.position.x;

    if (spouses.length) {

      const spouseNode =
        nodeMap.get(spouses[0]);

      if (spouseNode) {

        parentCenterX =
          (
            parentNode.position.x +
            spouseNode.position.x
          ) / 2;
      }
    }

    /**
     * Get child nodes
     */
    const childNodes = children
      .map(id => nodeMap.get(id))
      .filter(Boolean) as TreeNode[];

    if (!childNodes.length) {
      return;
    }

    /**
     * Current child group center
     */
    const childCenterX =
      childNodes.reduce(
        (sum, c) => sum + c.position.x,
        0
      ) / childNodes.length;

    /**
     * Shift whole child group
     */
    const offset =
      parentCenterX - childCenterX;

    childNodes.forEach(child => {

      child.position.x += offset;
    });
  });

  /**
   * ========================================================
   * STEP 9 — COLLISION FIX
   * ========================================================
   */

  fixCollisions(nodes, config);

  /**
   * ========================================================
   * STEP 10 — CREATE EDGES
   * ========================================================
   */

  const edges: TreeEdge[] = [];

  const processedSpouseEdges = new Set<string>();

  relationships.forEach(rel => {

    /**
     * Parent edges
     */
    if (
      rel.relationship_type === 'parent'
    ) {

      edges.push({
        id:
          `parent-${rel.member_id}-${rel.related_member_id}`,
        source: rel.member_id,
        target: rel.related_member_id,
        type: 'parent',
      });
    }

    /**
     * Child compatibility
     */
    if (
      rel.relationship_type === 'child'
    ) {

      edges.push({
        id:
          `parent-${rel.related_member_id}-${rel.member_id}`,
        source: rel.related_member_id,
        target: rel.member_id,
        type: 'parent',
      });
    }

    /**
     * Spouse edges
     */
    if (
      rel.relationship_type === 'spouse'
    ) {

      const pairKey = [
        rel.member_id,
        rel.related_member_id,
      ]
        .sort()
        .join('-');

      if (
        processedSpouseEdges.has(pairKey)
      ) {
        return;
      }

      processedSpouseEdges.add(pairKey);

      edges.push({
        id: `spouse-${pairKey}`,
        source: rel.member_id,
        target: rel.related_member_id,
        type: 'spouse',
      });
    }
  });

  /**
   * ========================================================
   * STEP 11 — CENTER TREE
   * ========================================================
   */

  centerTree(nodes);

  return {
    nodes,
    edges,
  };
}

/**
 * ============================================================
 * FIX COLLISIONS
 * ============================================================
 */

function fixCollisions(
  nodes: TreeNode[],
  config: LayoutConfig
) {

  const levels = new Map<number, TreeNode[]>();

  nodes.forEach(node => {

    const level = Math.round(
      node.position.y /
      (config.nodeHeight + config.verticalGap)
    );

    if (!levels.has(level)) {
      levels.set(level, []);
    }

    levels.get(level)!.push(node);
  });

  levels.forEach(levelNodes => {

    levelNodes.sort(
      (a, b) =>
        a.position.x - b.position.x
    );

    for (let i = 0; i < levelNodes.length - 1; i++) {

      const current = levelNodes[i];
      const next = levelNodes[i + 1];

      const minGap =
        config.nodeWidth + 40;

      const actualGap =
        next.position.x - current.position.x;

      if (actualGap < minGap) {

        const shift = minGap - actualGap;

        for (let j = i + 1; j < levelNodes.length; j++) {

          levelNodes[j].position.x += shift;
        }
      }
    }
  });
}

/**
 * ============================================================
 * CENTER TREE
 * ============================================================
 */

function centerTree(nodes: TreeNode[]) {

  if (!nodes.length) {
    return;
  }

  const minX = Math.min(
    ...nodes.map(n => n.position.x)
  );

  const maxX = Math.max(
    ...nodes.map(n => n.position.x)
  );

  const offset =
    -(minX + maxX) / 2;

  nodes.forEach(node => {

    node.position.x += offset;
  });
}