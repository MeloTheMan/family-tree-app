'use client';

import { useState, useCallback } from 'react';
import type { Member, Relationship, MemberFormData, ApiError } from '@/lib/types';

interface UseMembersReturn {
  members: Member[];
  relationships: Relationship[];
  loading: boolean;
  error: string | null;
  fetchMembers: () => Promise<void>;
  createMember: (data: MemberFormData) => Promise<Member | null>;
  updateMember: (id: string, data: MemberFormData) => Promise<Member | null>;
  deleteMember: (id: string) => Promise<boolean>;
  deleteAllMembers: () => Promise<boolean>;
}

export function useMembers(): UseMembersReturn {
  const [members, setMembers] = useState<Member[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/members');
      const result = await response.json();

      if (!response.ok || !result.success) {
        const apiError = result as ApiError;
        throw new Error(apiError.error.message || 'Erreur lors de la récupération des membres');
      }

      setMembers(result.data.members);
      setRelationships(result.data.relationships);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inattendue';
      setError(errorMessage);
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createMember = useCallback(async (data: MemberFormData): Promise<Member | null> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      
      if (data.last_name) {
        formData.append('last_name', data.last_name);
      }
      
      if (data.birth_date) {
        formData.append('birth_date', data.birth_date);
      }
      
      if (data.birthplace) {
        formData.append('birthplace', data.birthplace);
      }
      
      if (data.work) {
        formData.append('work', data.work);
      }
      
      if (data.photo) {
        formData.append('photo', data.photo);
      }

      const response = await fetch('/api/members', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const apiError = result as ApiError;
        throw new Error(apiError.error.message || 'Erreur lors de la création du membre');
      }

      // Refresh members list after successful creation
      await fetchMembers();

      return result.data as Member;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inattendue';
      setError(errorMessage);
      console.error('Error creating member:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchMembers]);

  const updateMember = useCallback(async (id: string, data: MemberFormData): Promise<Member | null> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      
      if (data.last_name) {
        formData.append('last_name', data.last_name);
      }
      
      if (data.birth_date) {
        formData.append('birth_date', data.birth_date);
      }
      
      if (data.birthplace) {
        formData.append('birthplace', data.birthplace);
      }
      
      if (data.work) {
        formData.append('work', data.work);
      }
      
      if (data.photo) {
        formData.append('photo', data.photo);
      }

      const response = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const apiError = result as ApiError;
        throw new Error(apiError.error.message || 'Erreur lors de la mise à jour du membre');
      }

      // Refresh members list after successful update
      await fetchMembers();

      return result.data as Member;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inattendue';
      setError(errorMessage);
      console.error('Error updating member:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchMembers]);

  const deleteMember = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const apiError = result as ApiError;
        throw new Error(apiError.error.message || 'Erreur lors de la suppression du membre');
      }

      // Refresh members list after successful deletion
      await fetchMembers();

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inattendue';
      setError(errorMessage);
      console.error('Error deleting member:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchMembers]);

  const deleteAllMembers = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/members/delete-all', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const apiError = result as ApiError;
        throw new Error(apiError.error.message || 'Erreur lors de la suppression de l\'arbre');
      }

      // Clear local state
      setMembers([]);
      setRelationships([]);

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inattendue';
      setError(errorMessage);
      console.error('Error deleting all members:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    members,
    relationships,
    loading,
    error,
    fetchMembers,
    createMember,
    updateMember,
    deleteMember,
    deleteAllMembers,
  };
}
