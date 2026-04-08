'use client';

import { useState, useCallback, useMemo, memo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  NodeTypes,
  ReactFlowProvider,
  useNodesInitialized,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Member, Relationship, MemberWithRelationships } from '@/lib/types';
import { calculateTreeLayout } from '@/lib/utils/tree-layout';
import MemberNode from './MemberNode';
import TreeControls from './TreeControls';
import MemberDetail from '../members/MemberDetail';

interface FamilyTreeProps {
  initialMembers: Member[];
  initialRelationships: Relationship[];
  onEditMember?: (member: Member) => void;
}

const FamilyTreeContent = memo(function FamilyTreeContent({ 
  initialMembers, 
  initialRelationships, 
  onEditMember 
}: FamilyTreeProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const nodesInitialized = useNodesInitialized();
  const { fitView } = useReactFlow();

  // Force fitView when nodes are initialized
  useEffect(() => {
    if (nodesInitialized) {
      console.log('Nodes initialized! Fitting view...');
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 800 });
      }, 100);
    }
  }, [nodesInitialized, fitView]);

  // Calculate tree layout - memoized to prevent recalculation
  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(() => {
    const result = calculateTreeLayout(initialMembers, initialRelationships);
    console.log('Tree layout calculated:', {
      nodesCount: result.nodes.length,
      edgesCount: result.edges.length,
      edges: result.edges,
      relationships: initialRelationships
    });
    return result;
  }, [initialMembers, initialRelationships]);

  // Handle node click to show detail panel
  const handleNodeClick = useCallback((memberId: string) => {
    setSelectedMemberId(memberId);
    setShowDetail(true);
  }, []);

  // Convert TreeNode to ReactFlow Node format - memoized
  const nodes: Node[] = useMemo(() => {
    return layoutNodes.map((node) => ({
      id: node.id,
      type: 'member',
      position: node.position,
      data: {
        ...node.data,
        isSelected: node.id === selectedMemberId,
        onClick: () => handleNodeClick(node.id),
      },
      // Add explicit dimensions for edge calculations
      width: 192, // 48 * 4 (w-48 in Tailwind)
      height: 128, // Approximate height of the node
      zIndex: 10, // Nodes above edges
    }));
  }, [layoutNodes, selectedMemberId, handleNodeClick]);

  // Convert TreeEdge to ReactFlow Edge format with different styles - memoized
  const edges: Edge[] = useMemo(() => {
    const reactFlowEdges = layoutEdges.map((edge): Edge => {
      const isSpouseEdge = edge.type === 'spouse';
      const isParentEdge = edge.type === 'parent';
      
      const baseEdge: Edge = {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: isParentEdge ? 'smoothstep' : 'straight',
        animated: false,
        style: {
          stroke: isParentEdge ? '#3b82f6' : '#10b981',
          strokeWidth: isParentEdge ? 2.5 : 3.5,
          strokeDasharray: isSpouseEdge ? '5,5' : undefined, // Dashed line for spouses
        },
        // Spouse edges have higher z-index to appear above parent edges
        zIndex: isSpouseEdge ? 2 : 1,
      };

      if (isParentEdge) {
        baseEdge.markerEnd = {
          type: 'arrowclosed' as const,
          color: '#3b82f6',
        };
      }

      return baseEdge;
    });
    console.log('ReactFlow edges:', reactFlowEdges);
    return reactFlowEdges;
  }, [layoutEdges]);

  // Custom node types - memoized
  const nodeTypes: NodeTypes = useMemo(() => ({
    member: MemberNode,
  }), []);

  // Get member with relationships for detail panel - memoized
  const selectedMemberWithRelationships = useMemo((): MemberWithRelationships | null => {
    if (!selectedMemberId) return null;

    const member = initialMembers.find(m => m.id === selectedMemberId);
    if (!member) return null;

    // Build relationships for this member
    const parents: Member[] = [];
    const children: Member[] = [];
    const spouses: Member[] = [];

    initialRelationships.forEach(rel => {
      if (rel.member_id === selectedMemberId) {
        const relatedMember = initialMembers.find(m => m.id === rel.related_member_id);
        if (relatedMember) {
          if (rel.relationship_type === 'child') {
            parents.push(relatedMember);
          } else if (rel.relationship_type === 'parent') {
            children.push(relatedMember);
          } else if (rel.relationship_type === 'spouse') {
            spouses.push(relatedMember);
          }
        }
      }
    });

    return {
      ...member,
      parents,
      children,
      spouses,
    };
  }, [selectedMemberId, initialMembers, initialRelationships]);

  // Handle close detail panel
  const handleCloseDetail = useCallback(() => {
    setShowDetail(false);
    setSelectedMemberId(null);
  }, []);

  // Handle edit member
  const handleEditMember = useCallback(() => {
    if (selectedMemberWithRelationships && onEditMember) {
      onEditMember(selectedMemberWithRelationships);
      handleCloseDetail();
    }
  }, [selectedMemberWithRelationships, onEditMember, handleCloseDetail]);

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.1,
          maxZoom: 1.5,
          duration: 800,
        }}
        minZoom={0.05}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        panOnDrag={true}
        panOnScroll={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        className="transition-all duration-300"
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={16} 
          size={1} 
          className="opacity-50" 
        />
        <TreeControls />
      </ReactFlow>

      {/* Member Detail Panel */}
      {showDetail && selectedMemberWithRelationships && (
        <MemberDetail
          member={selectedMemberWithRelationships}
          onEdit={handleEditMember}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
});

// Wrap with ReactFlowProvider
export default function FamilyTree(props: FamilyTreeProps) {
  return (
    <ReactFlowProvider>
      <FamilyTreeContent {...props} />
    </ReactFlowProvider>
  );
}
