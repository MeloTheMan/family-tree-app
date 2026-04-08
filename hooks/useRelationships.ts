'use client';

import { useState, useCallback } from 'react';
import type { RelationshipFormData, ApiError } from '@/lib/types';

interface UseRelationshipsReturn {
  loading: boolean;
  error: string | null;
  createRelationship: (data: RelationshipFormData) => Promise<boolean>;
}

interface UseRelationshipsOptions {
  onSuccess?: () => void;
}

export function useRelationships(options?: UseRelationshipsOptions): UseRelationshipsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRelationship = useCallback(async (data: RelationshipFormData): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/relationships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const apiError = result as ApiError;
        let errorMessage = apiError.error.message || 'Erreur lors de la création de la relation';
        
        // Provide user-friendly error messages based on error code
        switch (apiError.error.code) {
          case 'CYCLE_DETECTED':
            errorMessage = 'Cette relation créerait une incohérence dans l\'arbre généalogique (un membre ne peut pas être son propre ancêtre)';
            break;
          case 'DUPLICATE':
            errorMessage = 'Cette relation existe déjà';
            break;
          case 'NOT_FOUND':
            errorMessage = 'Un ou plusieurs membres n\'existent pas';
            break;
          case 'VALIDATION_ERROR':
            errorMessage = 'Les données de la relation sont invalides';
            break;
          default:
            errorMessage = apiError.error.message;
        }
        
        throw new Error(errorMessage);
      }

      // Call onSuccess callback if provided
      if (options?.onSuccess) {
        options.onSuccess();
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inattendue';
      setError(errorMessage);
      console.error('Error creating relationship:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [options]);

  return {
    loading,
    error,
    createRelationship,
  };
}
