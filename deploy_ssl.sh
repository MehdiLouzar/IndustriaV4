#!/bin/bash

# SSL Deployment Script for Industria.ma with Gandi Certificates
# This script automates the nginx configuration with existing Gandi SSL certificates

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="industria.ma"
NGINX_CONTAINER="industria-nginx"
CONFIG_PATH="./nginx/sites-available"
HTTP_CONFIG="industria.ma.conf"
HTTPS_CONFIG="industria.ma.final.conf"

# SSL Certificate paths
SSL_CERT_PATH="/etc/nginx/ssl"  # Where certificates will be stored in container
HOST_CERT_PATH="./ssl"  # Where certificates are stored on host (create this directory)

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

# Function to setup SSL certificates directory and files
setup_ssl_certificates() {
    print_status "Setting up SSL certificates..."
    
    # Create SSL directory on host if it doesn't exist
    if [[ ! -d "$HOST_CERT_PATH" ]]; then
        print_status "Creating SSL directory: $HOST_CERT_PATH"
        mkdir -p "$HOST_CERT_PATH"
    fi
    
    # Check if certificate files exist
    if [[ ! -f "$HOST_CERT_PATH/industria.ma.crt" ]] || [[ ! -f "$HOST_CERT_PATH/industria.ma.key" ]]; then
        print_warning "SSL certificate files not found in $HOST_CERT_PATH/"
        print_status "Please copy your Gandi certificate files to:"
        echo "  $HOST_CERT_PATH/industria.ma.crt  (certificate file)"
        echo "  $HOST_CERT_PATH/industria.ma.key  (private key file)"
        echo ""
        print_status "If you have different file names, you can copy them like this:"
        echo "  cp /path/to/your/certificate.crt $HOST_CERT_PATH/industria.ma.crt"
        echo "  cp /path/to/your/private.key $HOST_CERT_PATH/industria.ma.key"
        echo ""
        read -p "Have you copied the certificate files? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Please copy the certificate files first"
            exit 1
        fi
    fi
    
    # Verify files exist now
    if [[ ! -f "$HOST_CERT_PATH/industria.ma.crt" ]]; then
        print_error "Certificate file not found: $HOST_CERT_PATH/industria.ma.crt"
        exit 1
    fi
    
    if [[ ! -f "$HOST_CERT_PATH/industria.ma.key" ]]; then
        print_error "Private key file not found: $HOST_CERT_PATH/industria.ma.key"
        exit 1
    fi
    
    print_success "SSL certificate files found"
}

# Function to copy SSL certificates to container
copy_ssl_certificates() {
    print_status "Copying SSL certificates to nginx container..."
    
    # Create SSL directory in container
    docker exec $NGINX_CONTAINER mkdir -p $SSL_CERT_PATH
    
    # Copy certificate files to container
    docker cp "$HOST_CERT_PATH/industria.ma.crt" "$NGINX_CONTAINER:$SSL_CERT_PATH/industria.ma.crt"
    docker cp "$HOST_CERT_PATH/industria.ma.key" "$NGINX_CONTAINER:$SSL_CERT_PATH/industria.ma.key"
    
    # Set proper permissions
    docker exec $NGINX_CONTAINER chmod 644 "$SSL_CERT_PATH/industria.ma.crt"
    docker exec $NGINX_CONTAINER chmod 600 "$SSL_CERT_PATH/industria.ma.key"
    
    # Verify files were copied
    if docker exec $NGINX_CONTAINER ls -la "$SSL_CERT_PATH/" | grep -E "(industria.ma\.(crt|key))"; then
        print_success "SSL certificates copied to container"
    else
        print_error "Failed to copy SSL certificates"
        exit 1
    fi
}



# Main deployment function
main() {
    print_status "Starting SSL deployment for $DOMAIN with Gandi certificates"
    echo "================================================="
    
    # Step 1: Check if containers are running
    print_status "Step 1: Checking containers..."
    check_container
    
    # Step 2: Setup SSL certificates
    print_status "Step 2: Setting up SSL certificates..."
    setup_ssl_certificates
    
    # Step 3: Copy certificates to container
    print_status "Step 3: Copying certificates to container..."
    copy_ssl_certificates
    
    # Step 4: Create HTTPS configuration
    print_status "Step 4: Creating HTTPS configuration..."
    create_https_config
    
    # Step 5: Apply HTTPS configuration
    print_status "Step 5: Applying HTTPS configuration..."
    docker cp "$CONFIG_PATH/industria.ma.final.conf" "$NGINX_CONTAINER:/etc/nginx/conf.d/default.conf"
    print_success "HTTPS config applied"
    
    # Step 6: Test and reload nginx
    print_status "Step 6: Testing and reloading nginx..."
    if test_nginx_config; then
        reload_nginx
    else
        print_error "HTTPS configuration failed!"
        # Try to rollback if HTTP config exists
        if [[ -f "$CONFIG_PATH/$HTTP_CONFIG" ]]; then
            print_status "Rolling back to HTTP configuration..."
            docker cp "$CONFIG_PATH/$HTTP_CONFIG" "$NGINX_CONTAINER:/etc/nginx/conf.d/default.conf"
            reload_nginx
        fi
        exit 1
    fi
    
    # Step 7: Final verification
    print_status "Step 7: Final verification..."
    sleep 5  # Wait for nginx to fully reload
    
    if curl -f --connect-timeout 10 -k "https://$DOMAIN" >/dev/null 2>&1; then
        print_success "HTTPS is working!"
    else
        print_warning "HTTPS test failed, but configuration was applied"
        print_status "You can test manually with: curl -I https://$DOMAIN"
    fi
    
    # Success message
    echo "================================================="
    print_success "SSL deployment completed successfully!"
    print_success "Your site should now be accessible at: https://$DOMAIN"
    echo ""
    print_status "Configuration files created:"
    echo "  - $CONFIG_PATH/industria.ma.https.conf"
    echo "  - SSL certificates in container: $SSL_CERT_PATH/"
    echo ""
    print_status "Test your deployment:"
    echo "  curl -I https://$DOMAIN"
    echo "  curl -I http://$DOMAIN  # Should redirect to HTTPS"
    echo ""
}

# Check if we're in the right directory
if [[ ! -f "docker-compose.yml" ]] && [[ ! -f "docker-compose.yaml" ]]; then
    print_error "docker-compose.yml not found. Please run this script from your project root directory."
    exit 1
fi

# Run main function
main "$@"
