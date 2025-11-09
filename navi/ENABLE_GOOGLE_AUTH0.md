# How to Enable Google Authentication in Auth0

## Step-by-Step Guide

### 1. Go to Auth0 Dashboard
- Visit: https://manage.auth0.com/
- Log in to your Auth0 account

### 2. Enable Google Social Connection

1. **Navigate to Social Connections:**
   - Click on "Authentication" in the left sidebar
   - Click on "Social" under Authentication

2. **Enable Google:**
   - Find "Google" in the list of social connections
   - Click on it or toggle it to "Enabled"

3. **Configure Google OAuth:**
   - You'll need Google OAuth 2.0 credentials:
     - Go to [Google Cloud Console](https://console.cloud.google.com/)
     - Create a new project or select an existing one
     - Enable Google+ API
     - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
     - Application type: "Web application"
     - Authorized redirect URIs: 
       - `https://dev-iuubo1tzok0w64at.us.auth0.com/login/callback`
     - Copy the Client ID and Client Secret
   - Paste these into Auth0's Google connection settings

4. **Enable for Your Application:**
   - Go to "Applications" → Your Application (Client ID: `FDXgon7aNpQdLAbU4bcJ6GIu79J8f4Ii`)
   - Scroll down to "Connections" section
   - Make sure "Google" is **enabled/checked**
   - Click "Save"

### 3. Verify Configuration

1. **Check Allowed Callback URLs:**
   - In your Application settings
   - Make sure `http://localhost:3000/auth/callback` is in "Allowed Callback URLs"

2. **Test the Connection:**
   - Restart your application
   - Try logging in with Google
   - It should now work!

## Quick Checklist

- [ ] Google connection enabled in Authentication → Social
- [ ] Google OAuth credentials configured in Auth0
- [ ] Google connection enabled for your application
- [ ] Callback URL configured: `http://localhost:3000/auth/callback`
- [ ] Application type set to "Native" or "Single Page Application"

## Common Issues

### "The connection is not enabled"
- **Solution**: Enable Google in Authentication → Social → Google, and make sure it's enabled for your application in Applications → Your App → Connections

### "Invalid redirect_uri"
- **Solution**: Add `http://localhost:3000/auth/callback` to Allowed Callback URLs in your Application settings

### "Invalid client"
- **Solution**: Verify your Client ID is correct: `FDXgon7aNpQdLAbU4bcJ6GIu79J8f4Ii`

## Need Help?

If you're still having issues:
1. Check the Auth0 Dashboard logs (Monitoring → Logs)
2. Verify all settings match this guide
3. Make sure your Auth0 tenant is active
4. Check that Google OAuth credentials are valid

