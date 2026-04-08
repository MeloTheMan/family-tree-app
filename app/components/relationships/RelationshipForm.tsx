'use client';

import { useState, FormEvent, useEffect } from 'react';
import { z } from 'zod';
import { Member, RelationshipFormData } from '@/lib/types';
import { RelationshipSchema } from '@/lib/validations';

interface RelationshipFormProps {
  members: Member[];
  selectedMemberId?: string;
  onSubmit: (data: RelationshipFormData) => Promise<void>;
  onCancel: () => void;
}

interface FormErrors {
  member_id?: string;
  related_member_id?: string;
  relationship_type?: string;
}

export default function RelationshipForm({ 
  members, 
  selectedMemberId, 
  onSubmit, 
  onCancel 
}: RelationshipFormProps) {
  const [formData, setFormData] = useState<RelationshipFormData>({
    member_id: selectedMemberId || '',
    related_member_id: '',
    relationship_type: 'parent',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when selectedMemberId changes
  useEffect(() => {
    if (selectedMemberId) {
      setFormData(prev => ({
        ...prev,
        member_id: selectedMemberId,
      }));
    }
  }, [selectedMemberId]);

  const handleMemberChange = (field: 'member_id' | 'related_member_id', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error for this field when user makes a selection
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleRelationshipTypeChange = (value: 'parent' | 'child' | 'spouse') => {
    setFormData(prev => ({
      ...prev,
      relationship_type: value,
    }));
    
    // Clear error when user makes a selection
    if (errors.relationship_type) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.relationship_type;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    try {
      RelationshipSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.issues.forEach((err) => {
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
        {/* First member selection */}
        <div>
          <label htmlFor="member_id" className="block text-sm font-medium text-gray-700">
            Premier membre <span className="text-red-500">*</span>
          </label>
          <select
            id="member_id"
            value={formData.member_id}
            onChange={(e) => handleMemberChange('member_id', e.target.value)}
            className={`
              mt-1 block w-full rounded-md shadow-sm
              ${errors.member_id 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }
              px-3 py-2 border
            `}
            disabled={isSubmitting}
          >
            <option value="">Sélectionnez un membre</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          {errors.member_id && (
            <p className="mt-1 text-sm text-red-600">
              {errors.member_id}
            </p>
          )}
        </div>

        {/* Relationship type selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de relation <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="relationship_type"
                value="parent"
                checked={formData.relationship_type === 'parent'}
                onChange={(e) => handleRelationshipTypeChange(e.target.value as 'parent')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                disabled={isSubmitting}
              />
              <span className="ml-2 text-sm text-gray-700">
                Parent (le premier membre est parent du second)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="relationship_type"
                value="child"
                checked={formData.relationship_type === 'child'}
                onChange={(e) => handleRelationshipTypeChange(e.target.value as 'child')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                disabled={isSubmitting}
              />
              <span className="ml-2 text-sm text-gray-700">
                Enfant (le premier membre est enfant du second)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="relationship_type"
                value="spouse"
                checked={formData.relationship_type === 'spouse'}
                onChange={(e) => handleRelationshipTypeChange(e.target.value as 'spouse')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                disabled={isSubmitting}
              />
              <span className="ml-2 text-sm text-gray-700">
                Conjoint (les deux membres sont conjoints)
              </span>
            </label>
          </div>
          {errors.relationship_type && (
            <p className="mt-1 text-sm text-red-600">
              {errors.relationship_type}
            </p>
          )}
        </div>

        {/* Second member selection */}
        <div>
          <label htmlFor="related_member_id" className="block text-sm font-medium text-gray-700">
            Second membre <span className="text-red-500">*</span>
          </label>
          <select
            id="related_member_id"
            value={formData.related_member_id}
            onChange={(e) => handleMemberChange('related_member_id', e.target.value)}
            className={`
              mt-1 block w-full rounded-md shadow-sm
              ${errors.related_member_id 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }
              px-3 py-2 border
            `}
            disabled={isSubmitting}
          >
            <option value="">Sélectionnez un membre</option>
            {members
              .filter(member => member.id !== formData.member_id)
              .map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
          </select>
          {errors.related_member_id && (
            <p className="mt-1 text-sm text-red-600">
              {errors.related_member_id}
            </p>
          )}
        </div>
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
              Création...
            </span>
          ) : (
            'Créer la relation'
          )}
        </button>
      </div>
    </form>
  );
}
