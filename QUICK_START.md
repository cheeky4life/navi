# Auth0 Quick Start

## ⚡ Quick Setup (5 minutes)

1. **Create Auth0 App** → https://manage.auth0.com/
   - Type: Regular Web Application
   - Copy Domain, Client ID, Client Secret

2. **Configure Callbacks in Auth0:**
   ```
   Allowed Callback URLs: http://localhost:5000/callback
   Allowed Logout URLs: http://localhost:5000
   ```

3. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

4. **Add credentials to `.env`:**
   ```env
   AUTH0_DOMAIN=your-tenant.auth0.com
   AUTH0_CLIENT_ID=your_client_id
   AUTH0_CLIENT_SECRET=your_client_secret
   APP_SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
   ```

5. **Install & Run:**
   ```bash
   # Terminal 1
   pip install -r requirements.txt
   python server.py

   # Terminal 2
   cd navi
   npm install
   npm start
   ```

## 🎯 Key Files Modified

| File | Purpose |
|------|---------|
| `server.py` | Flask backend with Auth0 endpoints |
| `navi/src/auth.js` | Electron Auth0 integration |
| `src/preload.js` | IPC bridge for auth functions |
| `src/main.js` | Initialize auth handlers |
| `src/renderer/contexts/AuthContext.jsx` | React auth state |
| `src/renderer/components/AuthButton.jsx` | Login/Logout UI |
| `src/renderer/App.jsx` | Updated with AuthProvider |

## 🔑 Auth Flow

```
User clicks "Login" 
  → Electron opens Auth0 window 
  → User authenticates 
  → Auth0 redirects to Flask /callback
  → Flask creates session 
  → Electron fetches user data
  → User info displayed in UI
```

## 🛠️ Useful Commands

```bash
# Generate secret key
python -c "import secrets; print(secrets.token_hex(32))"

# Test Flask backend
curl http://localhost:5000/api/auth/status

# Check Auth0 connection
curl http://localhost:5000/
```

## 📱 Using Auth in Your Components

```jsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
    const { user, isAuthenticated, login, logout } = useAuth();
    
    if (!isAuthenticated) {
        return <button onClick={login}>Login</button>;
    }
    
    return (
        <div>
            <p>Welcome {user.name}!</p>
            <button onClick={logout}>Logout</button>
        </div>
    );
}
```

## 🚨 Common Issues

| Problem | Solution |
|---------|----------|
| "Auth0 not configured" | Add credentials to `.env` and restart |
| Login window doesn't open | Start Flask backend first |
| CORS errors | Install `flask-cors`: `pip install flask-cors` |
| Session not saving | Set `APP_SECRET_KEY` in `.env` |

## 📚 More Info

See `AUTH0_SETUP.md` for detailed documentation.
