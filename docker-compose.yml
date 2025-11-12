version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: hackathon_db
    restart: unless-stopped
    environment:
      POSTGRES_DB: hackathon_eval
      POSTGRES_USER: hackathon_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-hackathon_pass_2024}
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    networks:
      - hackathon_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hackathon_user -d hackathon_eval"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: hackathon_backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: hackathon_eval
      DB_USER: hackathon_user
      DB_PASSWORD: ${DB_PASSWORD:-hackathon_pass_2024}
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:3000}
      JWT_SECRET: ${JWT_SECRET:-change_this_secret_in_production}
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules
    networks:
      - hackathon_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # pgAdmin (Database Management UI)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: hackathon_pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@hedera-hackathon.com
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin123}
      PGADMIN_LISTEN_PORT: 80
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    networks:
      - hackathon_network
    depends_on:
      - postgres

  # Redis (for caching and session management - optional)
  redis:
    image: redis:7-alpine
    container_name: hackathon_redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - hackathon_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Nginx (Reverse Proxy - optional but recommended for production)
  nginx:
    image: nginx:alpine
    container_name: hackathon_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    networks:
      - hackathon_network

volumes:
  postgres_data:
    driver: local
  pgadmin_data:
    driver: local
  redis_data:
    driver: local

networks:
  hackathon_network:
    driver: bridge