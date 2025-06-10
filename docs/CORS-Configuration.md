# CORS Configuration for Supabase Edge Functions

## Overview

All Supabase Edge Functions in this project have been updated to use configurable CORS headers instead of hardcoded wildcard origins. This provides better security for production deployments while maintaining flexibility for development.

## Environment Variable

### CORS_ALLOW_ORIGIN

Set this environment variable in your Supabase Edge Function Secrets panel to control which origins are allowed to make requests to your Edge Functions.

**Location**: Supabase Dashboard → Edge Functions → Secrets

**Variable Name**: `CORS_ALLOW_ORIGIN`

**Recommended Values**:
- **Production**: Your frontend domain (e.g., `https://yourdomain.com`)
- **Development**: `*` (wildcard - allows all origins)

## Security Considerations

### Production
- **Always** set `CORS_ALLOW_ORIGIN` to your specific frontend domain
- Never use `*` in production as it allows any website to make requests to your API
- Example: `https://buymylove-giftlist.netlify.app`

### Development
- You can use `*` for local development convenience
- Consider using `http://localhost:3000` or your specific dev server URL for better security

## How It Works

Each Edge Function now includes a `getCorsHeaders()` function that:

1. Reads the `CORS_ALLOW_ORIGIN` environment variable
2. Falls back to `*` if the variable is not set (for development)
3. Returns appropriate CORS headers for all responses

```typescript
function getCorsHeaders() {
  const origin = Deno.env.get('CORS_ALLOW_ORIGIN') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-gift-buyer-id',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
```

## Updated Functions

The following Edge Functions have been updated:
- `add-gift`
- `delete-gift` 
- `toggle-bought-status`
- `update-gift`

## Setting the Environment Variable

1. Go to your Supabase Dashboard
2. Navigate to Edge Functions
3. Click on "Secrets" in the sidebar
4. Add a new secret:
   - **Name**: `CORS_ALLOW_ORIGIN`
   - **Value**: Your frontend domain (e.g., `https://yourdomain.com`)
5. Save the secret

## Testing

After setting the environment variable:

1. Deploy your Edge Functions
2. Test from your allowed origin - requests should work
3. Test from a different origin - requests should be blocked by CORS
4. Check browser developer tools for CORS-related errors if issues occur

## Troubleshooting

### Common Issues

1. **CORS errors after deployment**
   - Verify `CORS_ALLOW_ORIGIN` is set correctly
   - Ensure the value matches your frontend domain exactly (including protocol)
   - Check for trailing slashes or other formatting issues

2. **Functions still allowing all origins**
   - Redeploy the Edge Functions after setting the environment variable
   - Verify the secret is saved in the Supabase dashboard

3. **Preflight requests failing**
   - Ensure your frontend is sending the correct headers
   - Check that the `OPTIONS` method is handled properly

### Debug Mode

Set `DEBUG=true` in your Edge Function secrets to enable detailed logging for troubleshooting CORS and authentication issues.
