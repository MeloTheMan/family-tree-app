'use client';

import { MemberWithRelationships, Member, Relationship } from '@/lib/types';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { calculateRelationship } from '@/lib/utils/relationship-calculator';
import PhotoGallery from './PhotoGallery';

interface MemberDetailProps {
  member: MemberWithRelationships;
  onEdit: () => void;
  onClose: () => void;
  readOnly?: boolean;
  currentUserMemberId?: string | null;
  allMembers?: Member[];
  allRelationships?: Relationship[];
}

export default function MemberDetail({ 
  member, 
  onEdit, 
  onClose, 
  readOnly = false,
  currentUserMemberId,
  allMembers = [],
  allRelationships = []
}: MemberDetailProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [imageLoading, setImageLoading] = useState(true);

  // Calculate relationship if user is viewing
  const relationshipLabel = currentUserMemberId && allMembers.length > 0 && allRelationships.length > 0
    ? calculateRelationship(currentUserMemberId, member.id, allMembers, allRelationships)
    : null;

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    // Add escape key handler
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non spécifié';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div
        ref={panelRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp"
      >
        {/* Header with close button */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Détails du membre</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 hover:scale-110 active:scale-95"
            aria-label="Fermer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Member information */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 mb-6">
            {/* Photo */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              {member.photo_url ? (
                <div className="relative w-40 h-40 sm:w-48 sm:h-48">
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-lg">
                      <div className="animate-pulse">
                        <svg className="w-16 sm:w-20 h-16 sm:h-20 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <Image
                    src={member.photo_url}
                    alt={member.name}
                    width={200}
                    height={200}
                    className={`rounded-lg object-cover w-40 h-40 sm:w-48 sm:h-48 transition-all duration-300 hover:scale-105 ${
                      imageLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                    priority
                    onLoad={() => setImageLoading(false)}
                    quality={85}
                  />
                </div>
              ) : (
                <div className="w-40 h-40 sm:w-48 sm:h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                  <svg className="w-16 sm:w-20 h-16 sm:h-20 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            {/* Basic information */}
            <div className="flex-1 animate-slideInRight">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{member.name}</h3>
              <p className="text-xl sm:text-2xl text-gray-700 mb-4">{member.last_name}</p>
              
              <div className="space-y-3">
                <div className="transition-all duration-200 hover:translate-x-1">
                  <span className="text-sm font-medium text-gray-500">Date de naissance</span>
                  <p className="text-base sm:text-lg text-gray-900">{formatDate(member.birth_date)}</p>
                </div>
                
                {member.age !== null && (
                  <div className="transition-all duration-200 hover:translate-x-1">
                    <span className="text-sm font-medium text-gray-500">Âge</span>
                    <p className="text-base sm:text-lg text-gray-900">{member.age} ans</p>
                  </div>
                )}
                
                <div className="transition-all duration-200 hover:translate-x-1">
                  <span className="text-sm font-medium text-gray-500">Lieu de naissance</span>
                  <p className="text-base sm:text-lg text-gray-900">{member.birthplace || 'Non spécifié'}</p>
                </div>
                
                <div className="transition-all duration-200 hover:translate-x-1">
                  <span className="text-sm font-medium text-gray-500">Profession</span>
                  <p className="text-base sm:text-lg text-gray-900">{member.work || 'Non spécifié'}</p>
                </div>
              </div>

              {!readOnly && (
                <button
                  onClick={onEdit}
                  className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 w-full sm:w-auto justify-center hover:scale-105 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Modifier
                </button>
              )}
            </div>
          </div>

          {/* Relationships section */}
          <div className="border-t border-gray-200 pt-6 space-y-6">
            <div>
              <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Relations familiales</h4>
            
            {relationshipLabel ? (
              // For users: show calculated relationship
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Lien de parenté</p>
                    <p className="text-xl font-bold text-blue-700">{relationshipLabel}</p>
                  </div>
                </div>
              </div>
            ) : (
              // For admin: show detailed relationships list
              <div className="space-y-4">
                {/* Parents */}
                {member.parents.length > 0 && (
                  <div className="animate-slideInRight" style={{ animationDelay: '0.1s' }}>
                    <h5 className="text-sm font-medium text-gray-500 mb-2">
                      Parents ({member.parents.length})
                    </h5>
                    <ul className="space-y-2">
                      {member.parents.map((parent, index) => (
                        <li 
                          key={parent.id} 
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:translate-x-1"
                          style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                        >
                          {parent.photo_url ? (
                            <Image
                              src={parent.photo_url}
                              alt={parent.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover w-10 h-10"
                              loading="lazy"
                              quality={70}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          <span className="text-gray-900 font-medium">{parent.name} {parent.last_name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Children */}
                {member.children.length > 0 && (
                  <div className="animate-slideInRight" style={{ animationDelay: '0.2s' }}>
                    <h5 className="text-sm font-medium text-gray-500 mb-2">
                      Enfants ({member.children.length})
                    </h5>
                    <ul className="space-y-2">
                      {member.children.map((child, index) => (
                        <li 
                          key={child.id} 
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:translate-x-1"
                          style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                        >
                          {child.photo_url ? (
                            <Image
                              src={child.photo_url}
                              alt={child.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover w-10 h-10"
                              loading="lazy"
                              quality={70}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          <span className="text-gray-900 font-medium">{child.name} {child.last_name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Spouses */}
                {member.spouses.length > 0 && (
                  <div className="animate-slideInRight" style={{ animationDelay: '0.3s' }}>
                    <h5 className="text-sm font-medium text-gray-500 mb-2">
                      Conjoints ({member.spouses.length})
                    </h5>
                    <ul className="space-y-2">
                      {member.spouses.map((spouse, index) => (
                        <li 
                          key={spouse.id} 
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:translate-x-1"
                          style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                        >
                          {spouse.photo_url ? (
                            <Image
                              src={spouse.photo_url}
                              alt={spouse.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover w-10 h-10"
                              loading="lazy"
                              quality={70}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          <span className="text-gray-900 font-medium">{spouse.name} {spouse.last_name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* No relationships message */}
                {member.parents.length === 0 && member.children.length === 0 && member.spouses.length === 0 && (
                  <p className="text-gray-500 text-center py-4 animate-fadeIn">Aucune relation familiale enregistrée</p>
                )}
              </div>
            )}
            </div>

            {/* Photo Gallery Section */}
            <div className="border-t border-gray-200 pt-6">
              <PhotoGallery memberId={member.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
