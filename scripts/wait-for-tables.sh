#!/bin/bash
# Script d'attente de la création des tables par Hibernate
set -euo pipefail

DB_HOST=${DB_HOST:-db}
DB_NAME=${DB_NAME:-industria}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
export PGPASSWORD="$DB_PASSWORD"

echo "🔍 Waiting for Hibernate to create tables..."

# Tables principales que nous attendons
REQUIRED_TABLES=(
    "users"
    "country"
    "region" 
    "zone_type"
    "zone"
    "parcel"
    "activity"
    "amenity"
    "spatial_reference_system"
)

check_table_exists() {
    local table_name=$1
    psql -h $DB_HOST -U $DB_USER -d $DB_NAME -tAc \
        "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='$table_name'" 2>/dev/null || echo ""
}

wait_for_all_tables() {
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        local all_tables_exist=true
        local missing_tables=()
        
        for table in "${REQUIRED_TABLES[@]}"; do
            if [ "$(check_table_exists $table)" != "1" ]; then
                all_tables_exist=false
                missing_tables+=($table)
            fi
        done
        
        if [ "$all_tables_exist" = true ]; then
            echo "✅ All required tables have been created by Hibernate!"
            return 0
        fi
        
        echo "   Attempt $attempt/$max_attempts - Missing tables: ${missing_tables[*]}"
        sleep 5
        ((attempt++))
    done
    
    echo "❌ Timeout: Not all tables were created within $((max_attempts * 5)) seconds"
    echo "   Missing tables: ${missing_tables[*]}"
    return 1
}

# Attendre d'abord que PostgreSQL soit accessible
echo "🔌 Checking PostgreSQL connection..."
while ! psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; do
    echo "   Waiting for PostgreSQL connection..."
    sleep 2
done
echo "✅ PostgreSQL connection established!"

# Attendre que les tables soient créées
wait_for_all_tables

echo "🎯 Database schema is ready for data initialization!"