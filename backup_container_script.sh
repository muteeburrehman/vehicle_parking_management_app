#!/bin/sh

# Install sqlite
apk add --no-cache sqlite

echo "Backup service started"

while true; do
    # Create timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    
    echo "Creating backup at $(date)"
    
    # Create backup
    if sqlite3 /source/db/car_parking_app.db ".backup /backups/backup_${timestamp}.db"; then
        echo "Backup completed successfully: backup_${timestamp}.db"
    else
        echo "Backup failed"
    fi
    
    # Clean up old backups (keep only last 7 days)
    find /backups -name "backup_*.db" -type f -mtime +7 -delete
    
    # Wait 24 hours
    sleep 86400
done
