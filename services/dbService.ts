// services/dbService.ts
import { Project, Judge, Criterion, Score } from '../types';
import { MOCK_PROJECTS, MOCK_JUDGES, MOCK_CRITERIA, MOCK_SCORES } from '../data/mockData';

interface DBState {
  projects: Project[];
  judges: Judge[];
  criteria: Criterion[];
  scores: Score[];
}

const DB_KEY = 'HAH_EVAL_DB';

// Initialize the database from localStorage or mock data
const initializeDB = (): DBState => {
  const storedDB = localStorage.getItem(DB_KEY);
  if (storedDB) {
    try {
      // Basic validation to ensure stored data has the expected structure
      const parsed = JSON.parse(storedDB);
      if (parsed.projects && parsed.judges && parsed.criteria && parsed.scores) {
        return parsed;
      }
    } catch (e) {
      console.error("Failed to parse DB from localStorage, resetting.", e);
    }
  }

  // If no valid DB in localStorage, initialize with mock data
  const mockDB: DBState = {
    projects: MOCK_PROJECTS,
    judges: MOCK_JUDGES,
    criteria: MOCK_CRITERIA,
    scores: MOCK_SCORES,
  };
  localStorage.setItem(DB_KEY, JSON.stringify(mockDB));
  return mockDB;
};

// --- DB Accessor Functions ---

const getDB = (): DBState => {
  // Always read from storage to ensure we have the latest data if app is open in multiple tabs.
  const storedDB = localStorage.getItem(DB_KEY);
  if (storedDB) {
      return JSON.parse(storedDB);
  }
  return initializeDB();
};

const saveDB = (db: DBState): void => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// --- Public API ---

export const getAllData = async (): Promise<DBState> => {
  return Promise.resolve(getDB());
};

// Project API
export const createProjects = async (newProjectsData: Omit<Project, 'id'>[]): Promise<Project[]> => {
  const db = getDB();
  const createdProjects: Project[] = newProjectsData.map((p, i) => ({ ...p, id: `p_imported_${Date.now()}_${i}`}));
  db.projects.push(...createdProjects);
  saveDB(db);
  return Promise.resolve(createdProjects);
};

export const updateProject = async (updatedProject: Project): Promise<Project> => {
  const db = getDB();
  const index = db.projects.findIndex(p => p.id === updatedProject.id);
  if (index !== -1) {
    db.projects[index] = updatedProject;
    saveDB(db);
    return Promise.resolve(updatedProject);
  }
  throw new Error("Project not found");
};

export const deleteProject = async (projectId: string): Promise<{ success: boolean }> => {
  const db = getDB();
  db.projects = db.projects.filter(p => p.id !== projectId);
  // Also delete associated scores
  db.scores = db.scores.filter(s => s.projectId !== projectId);
  saveDB(db);
  return Promise.resolve({ success: true });
};

// Judge API
export const createJudge = async (newJudgeData: Omit<Judge, 'id'>): Promise<Judge> => {
  const db = getDB();
  const newJudge: Judge = {
    id: `j_${Date.now()}`,
    ...newJudgeData,
  };
  db.judges.push(newJudge);
  saveDB(db);
  return Promise.resolve(newJudge);
};

export const updateJudge = async (updatedJudge: Judge): Promise<Judge> => {
  const db = getDB();
  const index = db.judges.findIndex(j => j.id === updatedJudge.id);
  if (index !== -1) {
    db.judges[index] = updatedJudge;
    saveDB(db);
    return Promise.resolve(updatedJudge);
  }
  throw new Error("Judge not found");
};

export const deleteJudge = async (judgeId: string): Promise<{ success: boolean }> => {
  const db = getDB();
  db.judges = db.judges.filter(j => j.id !== judgeId);
  // Also delete associated scores
  db.scores = db.scores.filter(s => s.judgeId !== judgeId);
  saveDB(db);
  return Promise.resolve({ success: true });
};

// Criterion API
export const createCriterion = async (newCriterionData: Omit<Criterion, 'id'>): Promise<Criterion> => {
  const db = getDB();
  const newCriterion: Criterion = {
    id: `c_${Date.now()}`,
    ...newCriterionData,
  };
  db.criteria.push(newCriterion);
  saveDB(db);
  return Promise.resolve(newCriterion);
};

export const updateCriterion = async (updatedCriterion: Criterion): Promise<Criterion> => {
  const db = getDB();
  const index = db.criteria.findIndex(c => c.id === updatedCriterion.id);
  if (index !== -1) {
    db.criteria[index] = updatedCriterion;
    saveDB(db);
    return Promise.resolve(updatedCriterion);
  }
  throw new Error("Criterion not found");
};

export const deleteCriterion = async (criterionId: string): Promise<{ success: boolean }> => {
  const db = getDB();
  db.criteria = db.criteria.filter(c => c.id !== criterionId);
  saveDB(db);
  return Promise.resolve({ success: true });
};

// Score API
export const createOrUpdateScore = async (score: Score): Promise<Score> => {
  const db = getDB();
  const index = db.scores.findIndex(s => s.id === score.id);
  if (index !== -1) {
    db.scores[index] = score;
  } else {
    db.scores.push(score);
  }
  saveDB(db);
  return Promise.resolve(score);
};

export const deleteScore = async (scoreId: string): Promise<{ success: boolean }> => {
  const db = getDB();
  db.scores = db.scores.filter(s => s.id !== scoreId);
  saveDB(db);
  return Promise.resolve({ success: true });
};
