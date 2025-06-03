# Demo Data

This directory contains demo data and scripts for the Gift List App. These files are intended for development, testing, and demonstration purposes only.

## Directory Structure

```
demo/
├── data/
│   └── demo-data.sql          # SQL file with sample gift and visitor data
├── scripts/
│   └── populate-demo-data.js  # Node.js script to populate database with demo data
└── README.md                  # This file
```

## Usage

### Option 1: Using the npm Script (Recommended)

The easiest way to populate demo data is using the npm script:

```bash
# Ensure you have configured .env.local with your Supabase credentials
npm run demo:populate
```

### Option 2: Running the Script Directly

You can also run the populate script directly:

```bash
node demo/scripts/populate-demo-data.js
```

**What this script does:**
- Connects to your Supabase database using credentials from `.env.local`
- Clears any existing gifts and visitor data
- Inserts 6 sample gifts with varied bought/available status
- Adds 5 demo visitors for throttling feature testing
- Provides console output showing the populated data

### Option 3: Using SQL Directly

You can also run the SQL file directly in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of demo/data/demo-data.sql
-- into your Supabase project's SQL Editor
```

## Demo Data Included

### Sample Gifts (6 items)
1. Wireless Noise-Cancelling Headphones (Available)
2. Smart Coffee Maker (Bought)
3. Kindle Paperwhite E-reader (Available)
4. Yoga Mat with Alignment Lines (Available)
5. Instant Pot Pressure Cooker (Bought)
6. Bluetooth Mechanical Keyboard (Available)

### Sample Visitors (5 entries)
- Demo visitor data for testing the visitor throttling feature
- Includes various user IDs and IP addresses for the same date

## Important Notes

⚠️ **Warning**: The populate script will **clear all existing data** in the `gifts` and `daily_visitors` tables before inserting demo data. Only use this for testing/demo purposes, not in production with real data.

## Prerequisites

- Supabase project set up with the main schema
- `.env.local` file configured with valid Supabase credentials
- Node.js environment with required dependencies installed

## Production Deployment

These demo files should not be included in production deployments. Consider:
- Adding `demo/` to your deployment exclusion rules
- Using environment-specific build processes that exclude demo content
- Keeping demo data separate from production data sources
