-- Database Schema for Hedera Africa Hackathon Evaluation System
-- PostgreSQL

-- Create database
CREATE DATABASE hackathon_eval;

-- Connect to database
\c hackathon_eval;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== PROJECTS TABLE ====================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_name VARCHAR(255) NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    track VARCHAR(100) NOT NULL CHECK (track IN (
        'Onchain Finance & RWA',
        'DLT Operations & ESG',
        'AI & DePIN',
        'Gaming & Metaverse'
    )),
    description TEXT,
    github_url VARCHAR(500),
    demo_url VARCHAR(500),
    video_url VARCHAR(500),
    contact_email VARCHAR(255) NOT NULL,
    team_members JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'evaluated', 'winner')),
    average_score DECIMAL(3,2) DEFAULT 0.00,
    evaluation_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    CONSTRAINT valid_email CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_projects_track ON projects(track);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_average_score ON projects(average_score DESC);

-- ==================== EVALUATIONS TABLE ====================
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    evaluator_name VARCHAR(255) NOT NULL,
    evaluator_email VARCHAR(255) NOT NULL,
    
    -- Scoring criteria (1-10 scale)
    innovation_score DECIMAL(3,2) NOT NULL CHECK (innovation_score >= 1 AND innovation_score <= 10),
    technical_score DECIMAL(3,2) NOT NULL CHECK (technical_score >= 1 AND technical_score <= 10),
    impact_score DECIMAL(3,2) NOT NULL CHECK (impact_score >= 1 AND impact_score <= 10),
    presentation_score DECIMAL(3,2) NOT NULL CHECK (presentation_score >= 1 AND presentation_score <= 10),
    hedera_integration_score DECIMAL(3,2) NOT NULL CHECK (hedera_integration_score >= 1 AND hedera_integration_score <= 10),
    
    overall_score DECIMAL(3,2) GENERATED ALWAYS AS (
        (innovation_score + technical_score + impact_score + presentation_score + hedera_integration_score) / 5.0
    ) STORED,
    
    comments TEXT,
    ai_analysis JSONB, -- Store AI-generated insights
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one evaluation per evaluator per project
    CONSTRAINT unique_evaluator_project UNIQUE(project_id, evaluator_email)
);

CREATE INDEX idx_evaluations_project_id ON evaluations(project_id);
CREATE INDEX idx_evaluations_evaluator ON evaluations(evaluator_email);
CREATE INDEX idx_evaluations_created_at ON evaluations(created_at DESC);
CREATE INDEX idx_evaluations_overall_score ON evaluations(overall_score DESC);

-- ==================== EVALUATORS TABLE ====================
CREATE TABLE evaluators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(100) DEFAULT 'judge',
    expertise_areas VARCHAR(255)[],
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    evaluations_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_evaluator_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_evaluators_email ON evaluators(email);
CREATE INDEX idx_evaluators_is_active ON evaluators(is_active);

-- ==================== AUDIT LOG TABLE ====================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_changed_at ON audit_log(changed_at DESC);

-- ==================== TRIGGERS ====================

-- Trigger to update projects.updated_at on UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update project average score after evaluation insert/update/delete
CREATE OR REPLACE FUNCTION update_project_scores()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects SET
        average_score = (
            SELECT COALESCE(AVG(overall_score), 0)
            FROM evaluations
            WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
        ),
        evaluation_count = (
            SELECT COUNT(*)
            FROM evaluations
            WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
        )
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_scores_on_evaluation
    AFTER INSERT OR UPDATE OR DELETE ON evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_project_scores();

-- Trigger to update evaluator evaluation count
CREATE OR REPLACE FUNCTION update_evaluator_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE evaluators 
        SET evaluations_count = evaluations_count + 1
        WHERE email = NEW.evaluator_email;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE evaluators 
        SET evaluations_count = evaluations_count - 1
        WHERE email = OLD.evaluator_email;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_evaluator_count_trigger
    AFTER INSERT OR DELETE ON evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_evaluator_count();

-- ==================== VIEWS ====================

-- View for project rankings by track
CREATE OR REPLACE VIEW project_rankings AS
SELECT 
    p.id,
    p.project_name,
    p.team_name,
    p.track,
    p.average_score,
    p.evaluation_count,
    p.status,
    RANK() OVER (PARTITION BY p.track ORDER BY p.average_score DESC, p.evaluation_count DESC) as rank_in_track,
    RANK() OVER (ORDER BY p.average_score DESC, p.evaluation_count DESC) as overall_rank
FROM projects p
WHERE p.evaluation_count > 0;

-- View for evaluation statistics by track
CREATE OR REPLACE VIEW track_statistics AS
SELECT 
    track,
    COUNT(*) as project_count,
    ROUND(AVG(average_score)::numeric, 2) as avg_score,
    ROUND(MIN(average_score)::numeric, 2) as min_score,
    ROUND(MAX(average_score)::numeric, 2) as max_score,
    SUM(evaluation_count) as total_evaluations
FROM projects
WHERE evaluation_count > 0
GROUP BY track;

-- View for evaluator performance
CREATE OR REPLACE VIEW evaluator_statistics AS
SELECT 
    e.evaluator_email,
    e.evaluator_name,
    COUNT(*) as evaluations_completed,
    ROUND(AVG(e.overall_score)::numeric, 2) as avg_score_given,
    ROUND(STDDEV(e.overall_score)::numeric, 2) as score_consistency,
    MIN(e.created_at) as first_evaluation,
    MAX(e.created_at) as last_evaluation
FROM evaluations e
GROUP BY e.evaluator_email, e.evaluator_name;

-- ==================== SEED DATA ====================

-- Insert sample tracks (these match the hackathon tracks)
INSERT INTO projects (project_name, team_name, track, description, contact_email, status)
VALUES 
    ('DeFi Lending Platform', 'Alpha Team', 'Onchain Finance & RWA', 'Decentralized lending platform for African markets', 'alpha@example.com', 'pending'),
    ('Supply Chain Tracker', 'Beta Builders', 'DLT Operations & ESG', 'Track and verify supply chain using Hedera', 'beta@example.com', 'pending'),
    ('AI-Powered Healthcare', 'Gamma Health', 'AI & DePIN', 'AI diagnosis system on blockchain', 'gamma@example.com', 'pending'),
    ('MetaAfrica Game', 'Delta Gaming', 'Gaming & Metaverse', 'Metaverse platform showcasing African culture', 'delta@example.com', 'pending');

-- Insert sample evaluators
INSERT INTO evaluators (name, email, role, expertise_areas)
VALUES 
    ('Dr. Sarah Johnson', 'sarah.johnson@hedera.com', 'Lead Judge', ARRAY['Blockchain', 'Finance', 'DeFi']),
    ('Michael Chen', 'michael.chen@hedera.com', 'Technical Judge', ARRAY['Smart Contracts', 'Security', 'Scalability']),
    ('Amina Diallo', 'amina.diallo@hedera.com', 'Judge', ARRAY['Impact', 'Sustainability', 'ESG']);

-- Grant necessary permissions (adjust user as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hackathon_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hackathon_user;