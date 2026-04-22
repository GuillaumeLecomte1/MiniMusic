#!/bin/bash
# MiniMusic Deployment Script for Dokploy

set -e

DOKPLOY_URL="https://dokploy.guillaume-lcte.fr"
API_KEY="testsjQuiJWrkpmbCCNLJzGmxeqKYTXNPzSXsGXxhzxXEWRFeLFblWriAffIBPfgIXcw"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# API call helper
api_call() {
  local method=$1
  local endpoint=$2
  local body=$3
  
  if [ -z "$body" ]; then
    curl -s -X "$method" "${DOKPLOY_URL}/api${endpoint}" \
      -H "x-api-key: ${API_KEY}" \
      -H "Content-Type: application/json"
  else
    curl -s -X "$method" "${DOKPLOY_URL}/api${endpoint}" \
      -H "x-api-key: ${API_KEY}" \
      -H "Content-Type: application/json" \
      -d "$body"
  fi
}

log "Starting MiniMusic deployment..."

# 1. Get all projects to check if "minimusic" exists
log "Checking existing projects..."
PROJECTS=$(api_call "GET" "/project.all")
echo "$PROJECTS" | jq .

# 2. Get servers
log "Fetching servers..."
SERVERS=$(api_call "GET" "/server.all")
SERVER_ID=$(echo "$SERVERS" | jq -r '.[0].serverId // .[0] | values | .serverId')
echo "Using server: $SERVER_ID"

# 3. Get default environment ID
log "Checking environments..."
ENVS=$(api_call "GET" "/environment.byProjectId?projectId=$(echo "$PROJECTS" | jq -r '.[0].projectId')")
ENV_ID=$(echo "$ENVS" | jq -r '.[0].environmentId // .[0] | values | .environmentId')
echo "Using environment: $ENV_ID"

# 4. Create project if not exists
log "Creating MiniMusic project..."
PROJECT_ID=$(echo "$PROJECTS" | jq -r '.[] | select(.name == "MiniMusic") | .projectId')
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
  CREATE_PROJECT=$(api_call "POST" "/project.create" '{"name": "MiniMusic", "description": "AI Music Generation App"}')
  PROJECT_ID=$(echo "$CREATE_PROJECT" | jq -r '.projectId')
  log "Project created: $PROJECT_ID"
else
  log "Project exists: $PROJECT_ID"
fi

# 5. Create production environment if not exists
log "Creating production environment..."
ENVS=$(api_call "GET" "/environment.byProjectId?projectId=${PROJECT_ID}")
ENV_ID=$(echo "$ENVS" | jq -r '.[] | select(.name == "production") | .environmentId')
if [ -z "$ENV_ID" ] || [ "$ENV_ID" = "null" ]; then
  CREATE_ENV=$(api_call "POST" "/environment.create" "{\"name\": \"production\", \"projectId\": \"${PROJECT_ID}\"}")
  ENV_ID=$(echo "$CREATE_ENV" | jq -r '.environmentId')
  log "Environment created: $ENV_ID"
else
  log "Environment exists: $ENV_ID"
fi

# 6. Create application
log "Creating application..."
CREATE_APP=$(api_call "POST" "/application.create" "{\"name\": \"MiniMusic App\", \"appName\": \"minimusic\", \"environmentId\": \"${ENV_ID}\", \"serverId\": \"${SERVER_ID}\"}")
APP_ID=$(echo "$CREATE_APP" | jq -r '.applicationId')
log "Application created: $APP_ID"

# 7. Configure GitHub provider
log "Configuring GitHub provider..."
api_call "POST" "/application.saveGithubProvider" "{
  \"applicationId\": \"${APP_ID}\",
  \"repository\": \"GuillaumeLecomte1/MiniMusic\",
  \"branch\": \"master\",
  \"owner\": \"GuillaumeLecomte1\",
  \"buildPath\": \"/\",
  \"githubId\": null,
  \"triggerType\": \"push\"
}" | jq .

# 8. Configure build type (Dockerfile)
log "Configuring build type..."
api_call "POST" "/application.saveBuildType" "{
  \"applicationId\": \"${APP_ID}\",
  \"buildType\": \"dockerfile\",
  \"dockerfile\": \"Dockerfile\",
  \"dockerContextPath\": \"/\",
  \"dockerBuildStage\": null
}" | jq .

# 9. Set environment variables
log "Setting environment variables..."
ENCRYPTION_KEY=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 32)
api_call "POST" "/application.saveEnvironment" "{
  \"applicationId\": \"${APP_ID}\",
  \"env\": \"DATABASE_URL=postgresql://minimusic:minimusic123@postgres:5432/minimusic?schema=public\\nENCRYPTION_KEY=${ENCRYPTION_KEY}\\nMINIMAX_API_URL=https://api.minimax.io\\nPORT=3001\\nFRONTEND_URL=http://localhost:5173\",
  \"buildArgs\": null,
  \"buildSecrets\": null,
  \"createEnvFile\": true
}" | jq .

# 10. Create domain
log "Creating domain minimusic.guillaume-lcte.fr..."
api_call "POST" "/domain.create" "{
  \"host\": \"minimusic.guillaume-lcte.fr\",
  \"https\": true,
  \"certificateType\": \"letsencrypt\",
  \"applicationId\": \"${APP_ID}\"
}" | jq .

# 11. Redeploy
log "Triggering deployment..."
api_call "POST" "/application.redeploy" "{\"applicationId\": \"${APP_ID}\"}" | jq .

log "Deployment triggered successfully!"
log "App ID: ${APP_ID}"
log "Check status at: ${DOKPLOY_URL}/dashboard/project/${PROJECT_ID}/environment/${ENV_ID}/app/${APP_ID}"
