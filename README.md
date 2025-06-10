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

### Installation

You will want to read the [Installation and User Guide](./Installation-and-User-Guide.md) for detailed instructions on setting up the project.

You'll need an account on Supabase for the back-end and one with Netlify or equivalent for the front-end. In a few words: Git clone this repo, install dependencies, set up Supabase, deploy the front-end. In supabase you'll need to set up a Supabase project, create the required tables, security policies, storage buckets, and deploy the Edge Functions (scripts provided). There's a few secrets to set up as well with both providers. Finally, you'll need to set up a user in the Supabase dashboard authentication section to enable admin access.

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

You can read more details about the technical aspects of the project in the [Architecture.md](./docs/Architecture.md) doc.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
