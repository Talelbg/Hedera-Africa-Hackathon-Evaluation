// services/dbService.ts
import { Project, Judge, Criterion, Score } from '../types';

interface DBState {
  projects: Project[];
  judges: Judge[];
  criteria: Criterion[];
  scores: Score[];
}

const DB_KEY = 'hah_evaluation_platform_db';

const getInitialState = (): DBState => ({
  projects: [],
  judges: [],
  criteria: [],
  scores: [],
});

export const loadDatabase = (): DBState => {
  try {
    const serializedState = localStorage.getItem(DB_KEY);
    if (serializedState === null) {
      return getInitialState();
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Could not load state from localStorage", err);
    return getInitialState();
  }
};

export const saveDatabase = (state: DBState): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(DB_KEY, serializedState);
  } catch (err) {
    console.error("Could not save state to localStorage", err);
  }
};
