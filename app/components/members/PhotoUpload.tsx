'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { toast } from 'react-toastify';

interface PhotoUploadProps {
  onPhotoSelect: (file: File | null) => void;
  currentPhotoUrl?: string | null;
  error?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function PhotoUpload({ onPhotoSelect, currentPhotoUrl, error }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [validationError, setValidationError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return 'La photo doit faire moins de 5MB';
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Format accepté: JPEG, PNG, WEBP';
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      toast.error(error);
      return;
    }

    setValidationError('');
    
    // Simulate upload progress with smoother animation
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 50);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setTimeout(() => setUploadProgress(0), 500);
    };
    reader.readAsDataURL(file);

    onPhotoSelect(file);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemovePhoto = () => {
    setPreview(null);
    setValidationError('');
    setUploadProgress(0);
    onPhotoSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const displayError = error || validationError;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Photo
      </label>
      
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer
          transition-all duration-200
          ${isDragging ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg' : 'border-gray-300 hover:border-gray-400 hover:shadow-md'}
          ${displayError ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {preview ? (
          <div className="space-y-3 animate-fadeIn">
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Preview"
                className="max-h-40 sm:max-h-48 rounded-lg object-cover transition-all duration-300 hover:scale-105 shadow-md"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePhoto();
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
                aria-label="Supprimer la photo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 transition-opacity duration-200">
              Cliquez ou glissez pour remplacer
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className={`mx-auto h-10 sm:h-12 w-10 sm:w-12 text-gray-400 transition-all duration-200 ${
                isDragging ? 'scale-110 text-blue-500' : ''
              }`}
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200">
                Cliquez pour télécharger
              </span>
              {' '}ou glissez-déposez
            </div>
            <p className="text-xs text-gray-500">
              JPEG, PNG ou WEBP (max 5MB)
            </p>
          </div>
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-4 animate-slideDown">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Téléchargement... {uploadProgress}%
            </p>
          </div>
        )}
      </div>

      {displayError && (
        <p className="text-sm text-red-600 animate-slideDown">
          {displayError}
        </p>
      )}
    </div>
  );
}
