#!/bin/bash

# Hedera Africa Hackathon Evaluation - Backend Setup Script
# This script automates the backend setup process

set -e  # Exit on error

echo "🚀 Hedera Africa Hackathon - Backend Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker is installed"
    DOCKER_INSTALLED=true
else
    echo -e "${YELLOW}!${NC} Docker is not installed"
    DOCKER_INSTALLED=false
fi

# Check if Node.js is installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION is installed"
    NODE_INSTALLED=true
else
    echo -e "${RED}✗${NC} Node.js is not installed"
    NODE_INSTALLED=false
fi

# Check if PostgreSQL is installed
if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version)
    echo -e "${GREEN}✓${NC} PostgreSQL is installed"
    PG_INSTALLED=true
else
    echo -e "${YELLOW}!${NC} PostgreSQL is not installed locally"
    PG_INSTALLED=false
fi

echo ""
echo "Choose setup method:"
echo "1) Docker Compose (Recommended - Includes Database)"
echo "2) Local Setup (Requires PostgreSQL)"
echo "3) Exit"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "🐳 Docker Compose Setup"
        echo "======================="
        
        if [ "$DOCKER_INSTALLED" = false ]; then
            echo -e "${RED}Error: Docker is not installed${NC}"
            echo "Please install Docker from https://docs.docker.com/get-docker/"
            exit 1
        fi

        # Create directory structure
        echo "Creating directory structure..."
        mkdir -p backend database nginx logs

        # Copy files to appropriate directories
        echo "Setting up files..."
        
        # Create .env file
        cat > .env << 'EOF'
# Database
DB_PASSWORD=hackathon_secure_pass_2024
PGADMIN_PASSWORD=admin123

# Frontend
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
EOF

        echo -e "${GREEN}✓${NC} Created .env file"

        # Pull images and start services
        echo ""
        echo "Starting Docker containers..."
        docker-compose up -d

        echo ""
        echo -e "${GREEN}✓${NC} Backend setup complete!"
        echo ""
        echo "Services running at:"
        echo "  - Backend API: http://localhost:3001"
        echo "  - pgAdmin: http://localhost:5050"
        echo "  - PostgreSQL: localhost:5432"
        echo ""
        echo "Default credentials:"
        echo "  - pgAdmin: admin@hedera-hackathon.com / admin123"
        echo "  - Database: hackathon_user / hackathon_secure_pass_2024"
        echo ""
        echo "Check status: docker-compose ps"
        echo "View logs: docker-compose logs -f backend"
        echo "Stop services: docker-compose down"
        ;;
        
    2)
        echo ""
        echo "🔧 Local Setup"
        echo "=============="
        
        if [ "$NODE_INSTALLED" = false ]; then
            echo -e "${RED}Error: Node.js is not installed${NC}"
            echo "Please install Node.js 18+ from https://nodejs.org/"
            exit 1
        fi

        if [ "$PG_INSTALLED" = false ]; then
            echo -e "${RED}Error: PostgreSQL is not installed${NC}"
            echo "Please install PostgreSQL 14+ from https://www.postgresql.org/download/"
            exit 1
        fi

        # Create backend directory
        mkdir -p backend
        cd backend

        # Install dependencies
        echo "Installing dependencies..."
        npm install express pg cors helmet dotenv express-rate-limit bcryptjs jsonwebtoken express-validator morgan compression winston

        echo "Installing dev dependencies..."
        npm install --save-dev nodemon jest supertest eslint prettier

        # Create .env file
        cat > .env << 'EOF'
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=hackathon_eval
DB_USER=hackathon_user
DB_PASSWORD=your_db_password

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

LOG_LEVEL=info
EOF

        echo -e "${GREEN}✓${NC} Created .env file"

        # Database setup
        echo ""
        echo "Database Setup"
        echo "-------------"
        read -p "Enter PostgreSQL superuser name [postgres]: " PG_USER
        PG_USER=${PG_USER:-postgres}

        echo "Creating database and user..."
        psql -U "$PG_USER" -c "CREATE DATABASE hackathon_eval;" || true
        psql -U "$PG_USER" -c "CREATE USER hackathon_user WITH PASSWORD 'your_db_password';" || true
        psql -U "$PG_USER" -c "GRANT ALL PRIVILEGES ON DATABASE hackathon_eval TO hackathon_user;" || true

        # Run schema
        echo "Creating database schema..."
        psql -U "$PG_USER" -d hackathon_eval -f ../database/schema.sql

        echo -e "${GREEN}✓${NC} Database setup complete!"

        # Create start script
        cat > start.sh << 'EOF'
#!/bin/bash
echo "Starting Hedera Hackathon Backend..."
node server.js
EOF
        chmod +x start.sh

        echo ""
        echo -e "${GREEN}✓${NC} Local setup complete!"
        echo ""
        echo "To start the server:"
        echo "  cd backend"
        echo "  npm run dev"
        echo ""
        echo "Or for production:"
        echo "  npm start"
        ;;
        
    3)
        echo "Setup cancelled"
        exit 0
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "📚 Next Steps:"
echo "1. Update .env with your configuration"
echo "2. Test the API: curl http://localhost:3001/health"
echo "3. Access pgAdmin to manage database"
echo "4. Integrate with your frontend application"
echo ""
echo "For documentation, see README.md"
echo "For support, visit: https://github.com/Talelbg/Hedera-Africa-Hackathon-Evaluation"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"