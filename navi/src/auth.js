import { BrowserWindow, ipcMain } from 'electron';
import { URL } from 'url';

// OAuth Configuration
// Note: In production, these should be stored in environment variables or secure config
const OAUTH_CONFIG = {
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        redirectUri: 'http://localhost:3000/auth/callback',
        scopes: ['openid', 'email', 'profile'],
    },
    github: {
        clientId: process.env.GITHUB_CLIENT_ID || 'YOUR_GITHUB_CLIENT_ID',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || 'YOUR_GITHUB_CLIENT_SECRET',
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        redirectUri: 'http://localhost:3000/auth/callback',
        scopes: ['user:email'],
    },
    discord: {
        clientId: process.env.DISCORD_CLIENT_ID || 'YOUR_DISCORD_CLIENT_ID',
        clientSecret: process.env.DISCORD_CLIENT_SECRET || 'YOUR_DISCORD_CLIENT_SECRET',
        authUrl: 'https://discord.com/api/oauth2/authorize',
        tokenUrl: 'https://discord.com/api/oauth2/token',
        redirectUri: 'http://localhost:3000/auth/callback',
        scopes: ['identify', 'email'],
    },
};

// In-memory store for auth data (in production, use electron-store)
let authStore = {
    user: null,
    tokens: null,
    provider: null,
};

// Generate OAuth URL
function getOAuthUrl(provider) {
    const config = OAUTH_CONFIG[provider];
    if (!config) {
        throw new Error(`Unsupported provider: ${provider}`);
    }

    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: config.scopes.join(' '),
        state: provider, // Store provider in state for verification
    });

    return `${config.authUrl}?${params.toString()}`;
}

// Mock OAuth flow - returns mock user data
// In production, you would:
// 1. Open OAuth window
// 2. Handle redirect with authorization code
// 3. Exchange code for token
// 4. Fetch user info from provider API
async function handleOAuthLogin(provider) {
    return new Promise((resolve, reject) => {
        const config = OAUTH_CONFIG[provider];

        // Check if credentials are configured
        if (config.clientId.startsWith('YOUR_') || config.clientSecret.startsWith('YOUR_')) {
            // Mock authentication for development
            console.log(`⚠️  Using mock authentication for ${provider}. Configure OAuth credentials for production.`);

            // Simulate OAuth window
            const authWindow = new BrowserWindow({
                width: 500,
                height: 600,
                show: false,
                modal: true,
                parent: BrowserWindow.getFocusedWindow(),
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                },
            });

            // Show mock login page
            authWindow.loadURL(`data:text/html;charset=utf-8,
        <!DOCTYPE html>
        <html>
        <head>
          <title>${provider.charAt(0).toUpperCase() + provider.slice(1)} Login</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              padding: 40px;
              border-radius: 20px;
              text-align: center;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            h1 { margin-top: 0; }
            button {
              background: white;
              color: #667eea;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              margin-top: 20px;
            }
            button:hover { opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔐 ${provider.charAt(0).toUpperCase() + provider.slice(1)} Login</h1>
            <p>Mock authentication for development</p>
            <button onclick="window.close()">Continue as Mock User</button>
          </div>
        </body>
        </html>
      `);

            authWindow.show();

            authWindow.on('closed', () => {
                // Mock user data
                const mockUsers = {
                    google: {
                        id: 'google_123',
                        name: 'John Doe',
                        email: 'john.doe@gmail.com',
                        avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=4285f4&color=fff',
                        provider: 'google',
                    },
                    github: {
                        id: 'github_456',
                        name: 'Jane Smith',
                        email: 'jane.smith@github.com',
                        avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=24292e&color=fff',
                        provider: 'github',
                    },
                    discord: {
                        id: 'discord_789',
                        name: 'Discord User',
                        email: 'user@discord.com',
                        avatar: 'https://ui-avatars.com/api/?name=Discord+User&background=5865f2&color=fff',
                        provider: 'discord',
                    },
                };

                // Store auth data
                authStore.user = mockUsers[provider];
                authStore.provider = provider;
                authStore.tokens = {
                    accessToken: `mock_access_token_${provider}_${Date.now()}`,
                    refreshToken: `mock_refresh_token_${provider}_${Date.now()}`,
                };

                resolve({
                    success: true,
                    user: authStore.user,
                });
            });

            return;
        }

        // Real OAuth flow (when credentials are configured)
        const authUrl = getOAuthUrl(provider);
        const authWindow = new BrowserWindow({
            width: 500,
            height: 600,
            show: true,
            modal: true,
            parent: BrowserWindow.getFocusedWindow(),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
            },
        });

        authWindow.loadURL(authUrl);

        authWindow.webContents.on('will-redirect', (event, navigationUrl) => {
            const url = new URL(navigationUrl);

            if (url.origin === 'http://localhost:3000' && url.pathname === '/auth/callback') {
                const code = url.searchParams.get('code');
                const state = url.searchParams.get('state');

                if (code && state === provider) {
                    event.preventDefault();
                    authWindow.close();

                    // Exchange code for token (implement this based on your backend)
                    // For now, return mock data
                    resolve({
                        success: true,
                        user: {
                            id: `${provider}_${Date.now()}`,
                            name: 'User',
                            email: `user@${provider}.com`,
                            provider,
                        },
                    });
                }
            }
        });

        authWindow.on('closed', () => {
            reject(new Error('Authentication window closed'));
        });
    });
}

// IPC Handlers
export function setupAuthHandlers() {
    ipcMain.handle('auth:login', async (event, provider) => {
        try {
            const result = await handleOAuthLogin(provider);
            return result;
        } catch (error) {
            console.error('Auth error:', error);
            return {
                success: false,
                error: error.message || 'Authentication failed',
            };
        }
    });

    ipcMain.handle('auth:logout', async () => {
        authStore = {
            user: null,
            tokens: null,
            provider: null,
        };
        return { success: true };
    });

    ipcMain.handle('auth:getStatus', async () => {
        return {
            isAuthenticated: !!authStore.user,
            user: authStore.user,
        };
    });
}

