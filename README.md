# BuyMyLove Gift List

A simple gift list application where users can share their wishlist with friends and family. Visitors can mark gifts as bought to prevent duplicate purchases.

Version 0.2.0

## Features

- Mobile-first responsive design
- View gift list with details
- Mark gifts as bought/available with visual toggle
- Tracking of bought gifts to prevent duplicate purchases
- Admin authentication for managing gifts via dedicated `#/admin` url
- Visitor tracking for abuse prevention

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Build Tools**: Vite, PostCSS
- **Styling**: Custom CSS (Tailwind-inspired)
- **Testing**: Vitest for unit tests, Playwright for E2E tests

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/BuyMyLove-GiftLIst.git
   cd BuyMyLove-GiftLIst
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file based on `.env.local.example`:
   ```bash
   cp .env.local.example .env.local
   ```

4. Update the `.env.local` file with your Supabase credentials:
   - `VITE_SUPABASE_URL` (your Supabase project URL)
   - `VITE_SUPABASE_ANON_KEY` (your Supabase anon key)
   - `VITE_DEBUG` (optional, for debug logging)

Note: All authenticated users (anyone who can log in via OTP) are considered admins and can manage gifts.

### Development

Run the development server:
```bash
npm run dev
```

Visit `http://localhost:5173` to view the application.

### Testing

Run unit tests:
```bash
npm test
```

Run E2E tests:
```bash
npm run test:e2e
```

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Deployment

### Supabase Setup

1. Create a new Supabase project
2. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```
   Or look for alternative installation methods [here](https://github.com/supabase/cli#install-the-cli)

3. Login to Supabase and link your project:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```
4. Run the SQL setup script located at `supabase/schema.sql` in the Supabase environment. 
   
5. Deploy Edge Functions:
   ```bash
   ./install-edge-functions.sh
   ```
6. Set up storage buckets as defined in the schema
   
7. Add at least one user in the Supabase dashboard authentication section to enable admin access. The email is what matters.

#### Edge Functions

This application uses Supabase Edge Functions for secure database operations that require Row Level Security (RLS) enforcement with anonymous user identity. The following functions are deployed:

- `toggle-bought-status` - Allows anonymous users to mark/unmark gifts as bought
- `add-gift` - Admin function to add new gifts
- `update-gift` - Admin function to update existing gifts  
- `delete-gift` - Admin function to delete gifts

### Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variables from your `.env.local` file

### Admin Panel

The admin panel is accessible via the `#/admin` route and serves to log in and out. Authenticated admins will see additional controls to add, update, and delete gifts directly in the listing.

**Authentication:**
- All authenticated users are considered admins
- Login is done via magic link sent to email address
- Session persists across browser sessions
- Secure logout functionality

You must have set up a user in the Supabase dashboard authentication section to enable admin access. 

## Project Structure

```
/
├── docs/                 # Documentation
├── public/               # Static assets
├── src/
│   ├── components/       # UI components
│   ├── css/              # Modular CSS files
│   │   ├── base/         # Base styles (reset, variables, typography)
│   │   ├── components/   # Component styles (cards, forms, modal, etc.)
│   │   ├── layout/       # Layout styles (containers, grid)
│   │   ├── utils/        # Utility styles
│   │   └── main.css      # Main CSS entry point
│   ├── services/         # API services
│   ├── utils/            # Utility functions
│   ├── main.js           # Application entry point
│   └── style.css         # Global styles
├── supabase/             # Supabase configuration
│   ├── functions/        # Edge Functions
│   │   ├── toggle-bought-status/
│   │   ├── add-gift/
│   │   ├── update-gift/
│   │   └── delete-gift/
│   └── schema.sql        # Database schema
├── test/                 # Test files
├── .env.local.example    # Environment variables template
├── index.html            # HTML entry point
├── install-edge-functions.sh  # Edge Functions installer
├── package.json          # Project dependencies
└── vite.config.js        # Vite configuration
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
