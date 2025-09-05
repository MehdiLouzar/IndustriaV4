#!/bin/bash
set -euo pipefail

# ========= config =========
DOMAIN="industria.ma"
NGINX_CONTAINER="industria-nginx"

HOST_SSL_DIR="./ssl"
CONTAINER_SSL_DIR="/etc/nginx/ssl"

VHOST_HTTP="./nginx/sites-available/industria.ma.conf"      # your base vhost file
VHOST_DST="/etc/nginx/conf.d/default.conf"
# =========================

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info(){ echo -e "${BLUE}[INFO]${NC} $*"; }
ok(){ echo -e "${GREEN}[SUCCESS]${NC} $*"; }
warn(){ echo -e "${YELLOW}[WARNING]${NC} $*"; }
err(){ echo -e "${RED}[ERROR]${NC} $*"; }

need_file(){ [[ -f "$1" ]] || { err "Missing file: $1"; exit 1; } }

ensure_container() {
  if ! docker ps --format '{{.Names}}' | grep -qx "$NGINX_CONTAINER"; then
    info "Starting nginx container: $NGINX_CONTAINER"
    docker compose up -d nginx
    sleep 3
  fi
}

prepare_certs() {
  info "Preparing certificates in $HOST_SSL_DIR"

  mkdir -p "$HOST_SSL_DIR"

  # Normalize file names from your Gandi zip
  if [[ -f "$HOST_SSL_DIR/industria_ma.crt" && ! -f "$HOST_SSL_DIR/industria.ma.crt" ]]; then
    cp "$HOST_SSL_DIR/industria_ma.crt" "$HOST_SSL_DIR/industria.ma.crt"
  fi

  need_file "$HOST_SSL_DIR/industria.ma.crt"
  need_file "$HOST_SSL_DIR/industria.ma.key"

  # Intermediates from your zip (names as shown)
  local INT1="$HOST_SSL_DIR/GENIOUSRSADomainValidationSecureServerCA.crt"
  local INT2="$HOST_SSL_DIR/USERTrustRSAAAACA.crt"
  local ROOT="$HOST_SSL_DIR/AAACertificateServices.crt"   # not used in chain

  # Build fullchain if we have both intermediates
  if [[ -f "$INT1" && -f "$INT2" ]]; then
    cat "$HOST_SSL_DIR/industria.ma.crt" "$INT1" "$INT2" > "$HOST_SSL_DIR/industria.ma.fullchain.crt"
    ok "Built industria.ma.fullchain.crt (leaf + intermediates)"
  else
    warn "Intermediates not found. Using industria.ma.crt only. Some clients may fail chain validation."
    cp "$HOST_SSL_DIR/industria.ma.crt" "$HOST_SSL_DIR/industria.ma.fullchain.crt"
  fi

  # Optional: verify key/cert match
  local CH1 CH2
  CH1=$(openssl x509 -noout -modulus -in "$HOST_SSL_DIR/industria.ma.crt" | openssl md5)
  CH2=$(openssl rsa -noout -modulus -in "$HOST_SSL_DIR/industria.ma.key" | openssl md5)
  if [[ "$CH1" != "$CH2" ]]; then
    err "Certificate and private key do not match."
    exit 1
  fi
  ok "Certificate and key match"
}

verify_mounted_certs() {
  info "Verifying mounted certs inside container"
  docker exec "$NGINX_CONTAINER" sh -lc '
    test -r /etc/nginx/ssl/industria.ma.key &&
    test -r /etc/nginx/ssl/industria.ma.fullchain.crt &&
    test -r /etc/nginx/ssl/industria.ma.crt
  ' || { err "Mounted certs not found/readable in container"; exit 1; }
  ok "Mounted certs are present"
}

rewrite_vhost_paths() {
  info "Rewriting vhost TLS paths to /etc/nginx/ssl"
  need_file "$VHOST_HTTP"

  # Create a temp copy we can modify
  TMP_VHOST=$(mktemp)
  cp "$VHOST_HTTP" "$TMP_VHOST"

  # Replace any old Let's Encrypt paths with our mounted SSL paths
  sed -i 's#/etc/letsencrypt/live/industria\.ma/fullchain\.pem#/etc/nginx/ssl/industria.ma.fullchain.crt#g' "$TMP_VHOST"
  sed -i 's#/etc/letsencrypt/live/industria\.ma/privkey\.pem#/etc/nginx/ssl/industria.ma.key#g' "$TMP_VHOST"

  # If the file does not already have ssl_* directives, inject ours
  if ! grep -q 'ssl_certificate' "$TMP_VHOST"; then
    # Insert typical ssl directives into the 443 server block
    awk '
      BEGIN{in443=0}
      /server\s*{/{if (seen==0) seen=1}
      {print}
      /listen 443/ {in443=1}
      in443 && /server_name/ && !printed {
        print "    ssl_certificate           /etc/nginx/ssl/industria.ma.fullchain.crt;";
        print "    ssl_certificate_key       /etc/nginx/ssl/industria.ma.key;";
        print "    ssl_trusted_certificate   /etc/nginx/ssl/industria.ma.fullchain.crt;";
        printed=1
      }
      /}/{ if(in443){in443=0} }
    ' "$TMP_VHOST" > "${TMP_VHOST}.new" && mv "${TMP_VHOST}.new" "$TMP_VHOST"
  fi

  docker cp "$TMP_VHOST" "$NGINX_CONTAINER:$VHOST_DST"
  rm -f "$TMP_VHOST"
  ok "Vhost updated in container: $VHOST_DST"
}

test_and_reload() {
  info "Testing nginx config"
  if docker exec "$NGINX_CONTAINER" nginx -t; then
    ok "Config is valid"
    info "Reloading nginx"
    docker exec "$NGINX_CONTAINER" nginx -s reload
    ok "Nginx reloaded"
  else
    err "nginx -t failed. Rolling back to HTTP-only file."
    docker cp "$VHOST_HTTP" "$NGINX_CONTAINER:$VHOST_DST" || true
    docker exec "$NGINX_CONTAINER" nginx -s reload || true
    exit 1
  fi
}

verify_https() {
  info "Quick HTTPS check (may fail if DNS not pointed yet)"
  if curl -sSf -k "https://$DOMAIN" >/dev/null; then
    ok "HTTPS reachable for $DOMAIN"
  else
    warn "HTTPS probe did not succeed. Check DNS, firewall, or review nginx error log."
  fi
}

main() {
  info "Starting SSL deployment for $DOMAIN (Gandi certs, Nginx only)"
  ensure_container
  prepare_certs
  verify_mounted_certs
  rewrite_vhost_paths
  test_and_reload
  verify_https
  ok "Done"
}

main "$@"
