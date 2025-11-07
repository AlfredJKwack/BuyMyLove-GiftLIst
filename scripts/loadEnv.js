import { config } from 'dotenv';

// Load base environment variables from .env
config({ path: '.env' });

// Override with local environment variables from .env.local
config({ path: '.env.local', override: true });
