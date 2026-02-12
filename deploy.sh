#!/bin/bash
# Deploy script: sync code from local to server (172.19.154.93)
# Usage: ./deploy.sh [--restart]
#
# This script syncs the tps-core/tps source code to the server
# and optionally restarts the Docker container.

set -e

SERVER="root@172.19.154.93"
REMOTE_APP="/opt/tps-app"
CONTAINER="tps-app"
LOCAL_SRC="tps-core/tps"

echo "=== TPS Deploy ==="
echo "From: $LOCAL_SRC"
echo "To:   $SERVER:$REMOTE_APP"
echo ""

# Sync source code (exclude node_modules, data, etc.)
echo "[1/3] Syncing source code..."
rsync -avz --delete \
  --exclude 'node_modules/' \
  --exclude '.git/' \
  --exclude 'data/' \
  --exclude 'bun.lockb' \
  --exclude '.env' \
  --exclude 'app/db/.env' \
  --exclude 'app/web/deploy/*.gz' \
  --exclude 'app/web/deploy/*.zip' \
  --exclude 'app/web/server/' \
  --exclude '*.tmp.*' \
  "$LOCAL_SRC/" "$SERVER:$REMOTE_APP/"

echo ""
echo "[2/3] Copying into Docker container..."
ssh "$SERVER" "docker cp $REMOTE_APP/app/srv/. $CONTAINER:/app/app/srv/"
ssh "$SERVER" "docker cp $REMOTE_APP/pkgs/. $CONTAINER:/app/pkgs/"

if [ "$1" = "--restart" ]; then
  echo ""
  echo "[3/3] Restarting container..."
  ssh "$SERVER" "docker restart $CONTAINER"
  sleep 3
  ssh "$SERVER" "docker logs $CONTAINER --tail 5"
else
  echo ""
  echo "[3/3] Clearing cache (no restart)..."
  curl -s "http://172.19.154.93:3300/clear-cache/" && echo ""
fi

echo ""
echo "=== Deploy complete ==="
