#!/bin/bash

# Install Edge Functions to Supabase
# This script deploys all Edge Functions in the supabase/functions directory

set -e  # Exit on any error

echo "🚀 Installing Edge Functions to Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed."
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "supabase/functions" ]; then
    echo "❌ Error: supabase/functions directory not found."
    echo "Please run this script from the project root directory."
    exit 1
fi

# Check if user is logged in to Supabase
echo "🔍 Checking Supabase authentication..."
if ! supabase status &> /dev/null; then
    echo "❌ Error: Not connected to a Supabase project."
    echo "Please run 'supabase login' and 'supabase link --project-ref YOUR_PROJECT_REF' first."
    exit 1
fi

echo "✅ Supabase CLI found and authenticated."

# List of Edge Functions to deploy
FUNCTIONS=(
    "toggle-bought-status"
    "add-gift"
    "update-gift"
    "delete-gift"
)

echo "📦 Deploying Edge Functions..."

# Deploy each function
for func in "${FUNCTIONS[@]}"; do
    echo "  📤 Deploying $func..."
    if supabase functions deploy "$func"; then
        echo "  ✅ $func deployed successfully"
    else
        echo "  ❌ Failed to deploy $func"
        exit 1
    fi
done

echo ""
echo "🎉 All Edge Functions deployed successfully!"
echo ""
echo "📋 Deployed functions:"
for func in "${FUNCTIONS[@]}"; do
    echo "  • $func"
done

echo ""
echo "🔧 Next steps:"
echo "1. Make sure your .env.local file has the correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
echo "2. Test the application to ensure Edge Functions are working correctly"
echo "3. Check the Supabase dashboard for function logs if you encounter issues"

echo ""
echo "📖 Function URLs (replace YOUR_PROJECT_REF with your actual project reference):"
echo "https://YOUR_PROJECT_REF.supabase.co/functions/v1/toggle-bought-status"
echo "https://YOUR_PROJECT_REF.supabase.co/functions/v1/add-gift"
echo "https://YOUR_PROJECT_REF.supabase.co/functions/v1/update-gift"
echo "https://YOUR_PROJECT_REF.supabase.co/functions/v1/delete-gift"

echo ""
echo "✨ Installation complete!"
