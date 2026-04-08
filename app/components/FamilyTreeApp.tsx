'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Member, Relationship, MemberFormData, RelationshipFormData } from '@/lib/types';
import { useMembers } from '@/hooks/useMembers';
import { useRelationships } from '@/hooks/useRelationships';
import FamilyTree from './tree/FamilyTree';
import MemberForm from './members/MemberForm';
import RelationshipForm from './relationships/RelationshipForm';
import { TreeLoadingSkeleton, EmptyState } from './LoadingSkeleton';

interface FamilyTreeAppProps {
  initialMembers: Member[];
  initialRelationships: Relationship[];
}

type ModalType = 'member' | 'relationship' | 'edit' | null;

export default function FamilyTreeApp({ initialMembers, initialRelationships }: FamilyTreeAppProps) {
  const { members, relationships, loading, error, fetchMembers, createMember, updateMember } = useMembers();
  const { createRelationship, error: relationshipError } = useRelationships({
    onSuccess: () => {
      fetchMembers();
      setModalType(null);
      setEditingMember(null);
    },
  });

  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Initialize with server-fetched data
  useEffect(() => {
    if (initialMembers.length > 0 || initialRelationships.length > 0) {
      // Use initial data on first render
      fetchMembers();
    }
  }, []);

  // Show error notifications
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (relationshipError) {
      toast.error(relationshipError);
    }
  }, [relationshipError]);

  const handleCreateMember = async (data: MemberFormData) => {
    // Optimistic update: close modal immediately for better UX
    const toastId = toast.loading('Création du membre...');
    
    const result = await createMember(data);
    if (result) {
      toast.update(toastId, {
        render: 'Membre créé avec succès',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      setModalType(null);
    } else {
      toast.update(toastId, {
        render: 'Erreur lors de la création',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleUpdateMember = async (data: MemberFormData) => {
    if (!editingMember) return;
    
    const toastId = toast.loading('Mise à jour du membre...');
    
    const result = await updateMember(editingMember.id, data);
    if (result) {
      toast.update(toastId, {
        render: 'Membre mis à jour avec succès',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      setModalType(null);
      setEditingMember(null);
    } else {
      toast.update(toastId, {
        render: 'Erreur lors de la mise à jour',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleCreateRelationship = async (data: RelationshipFormData) => {
    const toastId = toast.loading('Création de la relation...');
    
    const result = await createRelationship(data);
    if (result) {
      toast.update(toastId, {
        render: 'Relation créée avec succès',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
    } else {
      toast.update(toastId, {
        render: 'Erreur lors de la création de la relation',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setModalType('edit');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setEditingMember(null);
  };

  const displayMembers = members.length > 0 ? members : initialMembers;
  const displayRelationships = relationships.length > 0 ? relationships : initialRelationships;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Arbre Généalogique</h1>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setModalType('member')}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <span className="hidden sm:inline">+ Ajouter un membre</span>
            <span className="sm:hidden">+ Membre</span>
          </button>
          <button
            onClick={() => setModalType('relationship')}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            disabled={displayMembers.length < 2}
          >
            <span className="hidden sm:inline">+ Ajouter une relation</span>
            <span className="sm:hidden">+ Relation</span>
          </button>
        </div>
      </header>

      {/* Main content - Family Tree */}
      <div className="flex-1 relative bg-gray-50">
        {loading && displayMembers.length === 0 ? (
          <TreeLoadingSkeleton />
        ) : displayMembers.length === 0 ? (
          <EmptyState onAddMember={() => setModalType('member')} />
        ) : (
          <FamilyTree
            initialMembers={displayMembers}
            initialRelationships={displayRelationships}
            onEditMember={handleEditMember}
          />
        )}
      </div>

      {/* Modal for forms */}
      {modalType && (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 animate-fadeIn"
              onClick={handleCloseModal}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-slideUp">
              <div className="bg-white px-4 sm:px-6 pt-5 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {modalType === 'member' && 'Ajouter un membre'}
                    {modalType === 'edit' && 'Modifier le membre'}
                    {modalType === 'relationship' && 'Ajouter une relation'}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none transition-colors duration-200"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Form content */}
                {(modalType === 'member' || modalType === 'edit') && (
                  <MemberForm
                    member={editingMember || undefined}
                    onSubmit={modalType === 'edit' ? handleUpdateMember : handleCreateMember}
                    onCancel={handleCloseModal}
                  />
                )}

                {modalType === 'relationship' && (
                  <RelationshipForm
                    members={displayMembers}
                    onSubmit={handleCreateRelationship}
                    onCancel={handleCloseModal}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
