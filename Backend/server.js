// server.js - Main Express Server for Hackathon Evaluation Backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hackathon_eval',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== PROJECTS API ====================

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const { track, status, search } = req.query;
    let query = 'SELECT * FROM projects WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (track) {
      query += ` AND track = $${paramCount}`;
      params.push(track);
      paramCount++;
    }
    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    if (search) {
      query += ` AND (project_name ILIKE $${paramCount} OR team_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
});

// Get single project by ID
app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch project' });
  }
});

// Create new project
app.post('/api/projects', async (req, res) => {
  try {
    const {
      project_name,
      team_name,
      track,
      description,
      github_url,
      demo_url,
      video_url,
      contact_email,
      team_members
    } = req.body;

    // Validation
    if (!project_name || !team_name || !track || !contact_email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: project_name, team_name, track, contact_email' 
      });
    }

    const result = await pool.query(
      `INSERT INTO projects 
       (project_name, team_name, track, description, github_url, demo_url, 
        video_url, contact_email, team_members, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) 
       RETURNING *`,
      [project_name, team_name, track, description, github_url, demo_url, 
       video_url, contact_email, JSON.stringify(team_members), 'pending']
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, error: 'Failed to create project' });
  }
});

// Update project
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const allowedFields = ['project_name', 'team_name', 'track', 'description', 
                          'github_url', 'demo_url', 'video_url', 'contact_email', 
                          'team_members', 'status'];
    
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(key === 'team_members' ? JSON.stringify(value) : value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, error: 'Failed to update project' });
  }
});

// ==================== EVALUATIONS API ====================

// Get all evaluations for a project
app.get('/api/projects/:projectId/evaluations', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      'SELECT * FROM evaluations WHERE project_id = $1 ORDER BY created_at DESC',
      [projectId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch evaluations' });
  }
});

// Create new evaluation
app.post('/api/evaluations', async (req, res) => {
  try {
    const {
      project_id,
      evaluator_name,
      evaluator_email,
      innovation_score,
      technical_score,
      impact_score,
      presentation_score,
      hedera_integration_score,
      comments,
      ai_analysis
    } = req.body;

    // Validation
    if (!project_id || !evaluator_name || !evaluator_email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Validate scores are between 1-10
    const scores = [innovation_score, technical_score, impact_score, 
                   presentation_score, hedera_integration_score];
    if (scores.some(score => score < 1 || score > 10)) {
      return res.status(400).json({ 
        success: false, 
        error: 'All scores must be between 1 and 10' 
      });
    }

    const overall_score = (
      innovation_score + technical_score + impact_score + 
      presentation_score + hedera_integration_score
    ) / 5;

    const result = await pool.query(
      `INSERT INTO evaluations 
       (project_id, evaluator_name, evaluator_email, innovation_score, 
        technical_score, impact_score, presentation_score, hedera_integration_score,
        overall_score, comments, ai_analysis, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) 
       RETURNING *`,
      [project_id, evaluator_name, evaluator_email, innovation_score, 
       technical_score, impact_score, presentation_score, hedera_integration_score,
       overall_score, comments, ai_analysis]
    );

    // Update project average score
    await updateProjectAverageScore(project_id);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating evaluation:', error);
    res.status(500).json({ success: false, error: 'Failed to create evaluation' });
  }
});

// Helper function to update project average score
async function updateProjectAverageScore(projectId) {
  try {
    const result = await pool.query(
      `SELECT AVG(overall_score) as avg_score, COUNT(*) as eval_count 
       FROM evaluations WHERE project_id = $1`,
      [projectId]
    );
    
    const { avg_score, eval_count } = result.rows[0];
    
    await pool.query(
      'UPDATE projects SET average_score = $1, evaluation_count = $2 WHERE id = $3',
      [avg_score, eval_count, projectId]
    );
  } catch (error) {
    console.error('Error updating project average score:', error);
  }
}

// ==================== ANALYTICS API ====================

// Get dashboard statistics
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM projects) as total_projects,
        (SELECT COUNT(*) FROM evaluations) as total_evaluations,
        (SELECT COUNT(DISTINCT evaluator_email) FROM evaluations) as total_evaluators,
        (SELECT AVG(overall_score) FROM evaluations) as avg_overall_score,
        (SELECT COUNT(*) FROM projects WHERE status = 'pending') as pending_projects,
        (SELECT COUNT(*) FROM projects WHERE status = 'evaluated') as evaluated_projects
    `);

    const trackStats = await pool.query(`
      SELECT track, COUNT(*) as count, AVG(average_score) as avg_score
      FROM projects
      GROUP BY track
      ORDER BY count DESC
    `);

    res.json({ 
      success: true, 
      data: {
        ...stats.rows[0],
        track_distribution: trackStats.rows
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

// Get leaderboard
app.get('/api/analytics/leaderboard', async (req, res) => {
  try {
    const { track, limit = 50 } = req.query;
    
    let query = `
      SELECT p.*, 
             COUNT(e.id) as evaluation_count,
             AVG(e.overall_score) as average_score
      FROM projects p
      LEFT JOIN evaluations e ON p.id = e.project_id
      WHERE 1=1
    `;
    
    const params = [];
    if (track) {
      params.push(track);
      query += ` AND p.track = $1`;
    }
    
    query += `
      GROUP BY p.id
      HAVING COUNT(e.id) > 0
      ORDER BY average_score DESC, evaluation_count DESC
      LIMIT $${params.length + 1}
    `;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  pool.end();
  process.exit(0);
});