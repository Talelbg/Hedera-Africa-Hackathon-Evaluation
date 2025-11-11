import { useEffect, useCallback, useRef } from 'react';
import * as dbService from '../services/dbService';
import { Project, Judge, Criterion, Score } from '../types';

type DataRefreshCallback = {
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setJudges: React.Dispatch<React.SetStateAction<Judge[]>>;
  setCriteria: React.Dispatch<React.SetStateAction<Criterion[]>>;
  setScores: React.Dispatch<React.SetStateAction<Score[]>>;
};

const DATA_REFRESH_EVENT = 'platform-data-refresh';

export const useDataRefresh = (callbacks: DataRefreshCallback) => {
  const refreshInProgress = useRef(false);

  const refreshAllData = useCallback(async () => {
    if (refreshInProgress.current) return;
    
    refreshInProgress.current = true;
    try {
      const data = await dbService.getAllData();
      callbacks.setProjects(data.projects);
      callbacks.setJudges(data.judges);
      callbacks.setCriteria(data.criteria);
      callbacks.setScores(data.scores);
    } finally {
      refreshInProgress.current = false;
    }
  }, [callbacks]);

  useEffect(() => {
    window.addEventListener(DATA_REFRESH_EVENT, refreshAllData);
    return () => window.removeEventListener(DATA_REFRESH_EVENT, refreshAllData);
  }, [refreshAllData]);

  return { refreshAllData };
};

export const triggerDataRefresh = () => {
  window.dispatchEvent(new Event(DATA_REFRESH_EVENT));
};
