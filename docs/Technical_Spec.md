
⸻

🧱 Target Stack (Self-Hosted, No External Services)

Concern	Recommendation
Web Framework	Next.js (SSR/SSG hybrid) or Express.js if no SSR needed
Database	PostgreSQL (installed locally, or in Docker)
DB Access Layer	Postgres.js + optional Drizzle ORM (for type safety + migrations)
Image Processing	sharp for server-side resizing
Static File Storage	Store uploaded/resized images on local disk (e.g. /var/www/gift-app/images)
Reverse Proxy	Use your existing Caddy setup to expose the app via a subdomain
HTTPS	Let Caddy manage TLS certificates automatically
Process Manager	systemd or pm2 to keep the Node app running
Email Alerts	Use msmtp or sendmail for simple system email (for alerting >12 visitors)
Daily Tasks	Use cron or systemd timers for throttling logic


⸻

🧩 Backend Folder Responsibilities

/opt/gift-app/
├── public/                   # Static frontend files
├── uploads/                 # Local image uploads (resized)
├── scripts/                 # Cron jobs, alerting scripts
├── database/
│   ├── migrations/          # SQL or drizzle schema definitions
├── src/
│   ├── pages/               # Next.js pages or API routes
│   ├── lib/                 # Postgres.js queries, image utils
│   ├── middleware/          # Cookie parsing, rate limiting


⸻

🔧 Technical Recommendations

1. Next.js
	•	Use full Next.js with app/ or pages/ dir
	•	Enable server-side rendering (SSR) for admin views
	•	Use built-in API routes (/api/toggle, /api/upload) for all backend logic

Run it with:
	•	npm run build && npm start in production
	•	Use systemd to daemonize

⸻

2. PostgreSQL Setup
	•	Install via APT or run in a Docker container bound to localhost
	•	Create a user and database (giftadmin, giftlist)
	•	Use pg_hba.conf to limit local-only access
	•	Use psql or Postgres.js to create tables manually or via schema builder (Drizzle)

⸻

3. Postgres.js + Drizzle (Optional)
	•	Postgres.js is low-overhead, secure, and fast
	•	Drizzle adds:
	•	Schema as code
	•	Safe migrations
	•	Typed queries

This is ideal for a one-dev project where traceability and type safety matter.

⸻

4. Local Image Uploads
	•	Handle file uploads via Next.js API route (/api/upload)
	•	Validate + resize using sharp
	•	Store under /opt/gift-app/uploads
	•	Serve via static route in Caddy:

gift.example.com {
  reverse_proxy localhost:3000
  handle_path /uploads/* {
    root * /opt/gift-app/uploads
    file_server
  }
}


⸻

5. Cookie Tracking and Visitor Logging
	•	Generate visitor_id UUID on first visit, store in cookie
	•	Track visit date + interactions in visitor_logs
	•	Use a cron job (daily at midnight) to:
	•	Count distinct visitors for the day
	•	Write a “lock” flag to DB if over limit
	•	Trigger alert (e.g., via mail or webhook)

⸻

6. Throttling Anonymous Users
	•	Store read_only_mode flag in a DB settings table
	•	Middleware on write routes checks:
	•	If anonymous
	•	If read_only_mode is true
	•	If so, return HTTP 429 or 403

⸻

7. Admin Auth
	•	No third-party auth
	•	Use environment-stored admin password hash
	•	Admin login form → sets signed HTTP-only cookie (e.g., admin_auth)
	•	Middleware protects admin-only endpoints

Use bcrypt or argon2 to hash password.

⸻

8. Deployment
	•	Deploy to /opt/gift-app/
	•	Caddy reverse proxy with TLS via Let’s Encrypt
	•	Use systemd service:

[Unit]
Description=Gift List App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/gift-app
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production
Environment=ADMIN_PASSWORD_HASH=...
Environment=DATABASE_URL=postgres://...

[Install]
WantedBy=multi-user.target


⸻

9. Security Recommendations
	•	Lock down PostgreSQL to 127.0.0.1
	•	Validate file types and sanitize filenames on upload
	•	Limit file size to ~1MB
	•	Avoid any eval, dynamic require, or child_process access
	•	Set proper CORS/CSP headers

⸻

🧪 Optional Enhancements (Later)
	•	Add basic frontend tests (Playwright/Cypress)
	•	Track usage metrics (simple table or Prometheus/Node exporter)
	•	Auto-restart on crash (systemd with restart policy)

⸻
