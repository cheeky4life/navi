# Auth0 Setup Guide

## Quick Setup

Your Auth0 credentials are already configured in the code:
- **Domain**: `dev-iuubo1tzok0w64at.us.auth0.com`
- **Client ID**: `FDXgon7aNpQdLAbU4bcJ6GIu79J8f4Ii`

## Auth0 Dashboard Configuration

1. **Go to Auth0 Dashboard**: https://manage.auth0.com/
2. **Navigate to Applications** → Your Application
3. **Application Type**: Should be set to "Native" or "Single Page Application"
4. **Allowed Callback URLs**: Add the following:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:*`
5. **Allowed Logout URLs**: Add:
   - `http://localhost:3000`
6. **Allowed Web Origins**: Add:
   - `http://localhost:3000`
7. **Enable Social Connections**:
   - Go to Authentication → Social
   - Enable Google, GitHub, and/or Discord
   - Configure each with their respective credentials

## Testing Auth0

1. Start the application:
   ```bash
   npm start
   ```

2. Click on any login button (Google, GitHub, Discord)

3. You should see the Auth0 login window open

4. After successful login, you'll be redirected back to the app

## Troubleshooting

### "Invalid redirect_uri" Error
- Make sure `http://localhost:3000/auth/callback` is added to "Allowed Callback URLs" in Auth0 Dashboard
- Check that the application type is set to "Native" or "Single Page Application"

### "Invalid client" Error
- Verify the Client ID matches: `FDXgon7aNpQdLAbU4bcJ6GIu79J8f4Ii`
- Check that the Domain matches: `dev-iuubo1tzok0w64at.us.auth0.com`

### Social Login Not Working
- Make sure the social connection is enabled in Auth0 Dashboard
- Verify the social provider credentials are configured correctly
- Check that the connection is enabled for your application

### Token Exchange Fails
- Check the browser console for detailed error messages
- Verify network connectivity
- Ensure the Auth0 tenant is active

## Environment Variables (Optional)

You can also set these as environment variables:

```bash
export AUTH0_DOMAIN=dev-iuubo1tzok0w64at.us.auth0.com
export AUTH0_CLIENT_ID=FDXgon7aNpQdLAbU4bcJ6GIu79J8f4Ii
```

The code will use these if set, otherwise it will use the hardcoded values.

