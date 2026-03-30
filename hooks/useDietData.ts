/**
 * useDietData Hook - Secure data access for diet follow-ups
 * 
 * Only authenticated users can access their own data
 * Automatically includes auth token via pb client
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getDietFollowUp, 
  saveDietFollowUp, 
  updateWeeklyData,
  saveProgress,
  getProgressByType,
  DietFollowUp,
  UserProgress,
  isAuthenticated,
} from '../services/pocketbase';

interface DietDataState {
  data: DietFollowUp | null;
  isLoading: boolean;
  error: string | null;
}

export function useDietData() {
  const [state, setState] = useState<DietDataState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!isAuthenticated()) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await getDietFollowUp();
      setState({
        data,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      setState({
        data: null,
        isLoading: false,
        error: err.message || 'Failed to load data',
      });
    }
  }, []);

  const saveData = useCallback(async (data: Partial<DietFollowUp>) => {
    if (!isAuthenticated()) {
      throw new Error('Authentication required');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const saved = await saveDietFollowUp(data);
      setState({
        data: saved,
        isLoading: false,
        error: null,
      });
      return saved;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to save data';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMsg,
      }));
      throw err;
    }
  }, []);

  const updateWeekly = useCallback(async (weekData: Record<string, any>) => {
    if (!isAuthenticated()) {
      throw new Error('Authentication required');
    }

    const success = await updateWeeklyData(weekData);
    if (success) {
      await fetchData(); // Refresh data after update
    }
    return success;
  }, [fetchData]);

  const saveUserProgress = useCallback(async (dataType: string, payload: Record<string, any>) => {
    if (!isAuthenticated()) {
      throw new Error('Authentication required');
    }

    return saveProgress(dataType, payload);
  }, []);

  const getUserProgress = useCallback(async (dataType: string): Promise<UserProgress[]> => {
    if (!isAuthenticated()) {
      return [];
    }

    return getProgressByType(dataType);
  }, []);

  // Auto-fetch on mount if authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      fetchData();
    }
  }, [fetchData]);

  return {
    ...state,
    fetchData,
    saveData,
    updateWeekly,
    saveUserProgress,
    getUserProgress,
  };
}
