#!/bin/bash

# Quest Management System Backup Script
# This script creates backups of database, uploads, and configuration

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR=${1:-"./backups"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PROJECT_NAME="quest-management"
RETENTION_DAYS=30

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Create backup directory
create_backup_dir() {
    print_info "Creating backup directory..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$BACKUP_DIR/database"
    mkdir -p "$BACKUP_DIR/uploads"
    mkdir -p "$BACKUP_DIR/config"
    mkdir -p "$BACKUP_DIR/logs"
    
    print_status "Backup directory created: $BACKUP_DIR"
}

# Backup PostgreSQL database
backup_database() {
    print_info "Backing up PostgreSQL database..."
    
    local backup_file="$BACKUP_DIR/database/quest_management_$TIMESTAMP.sql"
    
    # Check if PostgreSQL is running
    if ! pg_isready -h localhost -p 5432 -U quest_user &> /dev/null; then
        print_error "PostgreSQL is not running"
        return 1
    fi
    
    # Create database backup
    if PGPASSWORD="quest_password" pg_dump -h localhost -p 5432 -U quest_user -d quest_management > "$backup_file" 2>/dev/null; then
        print_status "Database backup created: $backup_file"
        
        # Compress the backup
        gzip "$backup_file"
        print_status "Database backup compressed: $backup_file.gz"
    else
        print_error "Database backup failed"
        return 1
    fi
}

# Backup uploads directory
backup_uploads() {
    print_info "Backing up uploads directory..."
    
    if [ -d "./uploads" ]; then
        local backup_file="$BACKUP_DIR/uploads/uploads_$TIMESTAMP.tar.gz"
        
        tar -czf "$backup_file" ./uploads 2>/dev/null
        print_status "Uploads backup created: $backup_file"
    else
        print_warning "Uploads directory not found"
    fi
}

# Backup configuration files
backup_config() {
    print_info "Backing up configuration files..."
    
    local config_backup_dir="$BACKUP_DIR/config/config_$TIMESTAMP"
    mkdir -p "$config_backup_dir"
    
    # Backend configuration
    if [ -f "./backend/.env" ]; then
        cp ./backend/.env "$config_backup_dir/backend.env"
        print_status "Backend configuration backed up"
    fi
    
    # Frontend configuration
    if [ -f "./frontend/.env" ]; then
        cp ./frontend/.env "$config_backup_dir/frontend.env"
        print_status "Frontend configuration backed up"
    fi
    
    # Docker configuration
    if [ -f "./.env" ]; then
        cp ./.env "$config_backup_dir/docker.env"
        print_status "Docker configuration backed up"
    fi
    
    # Prisma schema
    if [ -f "./backend/prisma/schema.prisma" ]; then
        cp ./backend/prisma/schema.prisma "$config_backup_dir/schema.prisma"
        print_status "Prisma schema backed up"
    fi
    
    # Compress configuration backup
    tar -czf "$BACKUP_DIR/config/config_$TIMESTAMP.tar.gz" -C "$BACKUP_DIR/config" "config_$TIMESTAMP"
    print_status "Configuration backup compressed: config_$TIMESTAMP.tar.gz"
}

# Backup logs
backup_logs() {
    print_info "Backing up logs..."
    
    if [ -d "./logs" ]; then
        local backup_file="$BACKUP_DIR/logs/logs_$TIMESTAMP.tar.gz"
        
        tar -czf "$backup_file" ./logs 2>/dev/null
        print_status "Logs backup created: $backup_file"
    else
        print_warning "Logs directory not found"
    fi
}

# Backup Docker volumes (if using Docker)
backup_docker_volumes() {
    print_info "Backing up Docker volumes..."
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        print_warning "Docker is not running"
        return 1
    fi
    
    # Backup PostgreSQL volume
    if docker volume ls | grep -q "quest_postgres_data"; then
        local postgres_backup="$BACKUP_DIR/docker/postgres_$TIMESTAMP.sql"
        docker run --rm \
            -v quest_postgres_data:/data \
            -v "$BACKUP_DIR/docker":/backup \
            postgres:15-alpine \
            sh -c "pg_dump -h localhost -U quest_user -d quest_management > /backup/postgres_$TIMESTAMP.sql"
        
        gzip "$postgres_backup"
        print_status "Docker PostgreSQL volume backed up"
    fi
    
    # Backup Redis volume
    if docker volume ls | grep -q "quest_redis_data"; then
        local redis_backup="$BACKUP_DIR/docker/redis_$TIMESTAMP.rdb"
        docker run --rm \
            -v quest_redis_data:/data \
            -v "$BACKUP_DIR/docker":/backup \
            redis:7-alpine \
            sh -c "redis-cli --rdb /data/dump.rdb SAVE /backup/redis_$TIMESTAMP.rdb"
        
        gzip "$redis_backup"
        print_status "Docker Redis volume backed up"
    fi
}

# Create backup manifest
create_manifest() {
    print_info "Creating backup manifest..."
    
    local manifest_file="$BACKUP_DIR/manifest_$TIMESTAMP.json"
    
    cat > "$manifest_file" << EOF
{
  "backup_timestamp": "$TIMESTAMP",
  "backup_date": "$(date -Iseconds)",
  "project_name": "$PROJECT_NAME",
  "backup_type": "full",
  "files": {
    "database": "quest_management_$TIMESTAMP.sql.gz",
    "uploads": "uploads_$TIMESTAMP.tar.gz",
    "config": "config_$TIMESTAMP.tar.gz",
    "logs": "logs_$TIMESTAMP.tar.gz"
  },
  "system_info": {
    "hostname": "$(hostname)",
    "user": "$(whoami)",
    "os": "$(uname -s)",
    "kernel": "$(uname -r)"
  },
  "versions": {
    "node": "$(node --version 2>/dev/null || echo 'not installed')",
    "npm": "$(npm --version 2>/dev/null || echo 'not installed')",
    "docker": "$(docker --version 2>/dev/null || echo 'not installed')",
    "postgresql": "$(psql --version 2>/dev/null || echo 'not installed')",
    "git": "$(git --version 2>/dev/null || echo 'not installed')"
  }
}
EOF
    
    print_status "Backup manifest created: $manifest_file"
}

# Clean old backups
clean_old_backups() {
    print_info "Cleaning old backups (older than $RETENTION_DAYS days)..."
    
    local deleted_count=0
    
    # Find and delete old backup files
    find "$BACKUP_DIR" -name "*_$TIMESTAMP*" -type f -mtime +$RETENTION_DAYS -delete -print | while read file; do
        print_warning "Deleted old backup: $file"
        ((deleted_count++))
    done
    
    # Find and delete old backup directories
    find "$BACKUP_DIR" -name "config_*" -type d -mtime +$RETENTION_DAYS -exec rm -rf {} + -print | while read dir; do
        print_warning "Deleted old backup directory: $dir"
        ((deleted_count++))
    done
    
    if [ $deleted_count -gt 0 ]; then
        print_status "Cleaned $deleted_count old backup files"
    else
        print_status "No old backups to clean"
    fi
}

# Verify backup integrity
verify_backup() {
    print_info "Verifying backup integrity..."
    
    local errors=0
    
    # Check database backup
    if [ ! -f "$BACKUP_DIR/database/quest_management_$TIMESTAMP.sql.gz" ]; then
        print_error "Database backup file missing"
        ((errors++))
    fi
    
    # Check uploads backup
    if [ ! -f "$BACKUP_DIR/uploads/uploads_$TIMESTAMP.tar.gz" ]; then
        print_error "Uploads backup file missing"
        ((errors++))
    fi
    
    # Check config backup
    if [ ! -f "$BACKUP_DIR/config/config_$TIMESTAMP.tar.gz" ]; then
        print_error "Configuration backup file missing"
        ((errors++))
    fi
    
    # Check manifest
    if [ ! -f "$BACKUP_DIR/manifest_$TIMESTAMP.json" ]; then
        print_error "Backup manifest file missing"
        ((errors++))
    fi
    
    if [ $errors -eq 0 ]; then
        print_status "Backup integrity verified successfully"
    else
        print_error "Backup integrity check failed with $errors errors"
        return 1
    fi
}

# List available backups
list_backups() {
    print_info "Available backups in $BACKUP_DIR:"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        print_warning "Backup directory does not exist"
        return 1
    fi
    
    echo ""
    printf "%-20s %-20s %-15s %-20s\n" "TIMESTAMP" "TYPE" "SIZE" "FILES"
    echo "--------------------------------------------------------------------------------"
    
    # List backup manifests
    find "$BACKUP_DIR" -name "manifest_*.json" -type f | sort -r | while read manifest; do
        local timestamp=$(basename "$manifest" | sed 's/manifest_\(.*\)\.json/\1/')
        local backup_date=$(jq -r '.backup_date' "$manifest" 2>/dev/null || echo "unknown")
        local backup_type=$(jq -r '.backup_type' "$manifest" 2>/dev/null || echo "unknown")
        local backup_size=$(du -sh "$BACKUP_DIR" | cut -f1)
        
        printf "%-20s %-20s %-15s %-20s\n" "$timestamp" "$backup_type" "$backup_size" "manifest_$timestamp.json"
    done
}

# Restore from backup
restore_backup() {
    local backup_timestamp=$1
    
    if [ -z "$backup_timestamp" ]; then
        print_error "Backup timestamp required"
        echo "Usage: $0 restore <timestamp>"
        echo "Available timestamps:"
        list_backups
        return 1
    fi
    
    print_info "Restoring backup from: $backup_timestamp"
    
    local manifest_file="$BACKUP_DIR/manifest_$backup_timestamp.json"
    
    if [ ! -f "$manifest_file" ]; then
        print_error "Backup manifest not found: $manifest_file"
        return 1
    fi
    
    # Restore database
    if [ -f "$BACKUP_DIR/database/quest_management_$backup_timestamp.sql.gz" ]; then
        print_info "Restoring database..."
        gunzip -c "$BACKUP_DIR/database/quest_management_$backup_timestamp.sql.gz" | psql -h localhost -p 5432 -U quest_user -d quest_management
        print_status "Database restored successfully"
    fi
    
    # Restore uploads
    if [ -f "$BACKUP_DIR/uploads/uploads_$backup_timestamp.tar.gz" ]; then
        print_info "Restoring uploads..."
        rm -rf ./uploads
        tar -xzf "$BACKUP_DIR/uploads/uploads_$backup_timestamp.tar.gz"
        print_status "Uploads restored successfully"
    fi
    
    # Restore configuration
    if [ -f "$BACKUP_DIR/config/config_$backup_timestamp.tar.gz" ]; then
        print_info "Restoring configuration..."
        tar -xzf "$BACKUP_DIR/config/config_$backup_timestamp.tar.gz"
        
        # Copy configuration files back
        if [ -f "config_$backup_timestamp/backend.env" ]; then
            cp "config_$backup_timestamp/backend.env" ./backend/.env
        fi
        
        if [ -f "config_$backup_timestamp/frontend.env" ]; then
            cp "config_$backup_timestamp/frontend.env" ./frontend/.env
        fi
        
        print_status "Configuration restored successfully"
    fi
    
    print_status "Backup restoration completed successfully"
}

# Main backup function
main() {
    local action=${1:-backup}
    
    print_info "Starting Quest Management System backup..."
    
    case "$action" in
        "backup")
            create_backup_dir
            backup_database
            backup_uploads
            backup_config
            backup_logs
            backup_docker_volumes
            create_manifest
            verify_backup
            clean_old_backups
            ;;
        "list")
            list_backups
            ;;
        "restore")
            restore_backup "$2"
            ;;
        "clean")
            clean_old_backups
            ;;
        *)
            echo "Usage: $0 {backup|list|restore|clean} [timestamp]"
            echo ""
            echo "Commands:"
            echo "  backup              Create a full backup"
            echo "  list                List available backups"
            echo "  restore <timestamp>  Restore from specific backup"
            echo "  clean               Clean old backups"
            echo ""
            echo "Examples:"
            echo "  $0 backup"
            echo "  $0 list"
            echo "  $0 restore 20231201_120000"
            echo "  $0 clean"
            exit 1
            ;;
    esac
    
    print_status "Backup operation completed successfully!"
}

# Run main function
main "$@"
