# Gift List App

**Version 0.1.0**

A mobile-first web application for managing a single gift list with anonymous user interaction and admin controls.

## Features

- **Public Access**: Anyone can view the gift list at a fixed URL
- **Anonymous Interaction**: Visitors can mark gifts as "bought" with cookie-based tracking to prevent surreptitious 'unpurchasing' by others.
- **Admin Controls**: Authenticated admin can add, edit, and delete gifts
- **Image Upload**: Server-side image upload and storage via Supabase
- **Mobile-First**: Responsive design optimized for mobile devices
- **Visitor Throttling**: Automatic detection and alerting for high traffic

## Tech Stack

- **Frontend**: Vite + Vanilla JavaScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Storage + Edge Functions)
- **Testing**: Vitest (unit tests) + Playwright (E2E tests)
- **Deployment**: Netlify/Vercel (frontend) + Supabase (backend)

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone and Install

```bash
git clone https://github.com/AlfredJKwack/BuyMyLove-GiftLIst.git
cd gift-list-app
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Go to SQL Editor and run the schema from `supabase-schema.sql`
4. Go to Storage and verify the `images` bucket was created

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_SECRET=your_secure_admin_password
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Usage

### For Visitors

1. Visit the app URL
2. Browse the gift list
3. Click the ⭕ icon to mark a gift as bought (changes to ✅)
4. Only you can unmark gifts you've marked (cookie-based tracking)

### For Admin

1. Click "Admin Login" 
2. Enter your admin secret (from `VITE_ADMIN_SECRET`)
3. Use "Add Gift" to create new gifts
4. Click "Edit" or "Delete" on existing gifts
5. Upload images when adding/editing gifts

## Testing

### Unit Tests

```bash
npm run test
```

### End-to-End Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:ui
```

## Deployment to production

### Frontend (Netlify)

1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` 
   - `VITE_ADMIN_SECRET`

### Frontend (Vercel)

1. Connect your GitHub repo to Vercel
2. Framework preset: Vite
3. Add environment variables in Vercel dashboard

### Backend (Supabase)

The backend is already deployed when you set up your Supabase project. No additional deployment needed.

## Project Structure

```
gift-list-app/
├── src/
│   ├── main.js              # Main application entry
│   ├── style.css            # Tailwind CSS + custom styles
│   ├── supabase.js          # Supabase client configuration
│   ├── services/
│   │   └── giftService.js   # Gift CRUD operations
│   └── utils/
│       └── cookies.js       # Cookie utilities for user tracking
├── tests/
│   ├── gift.test.js         # Unit tests
│   ├── e2e.spec.js          # Playwright E2E tests
│   └── setup.js             # Test setup and mocks
├── docs/                    # Requirements and architecture docs
├── index.html               # Main HTML file
├── supabase-schema.sql      # Database schema
└── .env.local.example       # Environment variables template
```

## Database Schema

### Tables

- **gifts**: Main gift data (title, link, note, image, bought status)
- **daily_visitors**: Visitor tracking for throttling (user_id, ip, date)
- **alerts**: Admin notifications for high traffic

### Storage

- **images**: Gift images with automatic public access

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_ADMIN_SECRET` | Password for admin access | Yes |

### Visitor Throttling

- Tracks unique visitors by cookie + IP combination
- Alerts admin when >12 unique visitors per day
- Logs alerts to `alerts` table for review

## Security Notes

- Admin secret is stored in environment variables only
- Row Level Security (RLS) enabled on all tables
- Anonymous users can only modify `bought` status with restrictions
- Images are stored in public Supabase storage bucket
- No personal data is stored for anonymous users

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

GPL v3 License - see LICENSE file for details

## Support

For issues and questions:
1. Check the GitHub Issues
2. Review the architecture documentation in `/docs`
3. Verify your Supabase setup and environment variables
