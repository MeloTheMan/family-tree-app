'use client';

export function TreeLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50 animate-fadeIn">
      <div className="text-center">
        <div className="relative inline-block">
          <svg 
            className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <p className="text-gray-600 font-medium animate-pulse">
          Chargement de l'arbre généalogique...
        </p>
        <p className="text-gray-400 text-sm mt-2">
          Veuillez patienter
        </p>
      </div>
    </div>
  );
}

export function EmptyState({ onAddMember }: { onAddMember: () => void }) {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50 animate-fadeIn">
      <div className="text-center max-w-md px-4">
        <div className="mb-6 animate-slideUp">
          <svg 
            className="mx-auto h-16 w-16 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2 animate-slideUp" style={{ animationDelay: '0.1s' }}>
          Aucun membre
        </h3>
        <p className="text-gray-600 mb-6 animate-slideUp" style={{ animationDelay: '0.2s' }}>
          Commencez par ajouter des membres de votre famille pour construire votre arbre généalogique.
        </p>
        <button
          onClick={onAddMember}
          className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg animate-slideUp"
          style={{ animationDelay: '0.3s' }}
        >
          Ajouter le premier membre
        </button>
      </div>
    </div>
  );
}
