import { BrowserWindow, ipcMain, net } from 'electron';
import { URL } from 'url';

// Auth0 Configuration
const AUTH0_CONFIG = {
    domain: process.env.AUTH0_DOMAIN || 'dev-iuubo1tzok0w64at.us.auth0.com',
    clientId: process.env.AUTH0_CLIENT_ID || 'FDXgon7aNpQdLAbU4bcJ6GIu79J8f4Ii',
    audience: process.env.AUTH0_AUDIENCE || '',
    redirectUri: 'http://localhost:3000/auth/callback',
};

// In-memory store for auth data
let authStore = {
    user: null,
    tokens: null,
    isAuthenticated: false,
};

// Helper function to make HTTP requests using Electron's net module
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const requestOptions = {
            method: options.method || 'GET',
            url: url,
        };

        const request = net.request(requestOptions);

        // Set headers
        const headers = options.headers || {};
        if (options.body && typeof options.body === 'object' && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        Object.keys(headers).forEach(key => {
            request.setHeader(key, headers[key]);
        });

        let data = '';

        request.on('response', (response) => {
            response.on('data', (chunk) => {
                data += chunk.toString();
            });

            response.on('end', () => {
                try {
                    const jsonData = data ? JSON.parse(data) : {};
                    resolve({
                        ok: response.statusCode >= 200 && response.statusCode < 300,
                        status: response.statusCode,
                        data: jsonData,
                        json: async () => jsonData,
                    });
                } catch (e) {
                    resolve({
                        ok: response.statusCode >= 200 && response.statusCode < 300,
                        status: response.statusCode,
                        data: data,
                        text: async () => data,
                    });
                }
            });
        });

        request.on('error', (error) => {
            reject(error);
        });

        // Write body if present
        if (options.body) {
            if (typeof options.body === 'object') {
                request.write(JSON.stringify(options.body), 'utf8');
            } else {
                request.write(options.body, 'utf8');
            }
        }

        request.end();
    });
}

// Check if Auth0 is configured
function isAuth0Configured() {
    return AUTH0_CONFIG.domain &&
        AUTH0_CONFIG.domain !== 'YOUR_AUTH0_DOMAIN.auth0.com' &&
        !AUTH0_CONFIG.domain.includes('YOUR_') &&
        AUTH0_CONFIG.clientId &&
        AUTH0_CONFIG.clientId !== 'YOUR_AUTH0_CLIENT_ID' &&
        !AUTH0_CONFIG.clientId.includes('YOUR_');
}

// Map provider names to Auth0 connection names
const PROVIDER_CONNECTION_MAP = {
    'google': 'google-oauth2',
    'github': 'github',
    'discord': 'discord',
    // Add more as needed
};

// Handle Auth0 Login directly (no backend required)
async function handleAuth0Login(provider = 'google') {
    if (!isAuth0Configured()) {
        // For development: Return mock user if Auth0 is not configured
        console.warn('Auth0 not configured, using mock authentication');
        const mockUsers = {
            google: { name: 'Google User', email: 'user@gmail.com', avatar: 'https://ui-avatars.com/api/?name=Google+User&background=4285f4&color=fff' },
            github: { name: 'GitHub User', email: 'user@github.com', avatar: 'https://ui-avatars.com/api/?name=GitHub+User&background=24292e&color=fff' },
            discord: { name: 'Discord User', email: 'user@discord.com', avatar: 'https://ui-avatars.com/api/?name=Discord+User&background=5865f2&color=fff' },
        };

        authStore.user = mockUsers[provider] || mockUsers.google;
        authStore.isAuthenticated = true;

        return {
            success: true,
            user: authStore.user,
        };
    }

    // Map provider to Auth0 connection name
    const connectionName = PROVIDER_CONNECTION_MAP[provider.toLowerCase()] || provider;
    console.log(`Attempting login with provider: ${provider}, connection: ${connectionName}`);

    return new Promise((resolve, reject) => {
        const authWindow = new BrowserWindow({
            width: 500,
            height: 700,
            show: true,
            modal: true,
            parent: BrowserWindow.getFocusedWindow(),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
            },
        });

        // Build Auth0 authorization URL
        const authUrl = new URL(`https://${AUTH0_CONFIG.domain}/authorize`);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('client_id', AUTH0_CONFIG.clientId);
        authUrl.searchParams.set('redirect_uri', AUTH0_CONFIG.redirectUri);
        authUrl.searchParams.set('scope', 'openid profile email');

        // Use the mapped connection name
        authUrl.searchParams.set('connection', connectionName);

        if (AUTH0_CONFIG.audience) {
            authUrl.searchParams.set('audience', AUTH0_CONFIG.audience);
        }

        console.log('Auth0 URL:', authUrl.toString());

        authWindow.loadURL(authUrl.toString());

        // Handle navigation events to catch the callback
        const handleNavigation = async (event, url) => {
            console.log('Navigation event:', url);
            if (url.startsWith(AUTH0_CONFIG.redirectUri)) {
                event.preventDefault();

                try {
                    const urlObj = new URL(url);
                    const code = urlObj.searchParams.get('code');
                    const error = urlObj.searchParams.get('error');
                    const errorDescription = urlObj.searchParams.get('error_description');

                    if (error) {
                        authWindow.close();

                        // Provide helpful error messages
                        let errorMsg = errorDescription || error;
                        if (error === 'unauthorized' || errorDescription?.includes('connection is not enabled')) {
                            errorMsg = `The ${provider} connection is not enabled in your Auth0 dashboard. Please enable it in Authentication > Social > ${provider.charAt(0).toUpperCase() + provider.slice(1)} and make sure it's enabled for this application.`;
                        } else if (error === 'access_denied') {
                            errorMsg = 'Authentication was cancelled or denied.';
                        } else if (error === 'invalid_request') {
                            errorMsg = 'Invalid authentication request. Please check your Auth0 configuration.';
                        }

                        console.error('Auth0 error:', error, errorDescription);
                        reject(new Error(errorMsg));
                        return;
                    }

                    if (code) {
                        console.log('Received authorization code, exchanging for tokens...');
                        // Exchange code for tokens
                        // Auth0 token endpoint expects form-encoded data
                        const tokenUrl = `https://${AUTH0_CONFIG.domain}/oauth/token`;
                        const formData = new URLSearchParams({
                            grant_type: 'authorization_code',
                            client_id: AUTH0_CONFIG.clientId,
                            code: code,
                            redirect_uri: AUTH0_CONFIG.redirectUri,
                        }).toString();

                        const tokenResponse = await makeRequest(tokenUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                            },
                            body: formData,
                        });

                        console.log('Token response status:', tokenResponse.status);
                        if (tokenResponse.ok && tokenResponse.data.access_token) {
                            authStore.tokens = tokenResponse.data;

                            // Get user info
                            const userInfoUrl = `https://${AUTH0_CONFIG.domain}/userinfo`;
                            const userResponse = await makeRequest(userInfoUrl, {
                                headers: {
                                    'Authorization': `Bearer ${authStore.tokens.access_token}`,
                                },
                            });

                            console.log('User info response status:', userResponse.status);
                            if (userResponse.ok && userResponse.data) {
                                authStore.user = {
                                    name: userResponse.data.name || userResponse.data.nickname || userResponse.data.email,
                                    email: userResponse.data.email,
                                    avatar: userResponse.data.picture || userResponse.data.avatar_url,
                                    sub: userResponse.data.sub,
                                };
                                authStore.isAuthenticated = true;
                                authWindow.close();

                                resolve({
                                    success: true,
                                    user: authStore.user,
                                });
                            } else {
                                console.error('User info error:', userResponse.data);
                                authWindow.close();
                                reject(new Error('Failed to fetch user info: ' + JSON.stringify(userResponse.data)));
                            }
                        } else {
                            console.error('Token exchange error:', tokenResponse.data);
                            authWindow.close();
                            reject(new Error('Failed to exchange authorization code: ' + JSON.stringify(tokenResponse.data)));
                        }
                    }
                } catch (error) {
                    console.error('Auth navigation error:', error);
                    authWindow.close();
                    reject(error);
                }
            }
        };

        // Listen for both redirect and navigation events
        authWindow.webContents.on('will-redirect', handleNavigation);
        authWindow.webContents.on('did-navigate', (event, url) => {
            handleNavigation({ preventDefault: () => { } }, url);
        });

        authWindow.on('closed', () => {
            if (!authStore.isAuthenticated) {
                reject(new Error('Authentication window closed'));
            }
        });
    });
}

// Logout
async function handleLogout() {
    try {
        // Save tokens before clearing (for Auth0 logout)
        const tokens = authStore.tokens;

        // Clear local store
        authStore = {
            user: null,
            tokens: null,
            isAuthenticated: false,
        };

        // Optionally revoke token with Auth0
        if (isAuth0Configured() && tokens?.access_token) {
            try {
                await makeRequest(`https://${AUTH0_CONFIG.domain}/v2/logout`, {
                    method: 'POST',
                    body: {
                        client_id: AUTH0_CONFIG.clientId,
                        returnTo: AUTH0_CONFIG.redirectUri,
                    },
                });
            } catch (error) {
                console.error('Error during Auth0 logout:', error);
                // Continue with logout even if Auth0 logout fails
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
    }
}

// Check auth status
async function checkAuthStatus() {
    // Check if we have a valid user in memory
    if (authStore.isAuthenticated && authStore.user) {
        // Optionally validate token with Auth0
        if (isAuth0Configured() && authStore.tokens?.access_token) {
            try {
                const userInfoUrl = `https://${AUTH0_CONFIG.domain}/userinfo`;
                const userResponse = await makeRequest(userInfoUrl, {
                    headers: {
                        'Authorization': `Bearer ${authStore.tokens.access_token}`,
                    },
                });

                if (userResponse.ok) {
                    return {
                        isAuthenticated: true,
                        user: authStore.user,
                    };
                } else {
                    // Token invalid, clear auth
                    authStore = {
                        user: null,
                        tokens: null,
                        isAuthenticated: false,
                    };
                }
            } catch (error) {
                console.error('Error validating token:', error);
            }
        } else {
            // Mock auth or token not available, return current state
            return {
                isAuthenticated: authStore.isAuthenticated,
                user: authStore.user,
            };
        }
    }

    return {
        isAuthenticated: false,
        user: null,
    };
}

// IPC Handlers
export function setupAuthHandlers() {
    ipcMain.handle('auth:login', async (event, provider = 'google') => {
        try {
            const result = await handleAuth0Login(provider);
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
        return await handleLogout();
    });

    ipcMain.handle('auth:getStatus', async () => {
        return await checkAuthStatus();
    });

    ipcMain.handle('auth:getConfig', async () => {
        return {
            configured: isAuth0Configured(),
            domain: AUTH0_CONFIG.domain,
            clientId: AUTH0_CONFIG.clientId,
        };
    });
}
