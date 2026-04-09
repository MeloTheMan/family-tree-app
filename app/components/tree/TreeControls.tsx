'use client';

import { useReactFlow } from '@xyflow/react';

interface TreeControlsProps {
  onResetLayout?: () => void;
}

export default function TreeControls({ onResetLayout }: TreeControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const handleZoomIn = () => {
    zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 300 });
  };

  const handleResetView = () => {
    fitView({ duration: 300, padding: 0.2 });
  };

  const handleResetLayout = () => {
    if (onResetLayout) {
      onResetLayout();
    }
  };

  return (
    <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 z-10 flex flex-col gap-2">
      {/* Zoom In Button */}
      <button
        onClick={handleZoomIn}
        className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg border-2 border-gray-300 bg-white shadow-md transition-all duration-200 hover:border-blue-500 hover:shadow-lg hover:scale-110 active:scale-95"
        aria-label="Zoom in"
        title="Zoom in"
      >
        <svg
          className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Zoom Out Button */}
      <button
        onClick={handleZoomOut}
        className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg border-2 border-gray-300 bg-white shadow-md transition-all duration-200 hover:border-blue-500 hover:shadow-lg hover:scale-110 active:scale-95"
        aria-label="Zoom out"
        title="Zoom out"
      >
        <svg
          className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 12H4"
          />
        </svg>
      </button>

      {/* Reset View Button */}
      <button
        onClick={handleResetView}
        className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg border-2 border-gray-300 bg-white shadow-md transition-all duration-200 hover:border-blue-500 hover:shadow-lg hover:scale-110 active:scale-95"
        aria-label="Reset view"
        title="Reset view"
      >
        <svg
          className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>

      {/* Reset Layout Button */}
      {onResetLayout && (
        <button
          onClick={handleResetLayout}
          className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg border-2 border-gray-300 bg-white shadow-md transition-all duration-200 hover:border-orange-500 hover:shadow-lg hover:scale-110 active:scale-95"
          aria-label="Reset layout to default"
          title="Reset layout to default"
        >
          <svg
            className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
