'use client';

import Image from 'next/image';
import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Member } from '@/lib/types';

interface MemberNodeData extends Member {
  isSelected?: boolean;
  onClick?: () => void;
}

interface MemberNodeProps {
  data: MemberNodeData;
}

function MemberNode({ data }: MemberNodeProps) {
  const { isSelected = false, onClick, ...memberData } = data;
  const [imageLoading, setImageLoading] = useState(true);
  
  return (
    <div
      onClick={onClick}
      className={`
        w-40 sm:w-48 rounded-lg border-2 bg-white shadow-md transition-all duration-200 cursor-pointer
        hover:shadow-xl hover:scale-105 active:scale-95 relative z-10
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-300 shadow-lg' : 'border-gray-300'}
      `}
    >
      {/* Connection handles for edges - positioned outside the node border */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-blue-500 !w-3 !h-3 !-top-1.5 !border-2 !border-white" 
        style={{ zIndex: 1 }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!bg-blue-500 !w-3 !h-3 !-bottom-1.5 !border-2 !border-white" 
        style={{ zIndex: 1 }}
      />
      <Handle 
        type="source" 
        position={Position.Left} 
        className="!bg-green-500 !w-3 !h-3 !-left-1.5 !border-2 !border-white" 
        style={{ zIndex: 1 }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!bg-green-500 !w-3 !h-3 !-right-1.5 !border-2 !border-white" 
        style={{ zIndex: 1 }}
      />
      
      {/* Photo Section */}
      <div className="relative h-24 sm:h-32 w-full overflow-hidden rounded-t-lg bg-gray-100">
        {memberData.photo_url ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="animate-pulse">
                  <svg
                    className="h-12 sm:h-16 w-12 sm:w-16 text-gray-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              </div>
            )}
            <Image
              src={memberData.photo_url}
              alt={memberData.name}
              fill
              className={`object-cover transition-all duration-300 hover:scale-110 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              sizes="(max-width: 640px) 160px, 192px"
              priority={false}
              loading="lazy"
              onLoad={() => setImageLoading(false)}
              quality={75}
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg
              className="h-12 sm:h-16 w-12 sm:w-16 text-gray-400 transition-colors duration-200"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Name Section */}
      <div className="p-2 sm:p-3">
        <h3 className="text-center font-semibold text-gray-900 truncate text-sm sm:text-base transition-colors duration-200">
          {memberData.name}
        </h3>
        {memberData.birth_date && (
          <p className="text-center text-xs text-gray-500 mt-1 transition-colors duration-200">
            {new Date(memberData.birth_date).getFullYear()}
          </p>
        )}
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(MemberNode);
