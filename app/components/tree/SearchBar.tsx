'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Member } from '@/lib/types';

interface SearchBarProps {
  members: Member[];
  onResultSelect: (memberId: string) => void;
  onClearHighlight: () => void;
}

export default function SearchBar({ members, onResultSelect, onClearHighlight }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Member[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Search members by name or last name
  const searchMembers = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentResultIndex(0);
      setIsSearching(false);
      onClearHighlight();
      return;
    }

    const normalizedQuery = query.toLowerCase().trim();
    const results = members.filter(member => {
      const fullName = `${member.name} ${member.last_name || ''}`.toLowerCase();
      const firstName = member.name.toLowerCase();
      const lastName = (member.last_name || '').toLowerCase();
      
      return fullName.includes(normalizedQuery) || 
             firstName.includes(normalizedQuery) || 
             lastName.includes(normalizedQuery);
    });

    setSearchResults(results);
    setCurrentResultIndex(0);
    setIsSearching(true);

    if (results.length > 0) {
      onResultSelect(results[0].id);
    } else {
      onClearHighlight();
    }
  }, [members, onResultSelect, onClearHighlight]);

  // Handle search input change (just update the input value)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Update suggestions as user types
    if (value.trim()) {
      const normalizedQuery = value.toLowerCase().trim();
      const filtered = members.filter(member => {
        const fullName = `${member.name} ${member.last_name || ''}`.toLowerCase();
        const firstName = member.name.toLowerCase();
        const lastName = (member.last_name || '').toLowerCase();
        
        return fullName.includes(normalizedQuery) || 
               firstName.includes(normalizedQuery) || 
               lastName.includes(normalizedQuery);
      }).slice(0, 8); // Limit to 8 suggestions

      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (member: Member) => {
    const fullName = `${member.name} ${member.last_name || ''}`.trim();
    setInputValue(fullName);
    setSearchQuery(fullName);
    setShowSuggestions(false);
    searchMembers(fullName);
  };

  // Handle Enter key to trigger search
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setSearchQuery(inputValue);
      searchMembers(inputValue);
    }
  };

  // Navigate to previous result
  const handlePrevious = useCallback(() => {
    if (searchResults.length === 0) return;
    
    const newIndex = currentResultIndex === 0 
      ? searchResults.length - 1 
      : currentResultIndex - 1;
    
    setCurrentResultIndex(newIndex);
    onResultSelect(searchResults[newIndex].id);
  }, [searchResults, currentResultIndex, onResultSelect]);

  // Navigate to next result
  const handleNext = useCallback(() => {
    if (searchResults.length === 0) return;
    
    const newIndex = currentResultIndex === searchResults.length - 1 
      ? 0 
      : currentResultIndex + 1;
    
    setCurrentResultIndex(newIndex);
    onResultSelect(searchResults[newIndex].id);
  }, [searchResults, currentResultIndex, onResultSelect]);

  // Clear search
  const handleClear = useCallback(() => {
    setSearchQuery('');
    setInputValue('');
    setSearchResults([]);
    setCurrentResultIndex(0);
    setIsSearching(false);
    setSuggestions([]);
    setShowSuggestions(false);
    onClearHighlight();
    inputRef.current?.focus();
  }, [onClearHighlight]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // Escape to clear search
      if (e.key === 'Escape' && isSearching) {
        handleClear();
      }
      
      // Arrow keys to navigate results (only when search is active)
      if (isSearching && searchResults.length > 0) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          handleNext();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrevious();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearching, searchResults, handleNext, handlePrevious, handleClear]);

  const hasMultipleResults = searchResults.length > 1;
  const hasResults = searchResults.length > 0;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-md px-4">
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-300 overflow-hidden">
        <div className="flex items-center">
          {/* Search Icon */}
          <div className="pl-4 pr-2">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleSearchChange}
            onKeyPress={handleKeyPress}
            placeholder="Rechercher un membre... (Entrée pour rechercher)"
            className="flex-1 py-3 px-2 text-gray-900 placeholder-gray-400 focus:outline-none"
          />

          {/* Results Counter */}
          {isSearching && (
            <div className="px-3 text-sm text-gray-600 whitespace-nowrap">
              {hasResults ? (
                <span>
                  {currentResultIndex + 1} / {searchResults.length}
                </span>
              ) : (
                <span className="text-red-500">Aucun résultat</span>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center border-l border-gray-300">
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              disabled={!hasMultipleResults}
              className={`p-3 transition-colors ${
                hasMultipleResults
                  ? 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              aria-label="Résultat précédent"
              title="Résultat précédent (↑)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={!hasMultipleResults}
              className={`p-3 transition-colors ${
                hasMultipleResults
                  ? 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              aria-label="Résultat suivant"
              title="Résultat suivant (↓)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Clear Button */}
          {inputValue && (
            <button
              onClick={handleClear}
              className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors border-l border-gray-300"
              aria-label="Effacer la recherche"
              title="Effacer (Esc)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="border-t border-gray-200 max-h-64 overflow-y-auto"
          >
            {suggestions.map((member) => (
              <button
                key={member.id}
                onClick={() => handleSuggestionClick(member)}
                className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors flex items-center gap-2 border-b border-gray-100 last:border-b-0"
              >
                <svg
                  className="w-4 h-4 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-gray-900">
                  {member.name} {member.last_name || ''}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
