#!/bin/bash
# Deploy TPS to production server (172.19.154.93)
#
# With volume mounts, source code on host is directly used by container.
# No more docker cp needed — just rsync + restart.
#
# Usage:
#   ./deploy.sh              # Sync + restart
#   ./deploy.sh --sync-only  # Sync only (no restart, clear cache instead)
#   ./deploy.sh --restart    # Restart container only (no sync)

set -e

SERVER="root@172.19.154.93"
REMOTE_APP="/opt/tps-app"
CONTAINER="tps-app"
LOCAL_SRC="tps-core/tps"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo "=== TPS Deploy ==="
echo "Source: $LOCAL_SRC → $SERVER:$REMOTE_APP"
echo ""

# Restart only
if [ "$1" = "--restart" ]; then
  log "Restarting container..."
  ssh $SERVER "docker restart $CONTAINER"
  sleep 12
  STATUS=$(ssh $SERVER "docker ps --filter name=$CONTAINER --format '{{.Status}}'")
  log "Status: $STATUS"
  exit 0
fi

# Sync source code (volume-mounted directories)
log "Syncing pkgs/ (server framework)..."
rsync -az --delete \
  --exclude='node_modules' \
  "$LOCAL_SRC/pkgs/" "$SERVER:$REMOTE_APP/pkgs/"

log "Syncing app/srv/ (SSR API & components)..."
rsync -az --delete \
  "$LOCAL_SRC/app/srv/" "$SERVER:$REMOTE_APP/app/srv/"

log "Syncing app/db/ (Prisma schema)..."
rsync -az \
  --exclude='node_modules' \
  --exclude='.env' \
  "$LOCAL_SRC/app/db/" "$SERVER:$REMOTE_APP/app/db/"

log "Syncing app/web/deploy/ (Prasi bundles)..."
rsync -az \
  "$LOCAL_SRC/app/web/deploy/" "$SERVER:$REMOTE_APP/app/web/deploy/"

log "Sync complete!"

# Sync only — clear cache instead of restart
if [ "$1" = "--sync-only" ]; then
  warn "Sync only mode — clearing cache..."
  ssh $SERVER "curl -s http://localhost:3300/clear-cache/ || true"
  echo ""
  log "Done! Changes applied via volume mount (no restart needed for most changes)."
  exit 0
fi

# Restart container
echo ""
log "Restarting container..."
ssh $SERVER "docker restart $CONTAINER"

log "Waiting for health check..."
sleep 12

STATUS=$(ssh $SERVER "docker ps --filter name=$CONTAINER --format '{{.Status}}'")
log "Status: $STATUS"

# Smoke test
HTTP_CODE=$(ssh $SERVER "curl -s -o /dev/null -w '%{http_code}' http://localhost:3300/")
if [ "$HTTP_CODE" = "200" ]; then
  log "Homepage: OK (HTTP $HTTP_CODE)"
else
  err "Homepage: FAILED (HTTP $HTTP_CODE)"
fi

echo ""
log "Deploy complete!"
