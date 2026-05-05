'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Member, Relationship, MemberFormData, RelationshipFormData } from '@/lib/types';
import { useMembers } from '@/hooks/useMembers';
import { useRelationships } from '@/hooks/useRelationships';
import FamilyTree from './tree/FamilyTree';
import MemberForm from './members/MemberForm';
import RelationshipForm from './relationships/RelationshipForm';
import ChangeCredentialsForm from './auth/ChangeCredentialsForm';
import ConfirmDialog from './ConfirmDialog';
import { TreeLoadingSkeleton, EmptyState } from './LoadingSkeleton';
import { calculateNuclearFamily } from '@/lib/utils/nuclear-family';

interface OwnerTreeViewProps {
  onLogout: () => void;
  ownerId: string;
}

type ModalType = 'member' | 'relationship' | 'edit' | null;

export default function OwnerTreeView({ onLogout, ownerId }: OwnerTreeViewProps) {
  const { members, relationships, loading, error, fetchMembers, createMember, updateMember, deleteMember } = useMembers();
  const { createRelationship, error: relationshipError } = useRelationships({
    onSuccess: () => {
      fetchMembers();
      setModalType(null);
      setEditingMember(null);
    },
  });

  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showChangeCredentials, setShowChangeCredentials] = useState(false);
  const [nuclearFamilyMembers, setNuclearFamilyMembers] = useState<Member[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    danger?: boolean;
  } | null>(null);

  // Fetch members on mount
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Calculate nuclear family when members or relationships change
  useEffect(() => {
    if (ownerId && members.length > 0) {
      const owner = members.find(m => m.id === ownerId);
      if (owner) {
        const nuclearFamily = calculateNuclearFamily(ownerId, members, relationships);
        
        // Nuclear family includes: owner, parents, siblings, spouse(s), and children
        const familySet = new Set<string>([ownerId]);
        
        // Add parents
        nuclearFamily.parents.forEach(p => familySet.add(p.id));
        
        // Add siblings
        nuclearFamily.siblings.forEach(s => familySet.add(s.id));
        
        // Add spouse(s)
        const spouseRelationships = relationships.filter(
          r => (r.member_id === ownerId || r.related_member_id === ownerId) && 
               r.relationship_type === 'spouse'
        );
        spouseRelationships.forEach(rel => {
          const spouseId = rel.member_id === ownerId ? rel.related_member_id : rel.member_id;
          familySet.add(spouseId);
        });
        
        // Add children
        const childRelationships = relationships.filter(
          r => r.member_id === ownerId && r.relationship_type === 'parent'
        );
        childRelationships.forEach(rel => {
          familySet.add(rel.related_member_id);
        });
        
        const nuclearMembers = members.filter(m => familySet.has(m.id));
        setNuclearFamilyMembers(nuclearMembers);
      }
    }
  }, [ownerId, members, relationships]);

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
    // Check if member is in nuclear family
    if (!nuclearFamilyMembers.find(m => m.id === member.id)) {
      toast.error('Vous ne pouvez modifier que les membres de votre famille nucléaire');
      return;
    }
    setEditingMember(member);
    setModalType('edit');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setEditingMember(null);
  };

  const handleCredentialsChanged = () => {
    onLogout();
  };

  const handleDeleteMember = (member: Member) => {
    // Check if member is in nuclear family
    if (!nuclearFamilyMembers.find(m => m.id === member.id)) {
      toast.error('Vous ne pouvez supprimer que les membres de votre famille nucléaire');
      return;
    }
    
    // Prevent owner from deleting themselves
    if (member.id === ownerId) {
      toast.error('Vous ne pouvez pas vous supprimer vous-même');
      return;
    }
    
    setConfirmDialog({
      show: true,
      title: 'Supprimer ce membre ?',
      message: `Êtes-vous sûr de vouloir supprimer ${member.name} ${member.last_name || ''} ? Cette action supprimera également toutes ses relations, photos et données de position. Cette action est irréversible.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        const toastId = toast.loading('Suppression du membre...');
        
        const result = await deleteMember(member.id);
        if (result) {
          toast.update(toastId, {
            render: 'Membre supprimé avec succès',
            type: 'success',
            isLoading: false,
            autoClose: 3000,
          });
        } else {
          toast.update(toastId, {
            render: 'Erreur lors de la suppression',
            type: 'error',
            isLoading: false,
            autoClose: 3000,
          });
        }
      },
      danger: true,
    });
  };

  if (loading && members.length === 0) {
    return <TreeLoadingSkeleton />;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Arbre Généalogique - Gestion Famille</h1>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto flex-wrap">
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
            disabled={nuclearFamilyMembers.length < 2}
          >
            <span className="hidden sm:inline">+ Ajouter une relation</span>
            <span className="sm:hidden">+ Relation</span>
          </button>
          <button
            onClick={() => setShowChangeCredentials(true)}
            className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 flex items-center gap-2"
            title="Modifier mes identifiants"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span className="hidden lg:inline">Identifiants</span>
          </button>
          <button
            onClick={onLogout}
            className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Main content - Family Tree */}
      <div className="flex-1 relative bg-gray-50">
        {members.length === 0 ? (
          <EmptyState onAddMember={() => setModalType('member')} />
        ) : (
          <FamilyTree
            initialMembers={members}
            initialRelationships={relationships}
            onEditMember={handleEditMember}
            onDeleteMember={handleDeleteMember}
          />
        )}
      </div>

      {/* Modal for forms */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity animate-fadeIn"
            onClick={handleCloseModal}
          ></div>

          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slideUp">
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

              {(modalType === 'member' || modalType === 'edit') && (
                <MemberForm
                  member={editingMember || undefined}
                  onSubmit={modalType === 'edit' ? handleUpdateMember : handleCreateMember}
                  onCancel={handleCloseModal}
                />
              )}

              {modalType === 'relationship' && (
                <RelationshipForm
                  members={nuclearFamilyMembers}
                  onSubmit={handleCreateRelationship}
                  onCancel={handleCloseModal}
                />
              )}
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

      {/* Confirm dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText="Supprimer"
          cancelText="Annuler"
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          danger={confirmDialog.danger}
        />
      )}
    </div>
  );
}
