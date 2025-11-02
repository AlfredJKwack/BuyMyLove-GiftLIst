# Technical Specification

## Target Stack (Self-Hosted, No External Services)

| Concern | Implementation |
|---------|---------------|
| Web Framework | Next.js 14 (SSR/SSG hybrid with Pages Router) |
| Database | PostgreSQL 14+ |
| DB Access Layer | postgres.js client + Drizzle ORM (type-safe queries and migrations) |
| Image Processing | sharp (server-side resizing and optimization) |
| File Upload Handling | formidable (multipart form parsing) |
| Static File Storage | Local filesystem at `public/uploads/` |
| Reverse Proxy | Caddy (automatic HTTPS via Let's Encrypt) |
| HTTPS | Caddy-managed TLS certificates |
| Process Manager | systemd service |
| Email | nodemailer with SMTP (for OTP authentication) |
| Session Management | JWT tokens in HTTP-only cookies |
| Visitor Tracking | UUID cookies with `__Host-` prefix |

---

## Project Structure

```
/usr/local/share/gift-app/
├── public/
│   └── uploads/              # Uploaded and resized images
├── pages/
│   ├── _app.js              # Next.js app wrapper
│   ├── _document.js         # Custom document
│   ├── index.js             # Main gift list page
│   └── api/
│       ├── gifts.js         # GET all gifts with visitor-specific toggle state
│       ├── gift.js          # POST/DELETE gift (admin only)
│       ├── toggle.js        # POST toggle bought status (visitor-specific)
│       ├── upload.js        # POST image upload (admin only)
│       └── auth/
│           ├── login.js     # POST request OTP via email
│           ├── verify.js    # GET verify OTP token and set JWT
│           ├── logout.js    # POST clear JWT cookie
│           └── me.js        # GET current admin status
├── components/
│   ├── AuthModal.js         # Admin login interface
│   ├── GiftCard.js          # Individual gift display
│   ├── GiftFormModal.js     # Add/edit gift form
│   └── GiftList.js          # Main gift list container
├── lib/
│   ├── db.js                # Drizzle database instance
│   ├── auth.js              # JWT token generation/verification
│   └── email.js             # OTP email sending via nodemailer
├── database/
│   ├── schema.js            # Drizzle schema definitions
│   ├── migrate.js           # Migration runner
│   └── migrations/          # Generated SQL migrations
├── styles/                  # Modular CSS (base, components, layout, utils)
├── deploy/
│   ├── DEPLOYMENT.md        # Deployment guide
│   ├── Caddyfile.example    # Caddy reverse proxy config
│   └── systemd-service.example
├── scripts/
│   └── loadEnv.js           # Environment loader for migrations
└── tests/
    └── api.test.js          # API endpoint tests (placeholder)
```

---

## Implementation Details

### 1. Next.js Application

**Framework**: Next.js 14 with Pages Router
- SSR enabled for dynamic content
- Built-in API routes for all backend logic
- React 18 for frontend components

**Development**: `npm run dev`
**Production**: `npm run build && npm start`
**Process Management**: systemd service

### 2. PostgreSQL Database

**Installation**: Via APT or Docker container bound to localhost
**Database**: `giftlist`
**User**: `giftadmin`
**Access Control**: `pg_hba.conf` configured for localhost-only access

**Schema Management**: Drizzle Kit
- `npm run db:generate` - Generate migrations
- `npm run db:migrate` - Run migrations
- `npm run db:setup` - Full setup (generate + migrate)

### 3. Database Schema (Drizzle ORM)

**Tables**:

**gifts**
- id (serial, PK)
- title (text, required)
- note (text, optional)
- url (text, optional)
- imageUrl (text, optional)
- createdAt (timestamp)

**toggles**
- id (serial, PK)
- giftId (serial, FK to gifts with cascade delete)
- visitorId (uuid)
- bought (boolean, default false)
- createdAt (timestamp)
- Unique constraint: (giftId, visitorId)

**visitorLogs**
- id (serial, PK)
- visitorId (uuid)
- visitDate (timestamp)

**settings**
- id (serial, PK)
- key (text, unique)
- value (text)
- updatedAt (timestamp)

**otpTokens**
- id (serial, PK)
- email (text)
- token (text, unique)
- expiresAt (timestamp)
- used (boolean, default false)
- createdAt (timestamp)

### 4. Image Upload & Processing

**API Route**: `/api/upload` (admin-only)
- Uses formidable to parse multipart form data
- Validates file type using file-type library
- Resizes images to max 800px width using sharp
- Saves to `public/uploads/` with unique UUID filenames
- Returns public URL path

**Storage**: Local filesystem at `/usr/local/share/gift-app/public/uploads`

**Serving**: Caddy serves uploads directly for performance:
```caddyfile
handle_path /uploads/* {
  root * /usr/local/share/gift-app/public/uploads
  file_server
}
```

**File Permissions**:
- Directory: 755 (rwxr-xr-x) owned by www-data
- Files: 644 (rw-r--r--) owned by www-data

### 5. Visitor Tracking & Cookies

**Visitor Identification**:
- UUID generated on first visit
- Stored in `__Host-visitor_id` cookie (secure, HTTP-only)
- Falls back to legacy `visitor_id` cookie for backward compatibility

**Cookie Security**:
- `__Host-` prefix ensures cookie is secure and path-scoped
- HTTP-only prevents JavaScript access
- SameSite=Strict for CSRF protection

**Visitor Logging**:
- Each visit logged to `visitorLogs` table
- Used for daily visitor count (future feature)

### 6. Admin Authentication

**Method**: Email-based OTP (One-Time Password) via JWT

**Flow**:
1. Admin enters email at `/api/auth/login`
2. System generates random OTP token, stores in `otpTokens` table (15min expiry)
3. Email sent via nodemailer with magic link
4. User clicks link → `/api/auth/verify?token=...`
5. System validates token, generates JWT, sets `__Host-admin_token` cookie (7-day expiry)
6. JWT verified on protected routes via `requireAdmin` middleware

**Environment Variables**:
- `ADMIN_EMAILS`: Comma-separated list of authorized admin emails
- `JWT_SECRET`: Secret key for JWT signing/verification
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Email server config
- `SMTP_FROM`: Sender email address
- `APP_URL`: Base URL for magic links

**Protected Routes**:
- `/api/gift` (POST, DELETE)
- `/api/upload` (POST)

### 7. Toggle (Bought Status) System

**Per-Visitor State**:
- Each visitor has independent toggle state per gift
- Stored in `toggles` table with (giftId, visitorId) unique constraint
- Global bought status determined by ANY visitor marking it bought

**API Logic** (`/api/toggle`):
- POST with giftId
- Creates/updates toggle record for current visitor
- Returns success status

**Display Logic** (`/api/gifts`):
- Fetches all gifts
- Fetches all bought toggles
- Marks gift as bought if ANY visitor toggled it
- Includes `canToggle` flag (true if visitor owns the toggle or gift not bought)

### 8. Deployment Configuration

**Location**: `/usr/local/share/gift-app/`

**Systemd Service**: `/etc/systemd/system/giftlist.service`
```ini
[Unit]
Description=Gift List App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/usr/local/share/gift-app
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

**Caddy Configuration**: `/etc/caddy/Caddyfile`
```caddyfile
gift.example.com {
  reverse_proxy [::1]:3000
  
  handle_path /uploads/* {
    root * /usr/local/share/gift-app/public/uploads
    file_server
  }
  
  header {
    X-Frame-Options "SAMEORIGIN"
    X-Content-Type-Options "nosniff"
    X-XSS-Protection "1; mode=block"
    Referrer-Policy "strict-origin-when-cross-origin"
  }
  
  encode gzip
}
```

### 9. Security Measures

**Database**:
- PostgreSQL configured for localhost-only connections
- No remote access allowed

**File Uploads**:
- File type validation (MIME type checking)
- Size limit enforced (configurable, default ~5MB)
- Filename sanitization (UUID-based names)
- Admin-only access

**Authentication**:
- JWT with 7-day expiration
- HTTP-only cookies prevent XSS
- `__Host-` prefix ensures secure transmission
- OTP tokens expire in 15 minutes
- Single-use OTP tokens

**Headers** (via Caddy):
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

**Secrets**:
- `.env.local` never committed to git
- Environment variables loaded at runtime
- JWT_SECRET required for operation

### 10. Dependencies

**Core**:
- next@^14.2.33
- react@^18.3.1
- postgres@^3.4.7
- drizzle-orm@^0.44.7

**Authentication**:
- jsonwebtoken@^9.0.2
- bcryptjs@^3.0.2 (for future password hashing if needed)
- cookie@^1.0.2

**File Handling**:
- formidable@^3.5.4
- sharp@^0.34.4
- file-type@^21.0.0

**Email**:
- nodemailer@^7.0.10

**Utilities**:
- uuid@^13.0.0
- dotenv@^17.2.3

**Dev Tools**:
- drizzle-kit@^0.31.6
- typescript@^5.9.3
- @types/* packages for type definitions

---

## Maintenance & Operations

**Logs**:
```bash
# Application logs
sudo journalctl -u giftlist -f

# Caddy logs
sudo journalctl -u caddy -f
```

**Updates**:
```bash
cd /usr/local/share/gift-app
git pull
npm install
npm run build
sudo systemctl restart giftlist
```

**Database Backups**:
```bash
# Create backup
pg_dump -U giftadmin giftlist > backup_$(date +%Y%m%d).sql

# Restore
psql -U giftadmin giftlist < backup_20250101.sql
```

---

## Future Enhancements

**Throttling System** (Not Yet Implemented):
- Daily visitor count tracking
- Read-only mode flag in `settings` table
- Middleware to block anonymous writes when threshold exceeded
- Email alerts via nodemailer when limit reached

**Testing**:
- API endpoint tests (placeholder exists at `tests/api.test.js`)
- Frontend component tests
- E2E tests with Playwright/Cypress

**Monitoring**:
- Usage metrics table
- Prometheus/Node exporter integration
- Uptime monitoring

---

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/gifts` | GET | None | Get all gifts with visitor-specific toggle state |
| `/api/gift` | POST | Admin | Create new gift |
| `/api/gift` | DELETE | Admin | Delete gift by ID |
| `/api/toggle` | POST | None | Toggle bought status for visitor |
| `/api/upload` | POST | Admin | Upload and process image |
| `/api/auth/login` | POST | None | Request OTP via email |
| `/api/auth/verify` | GET | None | Verify OTP and set JWT cookie |
| `/api/auth/logout` | POST | None | Clear JWT cookie |
| `/api/auth/me` | GET | None | Check current admin status |

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgres://giftadmin:password@localhost:5432/giftlist

# Admin Authentication
ADMIN_EMAILS=admin@example.com,admin2@example.com
JWT_SECRET=your-random-secret-minimum-32-characters

# SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@example.com

# Application
APP_URL=https://gift.example.com
NODE_ENV=production
