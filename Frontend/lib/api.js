// lib/api.js - API Client for Frontend Integration
// Place this file in your Next.js app's lib/ directory

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error || 'An error occurred',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Network error', 0, { originalError: error.message });
  }
}

// ==================== PROJECTS API ====================

export const projectsAPI = {
  /**
   * Get all projects with optional filters
   * @param {Object} filters - { track, status, search }
   */
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.track) params.append('track', filters.track);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    
    const query = params.toString();
    return apiRequest(`/projects${query ? `?${query}` : ''}`);
  },

  /**
   * Get single project by ID
   * @param {string} id - Project UUID
   */
  getById: async (id) => {
    return apiRequest(`/projects/${id}`);
  },

  /**
   * Create new project
   * @param {Object} projectData - Project information
   */
  create: async (projectData) => {
    return apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  /**
   * Update project
   * @param {string} id - Project UUID
   * @param {Object} updates - Fields to update
   */
  update: async (id, updates) => {
    return apiRequest(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Submit project for evaluation
   */
  submit: async (projectData) => {
    return projectsAPI.create({
      ...projectData,
      status: 'pending',
    });
  },
};

// ==================== EVALUATIONS API ====================

export const evaluationsAPI = {
  /**
   * Get all evaluations for a project
   * @param {string} projectId - Project UUID
   */
  getByProject: async (projectId) => {
    return apiRequest(`/projects/${projectId}/evaluations`);
  },

  /**
   * Create new evaluation
   * @param {Object} evaluationData - Evaluation scores and comments
   */
  create: async (evaluationData) => {
    return apiRequest('/evaluations', {
      method: 'POST',
      body: JSON.stringify(evaluationData),
    });
  },

  /**
   * Submit evaluation with AI analysis
   */
  submitWithAI: async (projectId, evaluatorInfo, scores, comments, aiAnalysis) => {
    return evaluationsAPI.create({
      project_id: projectId,
      evaluator_name: evaluatorInfo.name,
      evaluator_email: evaluatorInfo.email,
      ...scores,
      comments,
      ai_analysis: aiAnalysis,
    });
  },
};

// ==================== ANALYTICS API ====================

export const analyticsAPI = {
  /**
   * Get dashboard statistics
   */
  getDashboard: async () => {
    return apiRequest('/analytics/dashboard');
  },

  /**
   * Get leaderboard
   * @param {Object} options - { track, limit }
   */
  getLeaderboard: async (options = {}) => {
    const params = new URLSearchParams();
    if (options.track) params.append('track', options.track);
    if (options.limit) params.append('limit', options.limit);
    
    const query = params.toString();
    return apiRequest(`/analytics/leaderboard${query ? `?${query}` : ''}`);
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate overall score from individual scores
 */
export function calculateOverallScore(scores) {
  const {
    innovation_score,
    technical_score,
    impact_score,
    presentation_score,
    hedera_integration_score,
  } = scores;

  return (
    (innovation_score +
      technical_score +
      impact_score +
      presentation_score +
      hedera_integration_score) /
    5
  );
}

/**
 * Validate evaluation scores
 */
export function validateScores(scores) {
  const requiredFields = [
    'innovation_score',
    'technical_score',
    'impact_score',
    'presentation_score',
    'hedera_integration_score',
  ];

  for (const field of requiredFields) {
    const score = scores[field];
    if (score === undefined || score === null) {
      return { valid: false, error: `${field} is required` };
    }
    if (score < 1 || score > 10) {
      return { valid: false, error: `${field} must be between 1 and 10` };
    }
  }

  return { valid: true };
}

/**
 * Validate project data
 */
export function validateProject(projectData) {
  const requiredFields = ['project_name', 'team_name', 'track', 'contact_email'];

  for (const field of requiredFields) {
    if (!projectData[field]) {
      return { valid: false, error: `${field} is required` };
    }
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(projectData.contact_email)) {
    return { valid: false, error: 'Invalid email address' };
  }

  // Validate track
  const validTracks = [
    'Onchain Finance & RWA',
    'DLT Operations & ESG',
    'AI & DePIN',
    'Gaming & Metaverse',
  ];
  if (!validTracks.includes(projectData.track)) {
    return { valid: false, error: 'Invalid track' };
  }

  return { valid: true };
}

/**
 * Format date for display
 */
export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get track color for UI
 */
export function getTrackColor(track) {
  const colors = {
    'Onchain Finance & RWA': 'blue',
    'DLT Operations & ESG': 'green',
    'AI & DePIN': 'purple',
    'Gaming & Metaverse': 'pink',
  };
  return colors[track] || 'gray';
}

/**
 * Get status badge color
 */
export function getStatusColor(status) {
  const colors = {
    pending: 'yellow',
    in_review: 'blue',
    evaluated: 'green',
    winner: 'gold',
  };
  return colors[status] || 'gray';
}

// ==================== REACT HOOKS ====================

/**
 * Custom hook for projects (use in Next.js components)
 */
export function useProjects(filters = {}) {
  const [projects, setProjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await projectsAPI.getAll(filters);
        setProjects(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [JSON.stringify(filters)]);

  return { projects, loading, error, refetch: fetchProjects };
}

/**
 * Custom hook for single project
 */
export function useProject(projectId) {
  const [project, setProject] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await projectsAPI.getById(projectId);
        setProject(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  return { project, loading, error };
}

/**
 * Custom hook for analytics
 */
export function useAnalytics() {
  const [analytics, setAnalytics] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await analyticsAPI.getDashboard();
        setAnalytics(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return { analytics, loading, error };
}

// ==================== USAGE EXAMPLES ====================

/*
// Example 1: Submit a new project
async function handleProjectSubmit(formData) {
  try {
    const validation = validateProject(formData);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const response = await projectsAPI.create(formData);
    console.log('Project created:', response.data);
    // Redirect or show success message
  } catch (error) {
    console.error('Failed to submit project:', error);
    alert('Failed to submit project. Please try again.');
  }
}

// Example 2: Submit an evaluation with AI analysis
async function handleEvaluationSubmit(projectId, scores, comments, aiInsights) {
  try {
    const validation = validateScores(scores);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const response = await evaluationsAPI.submitWithAI(
      projectId,
      { name: 'Judge Name', email: 'judge@example.com' },
      scores,
      comments,
      aiInsights
    );
    
    console.log('Evaluation submitted:', response.data);
  } catch (error) {
    console.error('Failed to submit evaluation:', error);
  }
}

// Example 3: Use in React component
function ProjectsList() {
  const { projects, loading, error } = useProjects({ track: 'AI & DePIN' });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>
          <h3>{project.project_name}</h3>
          <p>{project.team_name}</p>
          <span>Score: {project.average_score}</span>
        </div>
      ))}
    </div>
  );
}

// Example 4: Fetch leaderboard
async function showLeaderboard() {
  const response = await analyticsAPI.getLeaderboard({ limit: 10 });
  console.log('Top 10 projects:', response.data);
}
*/

export default {
  projectsAPI,
  evaluationsAPI,
  analyticsAPI,
  validateScores,
  validateProject,
  calculateOverallScore,
  formatDate,
  getTrackColor,
  getStatusColor,
};