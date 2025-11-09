# Auth0 Integration Setup Guide

## Overview
Your Navi application now has full Auth0 integration with a Flask backend and Electron frontend.

## Architecture
- **Flask Backend** (`server.py`): Handles Auth0 OAuth flow and session management
- **Electron Main** (`navi/src/auth.js`): Manages authentication windows and IPC communication
- **React Frontend**: Provides user interface with AuthContext and AuthButton components

## Setup Instructions

### 1. Create Auth0 Account and Application

1. Go to [Auth0](https://auth0.com/) and sign up/login
2. Create a new Application:
   - Go to **Applications** > **Create Application**
   - Name: "Navi Desktop App"
   - Type: **Regular Web Application**
   - Click **Create**

### 2. Configure Auth0 Application

In your Auth0 application settings:

**Allowed Callback URLs:**
```
http://localhost:5000/callback,
http://localhost:3000/auth/callback
```

**Allowed Logout URLs:**
```
http://localhost:5000,
http://localhost:3000
```

**Allowed Web Origins:**
```
http://localhost:5000,
http://localhost:3000
```

### 3. Get Your Auth0 Credentials

From your Auth0 application settings page, copy:
- **Domain** (e.g., `dev-xyz.us.auth0.com`)
- **Client ID**
- **Client Secret**

### 4. Configure Environment Variables

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Auth0 credentials:
   ```env
   AUTH0_DOMAIN=your-tenant.auth0.com
   AUTH0_CLIENT_ID=your_client_id_here
   AUTH0_CLIENT_SECRET=your_client_secret_here
   APP_SECRET_KEY=generate_a_random_secret_key_here
   ```

3. Generate a secure `APP_SECRET_KEY`:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

### 5. Install Dependencies

**Python (Flask Backend):**
```bash
pip install -r requirements.txt
```

**Node.js (Electron App):**
```bash
cd navi
npm install
```

### 6. Start the Application

**Terminal 1 - Flask Backend:**
```bash
python server.py
```
Backend will run on http://localhost:5000

**Terminal 2 - Electron App:**
```bash
cd navi
npm start
```

## Usage

1. Launch the Electron app
2. Click **"Login with Auth0"** button in the top-right corner
3. A popup window will open with Auth0 login page
4. Sign in with your preferred method (email, Google, etc.)
5. After successful login, your user info will appear in the UI
6. Click **"Logout"** to sign out

## Features Implemented

✅ **Flask Backend:**
- `/login` - Initiates Auth0 login
- `/callback` - Handles Auth0 callback
- `/logout` - Logs out and clears session
- `/api/user` - Returns current user info
- `/api/auth/status` - Checks authentication status
- CORS enabled for Electron app

✅ **Electron Integration:**
- Auth0 login flow via popup window
- Secure IPC communication
- Session management
- Token handling

✅ **React Components:**
- `AuthContext` - Global auth state management
- `AuthButton` - Login/Logout UI with user profile display
- Error handling and loading states
- Configuration validation

## Security Features

- Session-based authentication
- HTTPS enforced on Auth0 domain
- Secure token handling
- Context isolation in Electron
- Environment variable protection
- CORS configured for specific origins

## Customization

### Add Social Connections

1. Go to Auth0 Dashboard > **Authentication** > **Social**
2. Enable providers (Google, GitHub, Facebook, etc.)
3. Configure each provider with their credentials
4. Users can now login with those providers

### Customize Login Page

1. Go to Auth0 Dashboard > **Branding** > **Universal Login**
2. Customize colors, logos, and text
3. Changes apply immediately

### Add User Roles/Permissions

1. Go to Auth0 Dashboard > **User Management** > **Roles**
2. Create roles (Admin, User, etc.)
3. Assign permissions to roles
4. Access in your app via `user.roles` or claims

## Troubleshooting

**Issue: "Auth0 not configured" warning**
- Ensure `.env` file exists with valid Auth0 credentials
- Restart both Flask and Electron apps after adding credentials

**Issue: Login window doesn't open**
- Check that Flask backend is running on port 5000
- Verify BACKEND_URL in `.env` matches Flask server URL

**Issue: "Authentication window closed"**
- User closed the window before completing login
- Try logging in again

**Issue: CORS errors**
- Verify Flask has `flask-cors` installed
- Check CORS origins match your Electron app URL

**Issue: Session not persisting**
- Ensure APP_SECRET_KEY is set in `.env`
- Check browser cookies are enabled

## Development vs Production

**Development:**
- Uses `http://localhost:5000` for backend
- Opens dev tools automatically
- Mock auth available if Auth0 not configured

**Production:**
- Update callback URLs in Auth0 to production domains
- Use HTTPS for all endpoints
- Set `NODE_ENV=production`
- Use proper secret management (not .env files)

## Next Steps

- [ ] Add user profile page
- [ ] Implement role-based access control
- [ ] Add refresh token handling
- [ ] Implement token expiration checks
- [ ] Add multi-factor authentication
- [ ] Store tokens securely with electron-store
- [ ] Add offline mode detection

## Support

For Auth0 issues: https://auth0.com/docs
For Electron issues: https://www.electronjs.org/docs
