// services/dbService.ts
import { Project, Judge, Criterion, Score } from '../types';

interface DBState {
  projects: Project[];
  judges: Judge[];
  criteria: Criterion[];
  scores: Score[];
}

const DB_KEY = 'hah_evaluation_platform_db';

let dbCache: DBState | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 100;

const readDB = (): DBState => {
  const now = Date.now();
  if (dbCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return dbCache;
  }
  
  try {
    const serializedState = localStorage.getItem(DB_KEY);
    dbCache = serializedState ? JSON.parse(serializedState) : { projects: [], judges: [], criteria: [], scores: [] };
    cacheTimestamp = now;
    return dbCache;
  } catch (e) {
    dbCache = { projects: [], judges: [], criteria: [], scores: [] };
    return dbCache;
  }
};

const writeDB = (db: DBState): void => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  dbCache = db;
  cacheTimestamp = Date.now();
  window.dispatchEvent(new Event('platform-data-refresh'));
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
    const result = await simulateApi(newProjects);
    return result;
};

export const updateProject = async (updatedProject: Project): Promise<Project> => {
    const db = readDB();
    db.projects = db.projects.map(p => p.id === updatedProject.id ? updatedProject : p);
    writeDB(db);
    const result = await simulateApi(updatedProject);
    return result;
};

export const deleteProject = async (projectId: string): Promise<{ success: boolean }> => {
    const db = readDB();
    db.projects = db.projects.filter(p => p.id !== projectId);
    db.scores = db.scores.filter(s => s.projectId !== projectId);
    writeDB(db);
    const result = await simulateApi({ success: true });
    return result;
};

// Judge API
export const createJudge = async (newJudgeData: Omit<Judge, 'id'>): Promise<Judge> => {
    const db = readDB();
    const newJudge = { ...newJudgeData, id: `j_${Date.now()}` };
    db.judges.push(newJudge);
    writeDB(db);
    const result = await simulateApi(newJudge);
    return result;
};

export const updateJudge = async (updatedJudge: Judge): Promise<Judge> => {
    const db = readDB();
    db.judges = db.judges.map(j => j.id === updatedJudge.id ? updatedJudge : j);
    writeDB(db);
    const result = await simulateApi(updatedJudge);
    return result;
};

export const deleteJudge = async (judgeId: string): Promise<{ success: boolean }> => {
    const db = readDB();
    db.judges = db.judges.filter(j => j.id !== judgeId);
    db.scores = db.scores.filter(s => s.judgeId !== judgeId);
    writeDB(db);
    const result = await simulateApi({ success: true });
    return result;
};

// Criterion API
export const createCriterion = async (newCriterionData: Omit<Criterion, 'id'>): Promise<Criterion> => {
    const db = readDB();
    const newCriterion = { ...newCriterionData, id: `c_${Date.now()}` };
    db.criteria.push(newCriterion);
    writeDB(db);
    const result = await simulateApi(newCriterion);
    return result;
};

export const updateCriterion = async (updatedCriterion: Criterion): Promise<Criterion> => {
    const db = readDB();
    db.criteria = db.criteria.map(c => c.id === updatedCriterion.id ? updatedCriterion : c);
    writeDB(db);
    const result = await simulateApi(updatedCriterion);
    return result;
};

export const deleteCriterion = async (criterionId: string): Promise<{ success: boolean }> => {
    const db = readDB();
    db.criteria = db.criteria.filter(c => c.id !== criterionId);
    writeDB(db);
    const result = await simulateApi({ success: true });
    return result;
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
    const result = await simulateApi(score);
    return result;
};

export const deleteScore = async (scoreId: string): Promise<{ success: boolean }> => {
    const db = readDB();
    db.scores = db.scores.filter(s => s.id !== scoreId);
    writeDB(db);
    const result = await simulateApi({ success: true });
    return result;
};
