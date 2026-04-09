import { useState, useEffect, useCallback } from 'react';
import { MemberPosition } from '@/lib/types';

export function usePositions() {
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch positions from API
  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/positions');
      const result = await response.json();

      if (result.success && result.data) {
        const posMap = new Map<string, { x: number; y: number }>();
        result.data.forEach((pos: MemberPosition) => {
          posMap.set(pos.member_id, {
            x: pos.position_x,
            y: pos.position_y,
          });
        });
        setPositions(posMap);
      }
    } catch (err) {
      console.error('Error fetching positions:', err);
      setError('Failed to load positions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save positions to API
  const savePositions = useCallback(async (positionsMap: Map<string, { x: number; y: number }>) => {
    try {
      const positionsArray = Array.from(positionsMap.entries()).map(([member_id, pos]) => ({
        member_id,
        position_x: pos.x,
        position_y: pos.y,
      }));

      const response = await fetch('/api/positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ positions: positionsArray }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save positions');
      }

      setPositions(positionsMap);
    } catch (err) {
      console.error('Error saving positions:', err);
      setError('Failed to save positions');
      throw err;
    }
  }, []);

  // Load positions on mount
  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  return {
    positions,
    loading,
    error,
    savePositions,
    refetch: fetchPositions,
  };
}
