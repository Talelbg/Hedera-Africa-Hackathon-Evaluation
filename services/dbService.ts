// services/dbService.ts
import { Project, Judge, Criterion, Score } from '../types';
import { MOCK_PROJECTS, MOCK_JUDGES, MOCK_CRITERIA, MOCK_SCORES } from '../data/mockData';

interface DBState {
  projects: Project[];
  judges: Judge[];
  criteria: Criterion[];
  scores: Score[];
}

const DB_KEY = 'hah_evaluation_platform_db';

// --- Internal "Mock Database" Functions ---

const writeDB = (db: DBState): void => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch(e) {
      console.error("Failed to write to localStorage", e);
  }
};

const initializeDB = (): DBState => {
  const initialState: DBState = {
    projects: MOCK_PROJECTS,
    judges: MOCK_JUDGES,
    criteria: MOCK_CRITERIA,
    scores: MOCK_SCORES,
  };
  writeDB(initialState);
  return initialState;
};

const readDB = (): DBState => {
  try {
    const serializedState = localStorage.getItem(DB_KEY);
    if (!serializedState) {
        console.log("No data found in localStorage. Initializing with mock data.");
        return initializeDB();
    }
    const db = JSON.parse(serializedState);
    // A simple check to ensure the data structure is not completely broken
    if (!db.projects || !db.judges || !db.criteria || !db.scores) {
        console.warn("Data in localStorage is corrupted. Re-initializing with mock data.");
        return initializeDB();
    }
    return db;
  } catch (e) {
    console.error("Failed to read from localStorage, re-initializing with mock data.", e);
    return initializeDB();
  }
};


// --- Simulated API Service Layer ---
// Each function simulates a network request with a short delay.

const simulateApi = <T>(data: T): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(data), 50));


// --- Public API ---

export const getAllData = async (): Promise<DBState> => {
    const db = readDB();
    return simulateApi(db);
};

// Project API
export const createProjects = async (newProjects: Project[]): Promise<Project[]> => {
    const db = readDB();
    db.projects.push(...newProjects);
    writeDB(db);
    return simulateApi(newProjects);
};

export const updateProject = async (updatedProject: Project): Promise<Project> => {
    const db = readDB();
    db.projects = db.projects.map(p => p.id === updatedProject.id ? updatedProject : p);
    writeDB(db);
    return simulateApi(updatedProject);
};

export const deleteProject = async (projectId: string): Promise<{ success: boolean }> => {
    const db = readDB();
    db.projects = db.projects.filter(p => p.id !== projectId);
    db.scores = db.scores.filter(s => s.projectId !== projectId); // Cascade delete
    writeDB(db);
    return simulateApi({ success: true });
};

// Judge API
export const createJudge = async (newJudgeData: Omit<Judge, 'id'>): Promise<Judge> => {
    const db = readDB();
    const newJudge = { ...newJudgeData, id: `j_${Date.now()}` };
    db.judges.push(newJudge);
    writeDB(db);
    return simulateApi(newJudge);
};

export const updateJudge = async (updatedJudge: Judge): Promise<Judge> => {
    const db = readDB();
    db.judges = db.judges.map(j => j.id === updatedJudge.id ? updatedJudge : j);
    writeDB(db);
    return simulateApi(updatedJudge);
};

export const deleteJudge = async (judgeId: string): Promise<{ success: boolean }> => {
    const db = readDB();
    db.judges = db.judges.filter(j => j.id !== judgeId);
    db.scores = db.scores.filter(s => s.judgeId !== judgeId); // Cascade delete
    writeDB(db);
    return simulateApi({ success: true });
};

// Criterion API
export const createCriterion = async (newCriterionData: Omit<Criterion, 'id'>): Promise<Criterion> => {
    const db = readDB();
    const newCriterion = { ...newCriterionData, id: `c_${Date.now()}` };
    db.criteria.push(newCriterion);
    writeDB(db);
    return simulateApi(newCriterion);
};

export const updateCriterion = async (updatedCriterion: Criterion): Promise<Criterion> => {
    const db = readDB();
    db.criteria = db.criteria.map(c => c.id === updatedCriterion.id ? updatedCriterion : c);
    writeDB(db);
    return simulateApi(updatedCriterion);
};

export const deleteCriterion = async (criterionId: string): Promise<{ success: boolean }> => {
    const db = readDB();
    db.criteria = db.criteria.filter(c => c.id !== criterionId);
    writeDB(db);
    return simulateApi({ success: true });
};


// Score API
export const createOrUpdateScore = async (score: Score): Promise<Score> => {
    const db = readDB();
    const index = db.scores.findIndex(s => s.id === score.id);
    if (index > -1) {
        db.scores[index] = score;
    } else {
        db.scores.push(score);
    }
    writeDB(db);
    return simulateApi(score);
};

export const deleteScore = async (scoreId: string): Promise<{ success: boolean }> => {
    const db = readDB();
    db.scores = db.scores.filter(s => s.id !== scoreId);
    writeDB(db);
    return simulateApi({ success: true });
};
