# OAuth Provider Setup Guide

This guide explains how to set up OAuth providers (Google, GitHub, Facebook) for the Gen Art Pixels authentication system.

## Overview

The authentication system uses Supabase Auth with OAuth providers for secure, passwordless authentication. Users can sign in using their existing accounts from supported providers.

## Local Development Setup

### 1. Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:54321/auth/v1/callback` (for local Supabase)
   - `https://your-project.supabase.co/auth/v1/callback` (for production)
7. Copy the Client ID and Client Secret to your `.env.local` file:
   ```
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

### 2. GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - Application name: "Gen Art Pixels (Local)"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:54321/auth/v1/callback`
4. Copy the Client ID and Client Secret to your `.env.local` file:
   ```
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```

### 3. Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select an existing one
3. Add "Facebook Login" product
4. In Facebook Login settings, add valid OAuth redirect URIs:
   - `http://localhost:54321/auth/v1/callback`
5. Copy the App ID and App Secret to your `.env.local` file:
   ```
   FACEBOOK_CLIENT_ID=your_facebook_app_id
   FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
   ```

## Production Setup

For production deployment, you'll need to:

1. Update redirect URIs in each OAuth provider to use your production domain
2. Set the environment variables in your production environment (Vercel, etc.)
3. Update the Supabase project settings with the production OAuth credentials

### Production Redirect URIs

Replace `your-project.supabase.co` with your actual Supabase project URL:

- Google: `https://your-project.supabase.co/auth/v1/callback`
- GitHub: `https://your-project.supabase.co/auth/v1/callback`
- Facebook: `https://your-project.supabase.co/auth/v1/callback`

## Testing Authentication

1. Start your local development server:
   ```bash
   npm run dev
   ```

2. Start Supabase locally:
   ```bash
   npx supabase start
   ```

3. Visit the authentication test page:
   ```
   http://localhost:3000/test/auth
   ```

4. Test each OAuth provider to ensure they work correctly

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Ensure the redirect URI in your OAuth app matches exactly: `http://localhost:54321/auth/v1/callback`
   - Check that there are no trailing slashes or extra characters

2. **"Client ID not found" error**
   - Verify your environment variables are set correctly
   - Restart your development server after adding environment variables

3. **"Access denied" error**
   - Check that your OAuth app is configured to allow the required scopes
   - Ensure your app is not in "development mode" that restricts access

### Environment Variables Checklist

Make sure these are set in your `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Security Notes

- Never commit OAuth secrets to version control
- Use environment variables for all sensitive configuration
- Regularly rotate OAuth secrets in production
- Monitor OAuth app usage for suspicious activity
- Use HTTPS in production for all OAuth flows