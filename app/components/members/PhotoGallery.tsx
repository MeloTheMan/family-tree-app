'use client';

import { useState, useRef, useEffect } from 'react';
import { useGallery } from '@/hooks/useGallery';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-toastify';
import type { GalleryPhoto } from '@/lib/types';

interface PhotoGalleryProps {
  memberId: string;
}

export default function PhotoGallery({ memberId }: PhotoGalleryProps) {
  const { photos, loading, fetchPhotos, addPhoto, deletePhoto } = useGallery();
  const { session } = useAuth();
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPhotos(memberId);
  }, [memberId, fetchPhotos]);

  const handleFileSelect = async (file: File) => {
    if (!session) {
      toast.error('Vous devez être connecté pour ajouter des photos');
      return;
    }

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La photo doit faire moins de 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format accepté: JPEG, PNG, WEBP');
      return;
    }

    setIsUploading(true);

    try {
      const result = await addPhoto(memberId, { photo: file, caption });
      
      if (result) {
        toast.success('Photo ajoutée avec succès');
        setCaption('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast.error("Erreur lors de l'ajout de la photo");
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout de la photo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (photoId: string, uploadedByUserId: string) => {
    if (!session) {
      toast.error('Vous devez être connecté');
      return;
    }

    // Check permissions
    const isAdmin = session.userType === 'admin';
    const isOwnGallery = session.memberId === memberId;

    if (!isAdmin && !isOwnGallery) {
      toast.error('Vous ne pouvez supprimer que les photos de votre propre galerie');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
      return;
    }

    const success = await deletePhoto(memberId, photoId);
    
    if (success) {
      toast.success('Photo supprimée avec succès');
      setSelectedPhoto(null);
    } else {
      toast.error('Erreur lors de la suppression de la photo');
    }
  };

  const canDelete = (photo: GalleryPhoto) => {
    if (!session) return false;
    
    const isAdmin = session.userType === 'admin';
    const isOwnGallery = session.memberId === memberId;

    return isAdmin || isOwnGallery;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Album Photos</h3>
        {session && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Upload...' : '+ Ajouter une photo'}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
      />

      {loading && photos.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2">Aucune photo dans l'album</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group cursor-pointer aspect-square"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.photo_url}
                alt={photo.caption || 'Photo de galerie'}
                className="w-full h-full object-cover rounded-lg transition-transform group-hover:scale-105"
              />
              {canDelete(photo) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(photo.id, photo.uploaded_by_user_id);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  aria-label="Supprimer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.photo_url}
              alt={selectedPhoto.caption || 'Photo de galerie'}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {selectedPhoto.caption && (
              <p className="mt-4 text-white text-center">{selectedPhoto.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
