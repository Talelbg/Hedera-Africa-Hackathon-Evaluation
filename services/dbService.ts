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

// In-memory cache for the database state to reduce localStorage reads.
let dbCache: DBState | null = null;

// --- Internal "Mock Database" Functions ---

const writeDB = (db: DBState): void => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    dbCache = db; // Update the in-memory cache on write.
  } catch(e) {
      console.error("Failed to write to localStorage", e);
  }
};

const readDB = (): DBState => {
  // Return from cache if available.
  if (dbCache) {
    return dbCache;
  }

  try {
    const serializedState = localStorage.getItem(DB_KEY);
    if (serializedState) {
        const db = JSON.parse(serializedState);
        // A simple check to ensure the data structure is valid.
        if (db.projects && db.judges && db.criteria && db.scores) {
            dbCache = db; // Prime the cache.
            return db;
        }
        console.warn("Data in localStorage is corrupted. Re-initializing with mock data.");
    }
  } catch (e) {
    console.error("Failed to read from localStorage.", e);
  }

  // If we reach here, there's no valid data in localStorage.
  // Initialize with mock data.
  console.log("No valid data found in localStorage. Initializing with mock data.");
  const initialState: DBState = {
    projects: MOCK_PROJECTS,
    judges: MOCK_JUDGES,
    criteria: MOCK_CRITERIA,
    scores: MOCK_SCORES,
  };
  writeDB(initialState); // This will also populate the cache.
  return initialState;
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
    // Create new unique IDs for imported projects to avoid conflicts
    const projectsWithIds = newProjects.map((p, index) => ({
        ...p,
        id: `p_${Date.now()}_${index}`,
    }));
    db.projects.push(...projectsWithIds);
    writeDB(db);
    return simulateApi(projectsWithIds);
};

export const updateProject = async (updatedProject: Project): Promise<Project> => {
    const db = readDB();
    const index = db.projects.findIndex(p => p.id === updatedProject.id);
    if (index !== -1) {
        db.projects[index] = updatedProject;
        writeDB(db);
    }
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
    const index = db.judges.findIndex(j => j.id === updatedJudge.id);
    if (index !== -1) {
        db.judges[index] = updatedJudge;
        writeDB(db);
    }
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
    const index = db.criteria.findIndex(c => c.id === updatedCriterion.id);
    if (index !== -1) {
        db.criteria[index] = updatedCriterion;
        writeDB(db);
    }
    return simulateApi(updatedCriterion);
};

export const deleteCriterion = async (criterionId: string): Promise<{ success: boolean }> => {
    const db = readDB();
    db.criteria = db.criteria.filter(c => c.id !== criterionId);
    // Note: Deleting a criterion doesn't remove scores based on it to preserve history,
    // but the scores will be ignored in calculations since the criterion is gone.
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
