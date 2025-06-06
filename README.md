# BuyMyLove Gift List

A simple gift list application where users can share their wishlist with friends and family. Visitors can mark gifts as bought to prevent duplicate purchases.

Version 0.2.0

## Features

- Mobile-first responsive design
- View gift list with details (title, link, notes, date added)
- Mark gifts as bought/available with visual toggle
- Cookie-based identity for tracking who bought what
- Admin authentication for managing gifts
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

4. Update the `.env.local` file with your Supabase credentials.

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
2. Run the SQL setup script in `supabase/schema.sql`
3. Set up storage buckets as defined in the schema

### Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variables from your `.env.local` file

## Project Structure

```
/
├── docs/                 # Documentation
├── public/               # Static assets
├── src/
│   ├── components/       # UI components
│   ├── services/         # API services
│   ├── utils/            # Utility functions
│   ├── main.js           # Application entry point
│   └── style.css         # Global styles
├── supabase/             # Supabase configuration
├── test/                 # Test files
├── .env.local.example    # Environment variables template
├── index.html            # HTML entry point
├── package.json          # Project dependencies
└── vite.config.js        # Vite configuration
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
