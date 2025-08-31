#!/bin/bash

# SSL Deployment Script for Industria.ma
# This script automates the SSL certificate generation and nginx configuration

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="industria.ma"
EMAIL="admin@industria.ma"
NGINX_CONTAINER="industria-nginx"
CONFIG_PATH="./nginx/sites-available"
HTTP_CONFIG="industria.ma.conf"
HTTPS_CONFIG="industria.ma.final.conf"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if container is running
check_container() {
    if ! docker ps | grep -q "$NGINX_CONTAINER"; then
        print_error "Nginx container ($NGINX_CONTAINER) is not running!"
        print_status "Starting nginx container..."
        docker compose up -d nginx
        sleep 5
    fi
}

# Function to test nginx configuration
test_nginx_config() {
    print_status "Testing nginx configuration..."
    if docker exec $NGINX_CONTAINER nginx -t; then
        print_success "Nginx configuration is valid"
        return 0
    else
        print_error "Nginx configuration test failed!"
        return 1
    fi
}

# Function to reload nginx
reload_nginx() {
    print_status "Reloading nginx..."
    if docker exec $NGINX_CONTAINER nginx -s reload; then
        print_success "Nginx reloaded successfully"
    else
        print_error "Failed to reload nginx"
        exit 1
    fi
}

# Main deployment function
main() {
    print_status "Starting SSL deployment for $DOMAIN"
    echo "================================================="
    
    # Step 1: Check if containers are running
    print_status "Step 1: Checking containers..."
    check_container
    
    # Step 2: Copy HTTP-only config first
    print_status "Step 2: Setting up HTTP-only configuration..."
    if [[ ! -f "$CONFIG_PATH/$HTTP_CONFIG" ]]; then
        print_error "HTTP config file not found: $CONFIG_PATH/$HTTP_CONFIG"
        exit 1
    fi
    
    docker cp "$CONFIG_PATH/$HTTP_CONFIG" "$NGINX_CONTAINER:/etc/nginx/conf.d/default.conf"
    print_success "HTTP config copied"
    
    # Test and reload with HTTP config
    if test_nginx_config; then
        reload_nginx
    else
        exit 1
    fi
    
    # Step 3: Create test directory and file for ACME challenge
    print_status "Step 3: Setting up ACME challenge directory..."
    docker exec $NGINX_CONTAINER mkdir -p /var/www/certbot/.well-known/acme-challenge/
    docker exec $NGINX_CONTAINER sh -c 'echo "test" > /var/www/certbot/.well-known/acme-challenge/test'
    print_success "ACME challenge directory created"
    
    # Step 4: Test ACME challenge accessibility
    print_status "Step 4: Testing ACME challenge accessibility..."
    sleep 5  # Wait for nginx to fully reload
    
    if curl -f --connect-timeout 10 "http://$DOMAIN/.well-known/acme-challenge/test" >/dev/null 2>&1; then
        print_success "ACME challenge test passed"
    else
        print_warning "ACME challenge test failed, but continuing anyway..."
        print_warning "Make sure your domain $DOMAIN points to this server"
    fi
    
    # Step 5: Generate SSL certificates
    print_status "Step 5: Generating SSL certificates..."
    if docker compose run --rm certbot certonly \
        --webroot -w /var/www/certbot \
        -d $DOMAIN \
        --email $EMAIL \
        --agree-tos --no-eff-email; then
        print_success "SSL certificates generated successfully"
    else
        print_error "Failed to generate SSL certificates"
        exit 1
    fi
    
    # Step 6: Verify certificates exist
    print_status "Step 6: Verifying certificates..."
    if docker exec $NGINX_CONTAINER ls -la /etc/letsencrypt/live/$DOMAIN/ | grep -E "(fullchain|privkey)\.pem"; then
        print_success "SSL certificates verified"
    else
        print_error "SSL certificates not found!"
        exit 1
    fi
    
    # Step 7: Copy HTTPS configuration
    print_status "Step 7: Setting up HTTPS configuration..."
    if [[ ! -f "$CONFIG_PATH/$HTTPS_CONFIG" ]]; then
        print_error "HTTPS config file not found: $CONFIG_PATH/$HTTPS_CONFIG"
        exit 1
    fi
    
    docker cp "$CONFIG_PATH/$HTTPS_CONFIG" "$NGINX_CONTAINER:/etc/nginx/conf.d/default.conf"
    print_success "HTTPS config copied"
    
    # Step 8: Test and reload with HTTPS config
    print_status "Step 8: Testing and applying HTTPS configuration..."
    if test_nginx_config; then
        reload_nginx
    else
        print_error "HTTPS configuration failed! Rolling back to HTTP config..."
        docker cp "$CONFIG_PATH/$HTTP_CONFIG" "$NGINX_CONTAINER:/etc/nginx/conf.d/default.conf"
        reload_nginx
        exit 1
    fi
    
    # Step 9: Final verification
    print_status "Step 9: Final verification..."
    sleep 5  # Wait for nginx to fully reload
    
    if curl -f --connect-timeout 10 -k "https://$DOMAIN" >/dev/null 2>&1; then
        print_success "HTTPS is working!"
    else
        print_warning "HTTPS test failed, but configuration was applied"
    fi
    
    # Clean up test file
    docker exec $NGINX_CONTAINER rm -f /var/www/certbot/.well-known/acme-challenge/test >/dev/null 2>&1 || true
    
    # Success message
    echo "================================================="
    print_success "SSL deployment completed successfully!"
    print_success "Your site should now be accessible at: https://$DOMAIN"
    echo ""
    print_status "Next steps:"
    echo "  1. Test your site: curl -I https://$DOMAIN"
    echo "  2. Set up auto-renewal: add this to crontab:"
    echo "     0 12 * * * cd $(pwd) && docker compose run --rm certbot renew --quiet && docker exec $NGINX_CONTAINER nginx -s reload"
    echo ""
}

# Check if we're in the right directory
if [[ ! -f "docker-compose.yml" ]] && [[ ! -f "docker-compose.yaml" ]]; then
    print_error "docker-compose.yml not found. Please run this script from your project root directory."
    exit 1
fi

# Run main function
main "$@"