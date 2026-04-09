'use client';

import { useState, useCallback } from 'react';
import type { GalleryPhoto, GalleryPhotoFormData, ApiError } from '@/lib/types';

interface UseGalleryReturn {
  photos: GalleryPhoto[];
  loading: boolean;
  error: string | null;
  fetchPhotos: (memberId: string) => Promise<void>;
  addPhoto: (memberId: string, data: GalleryPhotoFormData) => Promise<GalleryPhoto | null>;
  deletePhoto: (memberId: string, photoId: string) => Promise<boolean>;
}

export function useGallery(): UseGalleryReturn {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async (memberId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/members/${memberId}/gallery`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        const apiError = result as ApiError;
        throw new Error(apiError.error.message || 'Erreur lors de la récupération des photos');
      }

      setPhotos(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inattendue';
      setError(errorMessage);
      console.error('Error fetching gallery photos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addPhoto = useCallback(async (
    memberId: string,
    data: GalleryPhotoFormData
  ): Promise<GalleryPhoto | null> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('photo', data.photo);
      
      if (data.caption) {
        formData.append('caption', data.caption);
      }

      const response = await fetch(`/api/members/${memberId}/gallery`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const apiError = result as ApiError;
        throw new Error(apiError.error.message || "Erreur lors de l'ajout de la photo");
      }

      // Add new photo to the list
      setPhotos(prev => [result.data, ...prev]);

      return result.data as GalleryPhoto;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inattendue';
      setError(errorMessage);
      console.error('Error adding gallery photo:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePhoto = useCallback(async (
    memberId: string,
    photoId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/members/${memberId}/gallery/${photoId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const apiError = result as ApiError;
        throw new Error(apiError.error.message || 'Erreur lors de la suppression de la photo');
      }

      // Remove photo from the list
      setPhotos(prev => prev.filter(p => p.id !== photoId));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inattendue';
      setError(errorMessage);
      console.error('Error deleting gallery photo:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    photos,
    loading,
    error,
    fetchPhotos,
    addPhoto,
    deletePhoto,
  };
}
