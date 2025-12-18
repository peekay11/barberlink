# OAuth Setup Instructions

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)
7. Copy Client ID and Client Secret

## GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: BarberLink
   - Homepage URL: `https://your-domain.com`
   - Authorization callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret

## Supabase Configuration

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google:
   - Paste Google Client ID and Secret
   - Add redirect URL: `https://your-domain.com/auth/callback`
3. Enable GitHub:
   - Paste GitHub Client ID and Secret
   - Add redirect URL: `https://your-domain.com/auth/callback`

## Environment Variables

Add to your `.env.local`:
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production, update the site URL to your actual domain.