#!/bin/bash

if [ $# -eq 0 ]; then
    echo "Usage: ./restore.sh <backup_filename>"
    echo "Available backups:"
    ls -la ./backups/*.db 2>/dev/null || echo "No backups found!"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "./backups/${BACKUP_FILE}" ]; then
    echo "❌ Backup file not found: ./backups/${BACKUP_FILE}"
    exit 1
fi

echo "⚠️  WARNING: This will replace your current database!"
echo "📁 Restoring from: ${BACKUP_FILE}"
read -p "Are you sure? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

echo "🛑 Stopping backend service..."
docker-compose stop backend

echo "📦 Creating backup of current database..."
CURRENT_BACKUP="current_backup_$(date +%Y%m%d_%H%M%S).db"
cp "./backend/app/db/car_parking_app.db" "./backups/${CURRENT_BACKUP}"
echo "✅ Current database backed up as: ${CURRENT_BACKUP}"

echo "🔄 Restoring database..."
cp "./backups/${BACKUP_FILE}" "./backend/app/db/car_parking_app.db"

echo "🚀 Starting backend service..."
docker-compose start backend

echo "✅ Database restored successfully!"
echo "📋 If something went wrong, you can restore the previous version:"
echo "   ./restore.sh ${CURRENT_BACKUP}"