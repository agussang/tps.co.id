#!/bin/bash

# Import Production Database to Development
# ==========================================

DB_HOST="103.187.215.236"
DB_PORT="5333"
DB_NAME="tps-web"
DB_USER="postgres"
DB_PASS="e29A50x50aQLJHcJuaAhUcw0ngQI5WfH6dxr1jombecyu3F7sLNOymvD1cxXdLwF"

BACKUP_FILE="/Users/agus/tps.co.id/backup_03_feb_2026.sql"

export PGPASSWORD="$DB_PASS"

echo "=== Step 1: Drop existing tables ==="
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
-- Drop all tables in correct order (respect foreign keys)
DROP TABLE IF EXISTS user_session CASCADE;
DROP TABLE IF EXISTS role_menu CASCADE;
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS content_history CASCADE;
DROP TABLE IF EXISTS content CASCADE;
DROP TABLE IF EXISTS layout_component CASCADE;
DROP TABLE IF EXISTS layout CASCADE;
DROP TABLE IF EXISTS file_preview CASCADE;
DROP TABLE IF EXISTS config CASCADE;
DROP TABLE IF EXISTS file CASCADE;
DROP TABLE IF EXISTS structure CASCADE;
DROP TABLE IF EXISTS structure_folder CASCADE;
DROP TABLE IF EXISTS router CASCADE;
DROP TABLE IF EXISTS site CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
DROP TABLE IF EXISTS role CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS user_id_seq CASCADE;
DROP SEQUENCE IF EXISTS role_id_seq CASCADE;
DROP SEQUENCE IF EXISTS role_menu_id_seq CASCADE;
DROP SEQUENCE IF EXISTS logs_id_seq CASCADE;
EOF

echo "=== Step 2: Import production backup ==="
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$BACKUP_FILE"

echo "=== Step 3: Fix schema differences ==="
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
-- Add password column if not exists
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS password text;

-- Rename crated_at to created_at (fix typo)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'crated_at') THEN
        ALTER TABLE "user" RENAME COLUMN crated_at TO created_at;
    END IF;
END $$;

-- Verify structure
\d "user"
EOF

echo "=== Step 4: Verify data counts ==="
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
SELECT 'content' as table_name, COUNT(*) as count FROM content
UNION ALL SELECT 'file', COUNT(*) FROM file
UNION ALL SELECT 'structure', COUNT(*) FROM structure
UNION ALL SELECT 'structure_folder', COUNT(*) FROM structure_folder
UNION ALL SELECT 'user', COUNT(*) FROM "user"
UNION ALL SELECT 'role', COUNT(*) FROM role
ORDER BY table_name;
EOF

echo "=== Done! ==="
