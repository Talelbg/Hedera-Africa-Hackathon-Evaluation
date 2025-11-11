import React, { useState, useMemo, useEffect } from 'react';
import { UserRole, Project, Judge, Criterion, Score, Track } from './types';
import { loadDatabase, saveDatabase } from './services/dbService';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import JudgeDashboard from './components/JudgeDashboard';
import Header from './components/Header';

const dbState = loadDatabase();

function App() {
  const [user, setUser] = useState<{ role: UserRole; id?: string } | null>(null);

  const [projects, setProjects] = useState<Project[]>(dbState.projects);
  const [judges, setJudges] = useState<Judge[]>(dbState.judges);
  const [criteria, setCriteria] = useState<Criterion[]>(dbState.criteria);
  const [scores, setScores] = useState<Score[]>(dbState.scores);

  useEffect(() => {
    saveDatabase({ projects, judges, criteria, scores });
  }, [projects, judges, criteria, scores]);


  // --- Admin Handlers ---
  const addProjects = (newProjects: Project[]) => setProjects(prev => [...prev, ...newProjects]);
  const editProject = (updatedProject: Project) => setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setScores(prev => prev.filter(s => s.projectId !== projectId)); // Also delete associated scores
  };

  const addJudge = (newJudge: Omit<Judge, 'id'>) => {
    const newJudgeWithId = { ...newJudge, id: `j_${Date.now()}` };
    setJudges(prev => [...prev, newJudgeWithId]);
    return newJudgeWithId;
  };
  const editJudge = (updatedJudge: Judge) => setJudges(prev => prev.map(j => j.id === updatedJudge.id ? updatedJudge : j));
  const deleteJudge = (judgeId: string) => {
    if (window.confirm('Are you sure you want to delete this judge? This will also delete all their scores and cannot be undone.')) {
        setJudges(prev => prev.filter(j => j.id !== judgeId));
        setScores(prev => prev.filter(s => s.judgeId !== judgeId)); // Also delete associated scores
    }
  };

  const addCriterion = (newCriterion: Omit<Criterion, 'id'>) => setCriteria(prev => [...prev, { ...newCriterion, id: `c_${Date.now()}` }]);
  const editCriterion = (updatedCriterion: Criterion) => setCriteria(prev => prev.map(c => c.id === updatedCriterion.id ? updatedCriterion : c));
  const deleteCriterion = (criterionId: string) => {
     if (window.confirm('Are you sure you want to delete this criterion? This could affect existing scores.')) {
        setCriteria(prev => prev.filter(c => c.id !== criterionId));
        // Note: This does not remove the score entry from existing scores.
        // The calculation service will simply ignore it.
     }
  };

  // --- Judge Handler ---
  const addOrUpdateScore = (newScore: Score) => {
    setScores(prev => {
        const index = prev.findIndex(s => s.id === newScore.id);
        if (index > -1) {
            const updatedScores = [...prev];
            updatedScores[index] = newScore;
            return updatedScores;
        }
        return [...prev, newScore];
    });
  };
  
  const deleteScore = (scoreId: string) => {
    if (window.confirm('Are you sure you want to delete this evaluation? This action cannot be undone.')) {
        setScores(prev => prev.filter(s => s.id !== scoreId));
    }
  };

  const handleAdminLogin = () => setUser({ role: UserRole.ADMIN });

  const handleJuryLogin = (judgeId: string, newJudgeData?: Omit<Judge, 'id'>) => {
    let finalJudgeId = judgeId;
    if (judgeId === 'new' && newJudgeData) {
      const newJudge = addJudge(newJudgeData);
      finalJudgeId = newJudge.id;
    }
    setUser({ role: UserRole.JUDGE, id: finalJudgeId });
  };
  
  const handleLogout = () => setUser(null);

  const judgeData = useMemo(() => {
    if (user?.role !== UserRole.JUDGE || !user.id) {
        return null;
    }
    const currentJudge = judges.find(j => j.id === user.id);
    if (!currentJudge) {
        return null;
    }
    const judgeProjects = projects.filter(p => currentJudge.tracks.includes(p.track as Track));
    const judgeScores = scores.filter(s => s.judgeId === currentJudge.id);
    
    return { currentJudge, judgeProjects, judgeScores };
  }, [user, judges, projects, scores]);

  const renderContent = () => {
    if (!user) {
      return <LoginScreen onAdminLogin={handleAdminLogin} onJuryLogin={handleJuryLogin} judges={judges} />;
    }

    switch (user.role) {
      case UserRole.ADMIN:
        return <AdminDashboard 
            projects={projects} 
            judges={judges} 
            criteria={criteria} 
            scores={scores}
            addProjects={addProjects}
            editProject={editProject}
            deleteProject={deleteProject}
            addJudge={addJudge}
            editJudge={editJudge}
            deleteJudge={deleteJudge}
            addCriterion={addCriterion}
            editCriterion={editCriterion}
            deleteCriterion={deleteCriterion}
        />;
      case UserRole.JUDGE:
        if (!judgeData) {
            // This can happen if the judge was deleted while they were logged in.
            // Log them out to prevent a crash.
            handleLogout();
            return <p className="p-8 text-center text-red-500">Your judge profile was not found. You have been logged out.</p>
        }
        
        return <JudgeDashboard
            judge={judgeData.currentJudge}
            projects={judgeData.judgeProjects}
            criteria={criteria}
            scores={judgeData.judgeScores}
            onScoreSubmit={addOrUpdateScore}
            onScoreDelete={deleteScore}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Header user={user} onLogout={handleLogout} judges={judges} />
      <main className="max-w-screen-xl mx-auto">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;