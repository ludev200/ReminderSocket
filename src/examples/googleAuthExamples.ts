/**
 * Examples of how to use Google OAuth Authentication
 * 
 * This file contains examples of how to implement Google OAuth
 * in your frontend application.
 */

// Example 1: Frontend React component for Google Login
const googleLoginComponent = `
import React from 'react';

const GoogleLoginButton: React.FC = () => {
  const handleGoogleLogin = () => {
    // Redirect to Google OAuth endpoint
    window.location.href = 'http://localhost:4000/api/auth/google';
  };

  return (
    <button 
      onClick={handleGoogleLogin}
      style={{
        backgroundColor: '#4285f4',
        color: 'white',
        padding: '12px 24px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px'
      }}
    >
      Sign in with Google
    </button>
  );
};

export default GoogleLoginButton;
`;

// Example 2: Handle OAuth callback in React
const oauthCallbackHandler = `
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const user = searchParams.get('user');

    if (token && user) {
      // Store token in localStorage or state management
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', user);
      
      // Redirect to dashboard or home page
      navigate('/dashboard');
    } else {
      // Handle error case
      navigate('/login?error=oauth_failed');
    }
  }, [navigate, searchParams]);

  return (
    <div>
      <h2>Processing authentication...</h2>
      <p>Please wait while we complete your sign-in.</p>
    </div>
  );
};

export default OAuthCallback;
`;

// Example 3: Protected route component
const protectedRouteComponent = `
import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
`;

// Example 4: API service for authenticated requests
const apiServiceExample = `
class ApiService {
  private baseUrl = 'http://localhost:4000/api';
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = \`Bearer \${this.token}\`;
    }

    return headers;
  }

  async get(endpoint: string) {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    return response.json();
  }

  async post(endpoint: string, data: any) {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    return response.json();
  }

  // Update token when it changes
  updateToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Clear token on logout
  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
}

export default new ApiService();
`;

// Example 5: Socket.IO connection with authentication
const socketConnectionExample = `
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    this.token = token;
    
    this.socket = io('http://localhost:4000', {
      auth: { token },
      withCredentials: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export default new SocketService();
`;

// Example 6: Complete authentication flow
const completeAuthFlow = `
import React, { useState, useEffect } from 'react';
import ApiService from './services/ApiService';
import SocketService from './services/SocketService';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        
        // Connect to Socket.IO
        SocketService.connect(token);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:4000/api/auth/google';
  };

  const handleLogout = async () => {
    try {
      await ApiService.post('/auth/logout', { token: localStorage.getItem('authToken') });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local data
      ApiService.clearToken();
      SocketService.disconnect();
      setUser(null);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div>
        <h1>Welcome to Socket Reminders</h1>
        <button onClick={handleGoogleLogin}>
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Username: {user.username}</p>
      {user.email && <p>Email: {user.email}</p>}
      {user.avatar && <img src={user.avatar} alt="Profile" style={{ width: 50, height: 50, borderRadius: '50%' }} />}
      
      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default App;
`;

// Example 7: Environment variables for frontend
const frontendEnvExample = `
# .env file for React frontend
REACT_APP_API_URL=http://localhost:4000
REACT_APP_SOCKET_URL=http://localhost:4000
REACT_APP_GOOGLE_OAUTH_URL=http://localhost:4000/api/auth/google
`;

console.log('Google OAuth Authentication Examples:');
console.log('=====================================');
console.log('');
console.log('1. Google Login Button Component:', googleLoginComponent);
console.log('');
console.log('2. OAuth Callback Handler:', oauthCallbackHandler);
console.log('');
console.log('3. Protected Route Component:', protectedRouteComponent);
console.log('');
console.log('4. API Service with Authentication:', apiServiceExample);
console.log('');
console.log('5. Socket.IO Connection with Auth:', socketConnectionExample);
console.log('');
console.log('6. Complete Authentication Flow:', completeAuthFlow);
console.log('');
console.log('7. Frontend Environment Variables:', frontendEnvExample);

export {
  googleLoginComponent,
  oauthCallbackHandler,
  protectedRouteComponent,
  apiServiceExample,
  socketConnectionExample,
  completeAuthFlow,
  frontendEnvExample
};
