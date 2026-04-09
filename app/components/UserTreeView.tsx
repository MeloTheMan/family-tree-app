'use client';

import { useEffect, useState } from 'react';
import { useMembers } from '@/hooks/useMembers';
import { toast } from 'react-toastify';
import FamilyTree from './tree/FamilyTree';
import MemberDetail from './members/MemberDetail';
import MemberForm from './members/MemberForm';
import ChangeCredentialsForm from './auth/ChangeCredentialsForm';
import { TreeLoadingSkeleton } from './LoadingSkeleton';
import type { Member, MemberWithRelationships, MemberFormData } from '@/lib/types';

interface UserTreeViewProps {
  onLogout: () => void;
  currentUserMemberId: string | null;
}

export default function UserTreeView({ onLogout, currentUserMemberId }: UserTreeViewProps) {
  const { members, relationships, loading, error, fetchMembers, updateMember } = useMembers();
  const [selectedMember, setSelectedMember] = useState<MemberWithRelationships | null>(null);
  const [isEditingOwnProfile, setIsEditingOwnProfile] = useState(false);
  const [showChangeCredentials, setShowChangeCredentials] = useState(false);

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

  const handleEditOwnProfile = () => {
    if (selectedMember && selectedMember.id === currentUserMemberId) {
      setIsEditingOwnProfile(true);
    }
  };

  const handleUpdateOwnProfile = async (data: MemberFormData) => {
    if (!selectedMember || selectedMember.id !== currentUserMemberId) return;
    
    const toastId = toast.loading('Mise à jour de votre profil...');
    
    const result = await updateMember(selectedMember.id, data);
    if (result) {
      toast.update(toastId, {
        render: 'Profil mis à jour avec succès',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      setIsEditingOwnProfile(false);
      setSelectedMember(getMemberWithRelationships(result));
    } else {
      toast.update(toastId, {
        render: 'Erreur lors de la mise à jour',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleCloseEdit = () => {
    setIsEditingOwnProfile(false);
  };

  const handleCredentialsChanged = () => {
    // User will be logged out automatically after credentials change
    onLogout();
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowChangeCredentials(true)}
            className="px-3 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 transition-colors duration-200 flex items-center gap-2"
            title="Modifier mes identifiants"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span className="hidden sm:inline">Mes identifiants</span>
          </button>
          <button
            onClick={onLogout}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
          >
            Se déconnecter
          </button>
        </div>
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
      {selectedMember && !isEditingOwnProfile && (
        <MemberDetail
          member={selectedMember}
          onEdit={handleEditOwnProfile}
          onClose={() => setSelectedMember(null)}
          readOnly={selectedMember.id !== currentUserMemberId}
          currentUserMemberId={currentUserMemberId}
          allMembers={members}
          allRelationships={relationships}
        />
      )}

      {/* Edit own profile modal */}
      {isEditingOwnProfile && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={handleCloseEdit}
          ></div>

          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="bg-white px-4 sm:px-6 pt-5 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Modifier mon profil
                </h3>
                <button
                  onClick={handleCloseEdit}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none transition-colors duration-200"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <MemberForm
                member={selectedMember}
                onSubmit={handleUpdateOwnProfile}
                onCancel={handleCloseEdit}
              />
            </div>
          </div>
        </div>
      )}

      {/* Change credentials modal */}
      {showChangeCredentials && (
        <ChangeCredentialsForm
          onClose={() => setShowChangeCredentials(false)}
          onSuccess={handleCredentialsChanged}
        />
      )}
    </div>
  );
}
