#!/usr/bin/env bash

# ==============================================================================
#  Sathwara InfoTech - WhatsApp SaaS Production Deployment Script
#  Usage: bash deploy_live.sh [branch-name]
#  Default branch: main
# ==============================================================================

set -e # Exit immediately on error

BRANCH="${1:-main}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}=================================================================${NC}"
echo -e "${CYAN}  🚀 Starting Sathwara WhatsApp SaaS Production Deployment${NC}"
echo -e "  📅 Time:   ${TIMESTAMP}"
echo -e "  📂 Folder: ${PROJECT_DIR}"
echo -e "  🌿 Branch: ${BRANCH}"
echo -e "${PURPLE}=================================================================${NC}"

cd "$PROJECT_DIR"

# 1. Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found in ${PROJECT_DIR}${NC}"
    echo -e "${YELLOW}Please create and configure .env before deploying.${NC}"
    exit 1
fi

# 2. Put Application into Maintenance Mode
echo -e "\n${BLUE}⏳ [1/8] Putting application into maintenance mode...${NC}"
php artisan down --retry=60 --secret="sathwara-deploy-bypass" || true

# 3. Pull latest code from Git
echo -e "\n${BLUE}📥 [2/8] Fetching and pulling latest code from git (${BRANCH})...${NC}"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

# 4. Install PHP Dependencies (No Dev)
echo -e "\n${BLUE}📦 [3/8] Installing PHP Composer dependencies (production)...${NC}"
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction --quiet

# 5. Install Node Dependencies & Build Frontend Assets
echo -e "\n${BLUE}⚡ [4/8] Building Vite frontend assets (Inertia + React)...${NC}"
if command -v npm &> /dev/null; then
    npm ci --silent || npm install --silent
    npm run build
else
    echo -e "${YELLOW}⚠️ npm not found. Skipping frontend build.${NC}"
fi

# 6. Run Database Migrations
echo -e "\n${BLUE}🗄️  [5/8] Running database migrations...${NC}"
php artisan migrate --force

# 7. Clear & Re-cache Application Configuration
echo -e "\n${BLUE}🧹 [6/8] Optimizing caches for production...${NC}"
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# 8. Set Correct Permissions & Storage Link
echo -e "\n${BLUE}🔒 [7/8] Ensuring storage symlink and folder permissions...${NC}"
php artisan storage:link || true

# Set write permissions for web server
if [ -d "storage" ]; then
    chmod -R 775 storage bootstrap/cache
    # If running with sudo/root or www-data exists, fix group ownership
    if getent group www-data > /dev/null 2>&1; then
        chown -R :www-data storage bootstrap/cache || true
    fi
fi

# Restart Queue Workers / Background Processes
echo -e "\n${BLUE}🔄 [8/8] Restarting queue workers and background jobs...${NC}"
php artisan queue:restart || true

# Check if Supervisor is installed and update whatsapp workers
if command -v supervisorctl &> /dev/null; then
    supervisorctl reread || true
    supervisorctl update || true
    supervisorctl restart all || true
fi

# 9. Bring Application Back Online
echo -e "\n${GREEN}🔓 Bringing application back online...${NC}"
php artisan up

echo -e "\n${PURPLE}=================================================================${NC}"
echo -e "${GREEN}  ✅ DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo -e "  🎉 WhatsApp SaaS is live & running at: $(date +"%Y-%m-%d %H:%M:%S")"
echo -e "${PURPLE}=================================================================${NC}"
