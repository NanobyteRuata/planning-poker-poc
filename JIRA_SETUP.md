# Jira Integration Setup Guide

This guide will help you set up Atlassian OAuth authentication and Jira integration for the Planning Poker application.

## Prerequisites

- An Atlassian account with access to Jira
- Admin access to create OAuth apps in Atlassian Developer Console
- Firebase project with Firestore enabled

## Step 1: Create Atlassian OAuth App

1. Go to [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. Click **Create** → **OAuth 2.0 integration**
3. Name your app (e.g., "Planning Poker")
4. Click **Create**

### Configure OAuth Settings

1. In your app settings, go to **Permissions**
2. Add the following scopes:
   - `read:jira-work` - Read Jira project and issue data
   - `write:jira-work` - Create and edit issues in Jira
   - `read:jira-user` - Read user information
   - `offline_access` - Maintain access when user is offline

3. Go to **Authorization**
4. Add callback URL:
   - For local development: `http://localhost:3000/api/auth/callback/atlassian`
   - For production: `https://yourdomain.com/api/auth/callback/atlassian`

5. Copy your **Client ID** and **Client Secret** (you'll need these for environment variables)

## Step 2: Configure Firebase Admin

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file securely
6. Extract the following values:
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

## Step 3: Set Up Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in all the values:

   ```env
   # Firebase Configuration (from Firebase Console)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Firebase Admin (from service account JSON)
   FIREBASE_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=generate_random_secret_here

   # Atlassian OAuth (from Atlassian Developer Console)
   ATLASSIAN_CLIENT_ID=your_atlassian_oauth_client_id
   ATLASSIAN_CLIENT_SECRET=your_atlassian_oauth_client_secret
   ```

3. Generate a secure `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

## Step 4: Test the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open `http://localhost:3000`

3. Click **Sign In** and authenticate with your Atlassian account

4. Grant the requested permissions

5. You should be redirected back to the app

## Step 5: Using Jira Integration

### Creating Stories with Jira Tickets

1. Sign in with your Atlassian account
2. Create a new room or join an existing one
3. When creating a story, click **Link Jira Ticket**
4. Select your Jira site from the dropdown
5. Search for an issue by key (e.g., "PROJ-123") or text
6. Select the issue to link it to your story

### Updating Jira Story Points

1. During a planning poker session, vote on a story
2. When revealing cards and completing the story:
   - Enter the final story points
   - Check the **Update Jira ticket** checkbox (enabled by default)
   - Click **Complete Story**
3. The story points will be automatically synced to Jira
4. A comment will be added to the Jira issue confirming the update

## Troubleshooting

### "Story Points field not found"

The Jira API will attempt to find the Story Points field automatically. If it fails:

1. Go to your Jira project settings
2. Find the custom field ID for Story Points
3. The integration checks for:
   - Field name: "Story Points"
   - Field name: "Story point estimate"
   - Field key: "customfield_10016" (common default)

### "Failed to update Jira"

Check the following:
- Your Atlassian OAuth token is valid (try signing out and back in)
- The Jira issue exists and you have permission to edit it
- The Story Points field is configured in your Jira project
- Your OAuth app has the correct scopes enabled

### Rate Limiting

Atlassian APIs have rate limits. If you encounter rate limit errors:
- Wait a few minutes before trying again
- Reduce the frequency of API calls
- Consider implementing a queue system for bulk updates

## Security Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Rotate secrets regularly** - Especially if they're exposed
3. **Use environment-specific secrets** - Different secrets for dev/staging/prod
4. **Limit OAuth scopes** - Only request permissions you need
5. **Monitor API usage** - Keep track of Atlassian API calls

## Production Deployment

When deploying to production:

1. Update the callback URL in Atlassian Developer Console
2. Set all environment variables in your hosting platform
3. Update `NEXTAUTH_URL` to your production domain
4. Ensure HTTPS is enabled (required for OAuth)
5. Test the OAuth flow thoroughly

## API Endpoints

The following API endpoints are available:

- `GET /api/jira/resources` - Get accessible Jira sites
- `GET /api/jira/search?query=...&cloudId=...` - Search for issues
- `GET /api/jira/issue/[issueKey]?cloudId=...` - Get issue details
- `POST /api/jira/update-story-points` - Update story points on an issue

## Support

For issues with:
- **Atlassian OAuth**: [Atlassian Developer Community](https://community.developer.atlassian.com/)
- **Jira API**: [Jira Cloud REST API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- **NextAuth**: [NextAuth.js Documentation](https://next-auth.js.org/)
