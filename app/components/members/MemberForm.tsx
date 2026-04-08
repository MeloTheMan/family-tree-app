'use client';

import { useState, FormEvent, useEffect } from 'react';
import { z } from 'zod';
import PhotoUpload from './PhotoUpload';
import { Member, MemberFormData } from '@/lib/types';
import { MemberSchema } from '@/lib/validations';

interface MemberFormProps {
  member?: Member;
  onSubmit: (data: MemberFormData) => Promise<void>;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  birth_date?: string;
  birthplace?: string;
  photo?: string;
}

export default function MemberForm({ member, onSubmit, onCancel }: MemberFormProps) {
  const isEditMode = !!member;
  
  const [formData, setFormData] = useState<MemberFormData>({
    name: member?.name || '',
    birth_date: member?.birth_date || null,
    birthplace: member?.birthplace || null,
    photo: undefined,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when member prop changes
  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        birth_date: member.birth_date,
        birthplace: member.birthplace,
        photo: undefined,
      });
    }
  }, [member]);

  const handleInputChange = (field: keyof MemberFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || null,
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePhotoSelect = (file: File | null) => {
    setFormData(prev => ({
      ...prev,
      photo: file || undefined,
    }));
    
    // Clear photo error when user selects a new photo
    if (errors.photo) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.photo;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    try {
      MemberSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.issues.forEach((err: z.ZodIssue) => {
          const field = err.path[0] as keyof FormErrors;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Name field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`
              mt-1 block w-full rounded-md shadow-sm
              ${errors.name 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }
              px-3 py-2 border
            `}
            placeholder="Entrez le nom complet"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">
              {errors.name}
            </p>
          )}
        </div>

        {/* Birth date field */}
        <div>
          <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
            Date de naissance
          </label>
          <input
            type="date"
            id="birth_date"
            value={formData.birth_date || ''}
            onChange={(e) => handleInputChange('birth_date', e.target.value)}
            className={`
              mt-1 block w-full rounded-md shadow-sm
              ${errors.birth_date 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }
              px-3 py-2 border
            `}
            disabled={isSubmitting}
          />
          {errors.birth_date && (
            <p className="mt-1 text-sm text-red-600">
              {errors.birth_date}
            </p>
          )}
        </div>

        {/* Birthplace field */}
        <div>
          <label htmlFor="birthplace" className="block text-sm font-medium text-gray-700">
            Lieu de naissance
          </label>
          <input
            type="text"
            id="birthplace"
            value={formData.birthplace || ''}
            onChange={(e) => handleInputChange('birthplace', e.target.value)}
            className={`
              mt-1 block w-full rounded-md shadow-sm
              ${errors.birthplace 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }
              px-3 py-2 border
            `}
            placeholder="Entrez le lieu de naissance"
            disabled={isSubmitting}
          />
          {errors.birthplace && (
            <p className="mt-1 text-sm text-red-600">
              {errors.birthplace}
            </p>
          )}
        </div>

        {/* Photo upload */}
        <PhotoUpload
          onPhotoSelect={handlePhotoSelect}
          currentPhotoUrl={member?.photo_url}
          error={errors.photo}
        />
      </div>

      {/* Form actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enregistrement...
            </span>
          ) : (
            isEditMode ? 'Mettre à jour' : 'Créer'
          )}
        </button>
      </div>
    </form>
  );
}
