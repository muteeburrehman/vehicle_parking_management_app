#!/bin/bash

# Create backups directory if it doesn't exist
mkdir -p ./backups

# Create timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "Starting backup process..."

# Method 1: Use backup container to create backup
docker exec db_backup sqlite3 /source/db/car_parking_app.db ".backup /backups/manual_backup_${TIMESTAMP}.db"

if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully: manual_backup_${TIMESTAMP}.db"

    # Show backup file size
    BACKUP_SIZE=$(du -h "./backups/manual_backup_${TIMESTAMP}.db" | cut -f1)
    echo "📁 Backup size: ${BACKUP_SIZE}"

    # List recent backups
    echo "📋 Recent backups:"
    ls -la ./backups/ | tail -5
else
    echo "❌ Backup failed!"
    exit 1
fi

# Optional: Clean up old manual backups (keep last 5)
echo "🧹 Cleaning up old backups..."
ls -t ./backups/manual_backup_*.db | tail -n +6 | xargs -r rm

echo "✨ Backup process completed!"