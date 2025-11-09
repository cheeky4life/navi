# Authentication Setup Guide

## Auth0 Configuration (Optional)

The application supports Auth0 authentication but works with mock authentication for development.

### To Enable Auth0:

1. **Set up Auth0 Account:**
   - Go to [Auth0 Dashboard](https://manage.auth0.com/)
   - Create a new application (Native application type)
   - Note your Domain and Client ID

2. **Configure Environment Variables:**
   - Set `AUTH0_DOMAIN` (e.g., `your-tenant.auth0.com`)
   - Set `AUTH0_CLIENT_ID` (your Auth0 application client ID)
   - Optionally set `AUTH0_AUDIENCE` if using an API

3. **Configure Auth0 Application:**
   - Add `http://localhost:3000/auth/callback` to Allowed Callback URLs
   - Enable the social connections you want (Google, GitHub, Discord)
   - Configure connection settings in Auth0 Dashboard

4. **Update `navi/src/auth.js`:**
   - The code will automatically use Auth0 if environment variables are set
   - If not configured, it will use mock authentication for development

### Mock Authentication (Development)

When Auth0 is not configured, the app uses mock authentication:
- Click any login button (Google, GitHub, Discord)
- You'll be automatically logged in with a mock user
- This allows development without Auth0 setup

## Gemini API Key

The Gemini API key is stored in `navi/src/main.js` and can be set via:

1. **Environment Variable:**
   ```bash
   export GEMINI_API_KEY=your_api_key_here
   ```

2. **Direct Configuration:**
   - Update `GEMINI_API_KEY` in `navi/src/main.js`
   - The key is securely passed to the renderer process via IPC

**Current API Key:** Already configured in the code.

## Microphone Permissions

The app requests microphone permissions when you click the microphone button:
- On first use, the system will prompt for permission
- Permission is requested explicitly before starting speech recognition
- If denied, you'll see an error message with instructions

## Testing

1. **Start the app:**
   ```bash
   npm start
   ```

2. **Login:**
   - Click any OAuth provider button
   - If Auth0 is not configured, you'll be logged in with a mock user
   - If Auth0 is configured, you'll go through the OAuth flow

3. **Test Voice Input:**
   - Click the microphone button
   - Allow microphone access when prompted
   - Speak your command
   - The app will process it and get AI feedback from Gemini

4. **Test Document Operations:**
   - Add a document using the "+" button
   - Say: "Navi update the font in this pdf then send it to John Doe over email"
   - The app will parse the command and get AI feedback

