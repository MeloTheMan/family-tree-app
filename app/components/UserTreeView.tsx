'use client';

import { useEffect, useState } from 'react';
import { useMembers } from '@/hooks/useMembers';
import FamilyTree from './tree/FamilyTree';
import MemberDetail from './members/MemberDetail';
import { TreeLoadingSkeleton } from './LoadingSkeleton';
import type { Member, MemberWithRelationships } from '@/lib/types';

interface UserTreeViewProps {
  onLogout: () => void;
}

export default function UserTreeView({ onLogout }: UserTreeViewProps) {
  const { members, relationships, loading, error, fetchMembers } = useMembers();
  const [selectedMember, setSelectedMember] = useState<MemberWithRelationships | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const getMemberWithRelationships = (member: Member): MemberWithRelationships => {
    const parents = relationships
      .filter(rel => rel.member_id === member.id && rel.relationship_type === 'child')
      .map(rel => members.find(m => m.id === rel.related_member_id))
      .filter((m): m is Member => m !== undefined);

    const children = relationships
      .filter(rel => rel.member_id === member.id && rel.relationship_type === 'parent')
      .map(rel => members.find(m => m.id === rel.related_member_id))
      .filter((m): m is Member => m !== undefined);

    const spouses = relationships
      .filter(rel => rel.member_id === member.id && rel.relationship_type === 'spouse')
      .map(rel => members.find(m => m.id === rel.related_member_id))
      .filter((m): m is Member => m !== undefined);

    return {
      ...member,
      parents,
      children,
      spouses,
    };
  };

  const handleMemberClick = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      setSelectedMember(getMemberWithRelationships(member));
    }
  };

  if (loading && members.length === 0) {
    return <TreeLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Erreur</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchMembers}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Arbre Généalogique Familial</h1>
        <button
          onClick={onLogout}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
        >
          Se déconnecter
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {members.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-2 text-lg">Aucun membre dans l'arbre généalogique</p>
            </div>
          </div>
        ) : (
          <FamilyTree
            members={members}
            relationships={relationships}
            onMemberClick={handleMemberClick}
            readOnly={true}
          />
        )}
      </main>

      {/* Member detail modal */}
      {selectedMember && (
        <MemberDetail
          member={selectedMember}
          onEdit={() => {}}
          onClose={() => setSelectedMember(null)}
          readOnly={true}
        />
      )}
    </div>
  );
}
