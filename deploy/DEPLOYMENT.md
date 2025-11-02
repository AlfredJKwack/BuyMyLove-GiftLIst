# Deployment Guide

## Prerequisites

- Linux server (Ubuntu/Debian recommended)
- PostgreSQL 14+
- Node.js 18+
- Caddy web server (or nginx/apache)
- SMTP server access

## Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Node.js 
sudo apt install nodejs npm

# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

## Step 2: Database Setup

```bash
# Create PostgreSQL user and database
sudo -u postgres psql

CREATE DATABASE giftlist;
CREATE USER giftadmin WITH PASSWORD 'your-secure-password';
ALTER DATABASE giftlist OWNER TO giftadmin;
\q
```

## Step 3: Application Deployment

```bash
# Create application directory
sudo mkdir -p /usr/local/share/gift-app
sudo chown $USER:$USER /usr/local/share/gift-app

# Clone just what you need and build
cd /usr/local/share/gift-app
git clone --depth 1 --branch main --single-branch https://github.com/AlfredJKwack/BuyMyLove-GiftLIst.git .
npm install
npm run build
```

## Step 4: Environment Configuration

```bash
# Copy and edit environment file
cp .env.local.example .env.local
nano .env.local
```

Update:
- `DATABASE_URL` with your PostgreSQL connection string
- `ADMIN_EMAILS` with the email addresses of the admins.
- `JWT_SECRET` with a random secure string
- SMTP settings for email
- `APP_URL`  so that for email links are correct (e.g., https://gifts.yourdomain.com for dev)no

## Step 5: Database Migration

```bash
npm run db:setup
```

## Step 6: Systemd Service

```bash
# Copy service file
sudo cp deploy/systemd-service.example /etc/systemd/system/giftlist.service

# Edit service file if needed
sudo nano /etc/systemd/system/giftlist.service

# Enable and start service
sudo systemctl enable giftlist
sudo systemctl start giftlist

# Check status
sudo systemctl status giftlist

# Ensure www-data user (set in Systemd file) has ownership to the uploads
sudo chown -R www-data:www-data /usr/local/share/gift-app/public/uploads
# Owner has rwx, group has rx and others have rx on the directory
sudo find /usr/local/share/gift-app/public/uploads -type d -exec chmod 755 {} \;
# Owner has rw, group has r and others have r on the files
sudo find /usr/local/share/gift-app/public/uploads -type f -exec chmod 644 {} \;

```

## Step 7: Caddy Configuration

```bash
# Backup existing Caddyfile
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup

# Add gift list configuration
sudo nano /etc/caddy/Caddyfile
```

Add the configuration from `deploy/Caddyfile.example`, replacing `gift.example.com` with your domain.

```bash
# Reload Caddy
sudo systemctl reload caddy
```

## Step 8: Firewall Configuration

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall if not already enabled
sudo ufw enable
```

## Verification

1. Visit your domain: `https://gift.example.com`
2. Test admin login with your configured email
3. Add a test gift
4. Test anonymous toggle functionality

## Maintenance

### View Logs

```bash
# Application logs
sudo journalctl -u giftlist -f

# Caddy logs
sudo journalctl -u caddy -f
```

### Update Application

```bash
cd /usr/local/share/gift-app
git pull
npm install
npm run build
sudo systemctl restart giftlist
```

### Backup Database

```bash
# Create backup
pg_dump -U giftadmin giftlist > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U giftadmin giftlist < backup_20250101.sql
```

## Security Recommendations

1. **Firewall**: Only expose necessary ports (80, 443)
2. **SSL/TLS**: Caddy handles this automatically with Let's Encrypt
3. **Database**: Ensure PostgreSQL only listens on localhost
4. **Secrets**: Never commit `.env.local` to git
5. **Updates**: Regularly update system packages and dependencies
6. **Backups**: Set up automated database backups
7. **Monitoring**: Consider setting up uptime monitoring

## Troubleshooting

### Application won't start
```bash
# Check logs
sudo journalctl -u giftlist -n 50

# Verify environment variables
sudo systemctl status giftlist
```

### Database connection issues
```bash
# Test connection
psql -U giftadmin -d giftlist -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql
```

### Email not sending
- Verify SMTP credentials in `.env.local`
- Check if SMTP port (587/465) is accessible
- Review application logs for email errors

