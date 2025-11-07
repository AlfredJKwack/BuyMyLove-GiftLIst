# BuyMyLove GiftList

A gift list application where you can share your wishlist with friends and family. Visitors can mark gifts as bought to prevent duplicate purchases, and admins can manage the gift list.

<img width="1512" height="945" alt="GiftLIst in action" src="https://github.com/user-attachments/assets/efcd4498-3458-4b1e-b6ea-11473bb7c544" />


## Features

- **Public Gift List**: Anyone can view the gift list
- **Anonymous Toggling**: Visitors can mark gifts as bought/unbought (tracked by cookie)
- **Admin Management**: Secure OTP email login for gift management
- **Image Processing**: Automatic resize and crop of uploaded images to create thumbnails 
- **Mobile-First Design**: Responsive layout optimized for all devices

## Tech Stack

- **Frontend**: Next.js (Pages Router), React
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: JWT with OTP email authentication
- **Image Processing**: Sharp (server-side) & smartcrop.js
- **Styling**: Custom CSS with CSS variables

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- SMTP server for email (or local mail server)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/AlfredJKwack/BuyMyLove-GiftLIst.git
cd BuyMyLove-GiftLIst
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.local.example` to `.env.local` and configure:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

- Set `DATABASE_URL` to your PostgreSQL connection string
- Set `ADMIN_EMAILS` (comma-separated list of allowed admin emails)
- Generate and set `JWT_SECRET` (use a random string)
- Configure SMTP settings (HOST, PORT, USER, PASS, FROM) for OTP email authentication
- Set `APP_URL` to your application URL (e.g., http://localhost:3000 for dev)

### 4. Set up the database

Create the PostgreSQL database:

```bash
createdb giftlist
```

Run migrations:

```bash
npm run db:setup
```

This will:
- Generate migration files from schema
- Apply migrations to database

### 5. Start the development server

```bash
npm run dev
```

Visit http://localhost:3000

## Production Deployment

See the [Deployment Guide](deploy/DEPLOYMENT.md) for production setup instructions.

## Admin Access

1. Click "Admin Login"
2. Enter your admin email
3. Check your email for login link
4. Click the link to authenticate

Once logged in, you can:
- Add new gifts
- Edit existing gifts
- Upload/remove images
- Delete gifts

## Database Schema

- `gifts`: Store gift information (title, note, url, image)
- `toggles`: Track bought status per visitor per gift
- `visitor_logs`: Track daily visitors
- `settings`: Application settings (e.g., read_only_mode)
- `otp_tokens`: Temporary OTP tokens for admin login

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run Next.js linting
- `npm run db:generate` - Generate migration files from schema
- `npm run db:migrate` - Run migrations
- `npm run db:setup` - Generate and run migrations (convenience script)

## Testing

Placeholder tests are available in `tests/api.test.js`. To set up a full test suite:

1. Install testing dependencies:
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom supertest
```

2. Add Jest configuration to `package.json`:
```json
"jest": {
  "testEnvironment": "node",
  "transform": {}
}
```

3. Update the test script in `package.json`:
```json
"test": "jest"
```

4. Set up a test database and implement the test cases in `tests/api.test.js`

## Documentation

For detailed technical information, see:
- [Requirements](docs/Requirements.md) - Functional requirements and user stories
- [Technical Specification](docs/Technical_Spec.md) - API 
- [Deployment Guide](deploy/DEPLOYMENT.md) - Production deployment instructions

For a thorough overview of what overengineering looks like, see [Responsive Image Implementation](docs/Responsive_Image_Implementation.md)

## Security Considerations

- All admin actions require JWT authentication
- Anonymous actions use cookie-based visitor tracking
- No personal data stored for anonymous users
- OTP tokens expire after 15 minutes
- Passwords are hashed with bcrypt
- Images are validated and processed server-side

## License

MIT License - see LICENSE file

## Contributing

Pull requests welcome! Please ensure the application builds successfully before submitting.
