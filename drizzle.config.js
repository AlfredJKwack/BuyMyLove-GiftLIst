import 'dotenv/config';

export default {
  schema: './database/schema.js',
  out: './database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
