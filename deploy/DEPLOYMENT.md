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

# Install Node.js (via nvm recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

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
GRANT ALL PRIVILEGES ON DATABASE giftlist TO giftadmin;
\q
```

## Step 3: Application Deployment

```bash
# Create application directory
sudo mkdir -p /opt/gift-app
sudo chown $USER:$USER /opt/gift-app

# Clone and build
cd /opt/gift-app
git clone https://github.com/AlfredJKwack/BuyMyLove-GiftLIst.git .
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
- `JWT_SECRET` with a random secure string
- `ANON_KEY` and `NEXT_PUBLIC_ANON_KEY` with same random string
- SMTP settings for email
- `ADMIN_PASSWORD_HASH` (generate with bcrypt)

Generate admin password hash:
```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourAdminPassword', 10));"
```

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
cd /opt/gift-app
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

## Performance Optimization

1. **Enable Redis caching** (future enhancement)
2. **Use CDN** for static assets
3. **Enable HTTP/2** in Caddy (enabled by default)
4. **Database indexing** for large datasets
5. **Image optimization** is handled by Sharp

## Scaling Considerations

For high traffic:
1. Use a load balancer
2. Run multiple app instances
3. Use connection pooling for PostgreSQL
4. Consider read replicas for database
5. Implement caching layer (Redis)
