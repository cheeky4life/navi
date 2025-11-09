# Auth0 Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Navi Application                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐          ┌──────────────────────┐
│   React Frontend     │          │   Flask Backend      │
│   (Electron UI)      │◄────────►│   (Auth Server)      │
│                      │   HTTP   │                      │
│  Port: 3000          │          │  Port: 5000          │
└──────────────────────┘          └──────────────────────┘
         │                                 │
         │                                 │
         ▼                                 ▼
┌──────────────────────┐          ┌──────────────────────┐
│  Electron Main       │          │    Auth0 Service     │
│  (IPC Bridge)        │          │  (OAuth Provider)    │
│                      │◄─────────┤                      │
│  src/main.js         │  OAuth   │  your-tenant.auth0   │
│  navi/src/auth.js    │          │                      │
└──────────────────────┘          └──────────────────────┘
```

## Authentication Flow

```
1. USER CLICKS LOGIN
   ┌─────────────┐
   │   User UI   │
   └──────┬──────┘
          │ click "Login with Auth0"
          ▼
   ┌─────────────┐
   │ AuthButton  │ ─── useAuth() hook
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │AuthContext  │ ─── window.auth.login()
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ Preload.js  │ ─── ipcRenderer.invoke('auth:login')
   └──────┬──────┘
          │
          ▼

2. ELECTRON OPENS AUTH WINDOW
   ┌─────────────┐
   │  Main.js    │ ─── receives IPC call
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │  auth.js    │ ─── setupAuthHandlers()
   └──────┬──────┘
          │ opens BrowserWindow
          ▼
   ┌─────────────┐
   │Auth Popup   │ ─── loads Flask /login
   └──────┬──────┘
          │
          ▼

3. FLASK REDIRECTS TO AUTH0
   ┌─────────────┐
   │ server.py   │
   │  /login     │ ─── oauth.auth0.authorize_redirect()
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │   Auth0     │
   │Login Page   │ ◄─── User enters credentials
   └──────┬──────┘
          │
          ▼

4. AUTH0 CALLBACK
   ┌─────────────┐
   │   Auth0     │ ─── Authorization Code
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ server.py   │
   │ /callback   │ ─── Exchange code for token
   └──────┬──────┘     Create session
          │
          ▼
   ┌─────────────┐
   │  Redirect   │ ─── http://localhost:3000/auth/success
   └──────┬──────┘
          │
          ▼

5. ELECTRON FETCHES USER DATA
   ┌─────────────┐
   │  auth.js    │ ─── fetch('/api/user')
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ server.py   │ ─── Returns user info from session
   │ /api/user   │
   └──────┬──────┘
          │
          ▼

6. UPDATE UI
   ┌─────────────┐
   │AuthContext  │ ─── setUser(userData)
   └──────┬──────┘     setIsAuthenticated(true)
          │
          ▼
   ┌─────────────┐
   │ AuthButton  │ ─── Shows user profile + logout
   └─────────────┘
```

## File Responsibilities

```
Frontend (React/Electron)
├── src/renderer/
│   ├── App.jsx ...................... Wraps app with AuthProvider
│   ├── contexts/
│   │   └── AuthContext.jsx .......... Global auth state management
│   └── components/
│       └── AuthButton.jsx ........... Login/Logout UI
│
├── src/
│   ├── preload.js ................... IPC bridge (window.auth API)
│   └── main.js ...................... Initializes auth handlers
│
└── navi/src/
    └── auth.js ...................... Auth0 window management

Backend (Flask)
└── server.py ........................ OAuth endpoints + session
    ├── /login ....................... Start Auth0 flow
    ├── /callback .................... Handle Auth0 redirect
    ├── /logout ...................... Clear session
    ├── /api/user .................... Get user info
    └── /api/auth/status ............. Check login status
```

## Data Flow

```
┌──────────────┐
│     .env     │ Environment Variables
└──────┬───────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌──────────┐    ┌──────────┐
│ Flask    │    │Electron  │
│ Backend  │    │  Main    │
└─────┬────┘    └────┬─────┘
      │              │
      │ Session      │ IPC
      │ Cookie       │ Bridge
      │              │
      ▼              ▼
┌──────────┐    ┌──────────┐
│  Auth0   │    │  React   │
│ Provider │    │    UI    │
└──────────┘    └──────────┘
      ▲              ▲
      │              │
      └──────┬───────┘
             │
        User Data
```

## Security Layers

```
1. Environment Variables (.env)
   └─► Stores secrets securely
   
2. Context Isolation (Electron)
   └─► Separates main/renderer processes
   
3. Session Management (Flask)
   └─► Server-side session storage
   
4. HTTPS (Auth0)
   └─► Encrypted communication
   
5. CORS Configuration
   └─► Restricts API access
```

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **AuthContext** | `src/renderer/contexts/AuthContext.jsx` | React state management |
| **AuthButton** | `src/renderer/components/AuthButton.jsx` | User interface |
| **Auth Handlers** | `navi/src/auth.js` | Electron auth logic |
| **Preload Bridge** | `src/preload.js` | Secure IPC communication |
| **Flask Routes** | `server.py` | OAuth endpoints |
| **Auth0 Config** | `.env` | Credentials & settings |

## Communication Protocols

```
React ←→ Electron:  IPC (Inter-Process Communication)
Electron ←→ Flask:  HTTP/HTTPS REST API
Flask ←→ Auth0:     OAuth 2.0 / OIDC
```

## Session Management

```
┌─────────────────────────────────────────┐
│            Session Lifecycle             │
├─────────────────────────────────────────┤
│                                          │
│  1. Login  ─────► Session Created       │
│                   (Flask server-side)    │
│                                          │
│  2. Request ────► Cookie Sent           │
│                   (HTTP header)          │
│                                          │
│  3. Verify ─────► Session Validated     │
│                   (Flask checks cookie)  │
│                                          │
│  4. Logout ─────► Session Destroyed     │
│                   (Flask clears session) │
│                                          │
└─────────────────────────────────────────┘
```

## Error Handling

```
Auth Error Types:
├── Configuration Error ─── Auth0 not set up
├── Network Error ────────── Backend unreachable
├── Auth Failure ─────────── Invalid credentials
├── Session Expired ──────── Token expired
└── Window Closed ────────── User cancelled
```

## Environment Variables Required

```
AUTH0_DOMAIN ................ your-tenant.auth0.com
AUTH0_CLIENT_ID ............. OAuth client identifier
AUTH0_CLIENT_SECRET ......... OAuth client secret
AUTH0_AUDIENCE .............. API identifier (optional)
APP_SECRET_KEY .............. Flask session encryption
BACKEND_URL ................. http://localhost:5000
NODE_ENV .................... development/production
```
