import dotenv from "dotenv";
import { io, Socket } from "socket.io-client";

dotenv.config();

const serverUrl = process.env.SERVER_URL || "http://localhost:4000";
const username = process.env.USERNAME || "test-user";
const password = process.env.PASSWORD || "123456";

// Get token from command line args or environment
const args = process.argv.slice(2);
const tokenFromArgs = args.find(arg => arg.startsWith('--token='))?.split('=')[1];
const tokenFromEnv = process.env.JWT_TOKEN;

const jwtToken = tokenFromArgs || tokenFromEnv;

async function loginAndConnect() {
  try {
    // If we have a token, skip login
    if (jwtToken) {
      console.log(`🔑 Using provided JWT token: ${jwtToken.substring(0, 20)}...`);
      
      // Validate token by calling /api/auth/me
      const response = await fetch(`${serverUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });

      if (!response.ok) {
        throw new Error('Invalid or expired token provided');
      }

      const userData = await response.json();
      const user = userData.user;
      
      console.log(`✅ Token valid! Welcome ${user.name} (${user.username})`);
      
      // Connect to Socket.IO with provided token
      const socket: Socket = io(serverUrl, {
        transports: ["websocket"],
        auth: {
          token: jwtToken
        }
      });

      bindSocket(socket, user);
      return;
    }

    // No token provided, do login
    console.log(`🔐 Attempting to login as ${username}...`);
    
    const response = await fetch(`${serverUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Login failed: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    const token = data.token;
    const user = data.user;

    console.log(`✅ Login successful! Welcome ${user.name} (${user.username})`);
    console.log(`🔑 JWT Token: ${token.substring(0, 20)}...`);
    console.log(`💡 You can reuse this token with: npm run dev:client -- --token=${token}`);

    // Connect to Socket.IO with JWT token
    const socket: Socket = io(serverUrl, {
      transports: ["websocket"],
      auth: {
        token: token
      }
    });

    bindSocket(socket, user);
    
  } catch (error) {
    console.error("❌ Authentication failed:", error instanceof Error ? error.message : String(error));
    console.log("\n💡 Solutions:");
    if (jwtToken) {
      console.log("1. Check if the token is valid and not expired");
      console.log("2. Try getting a new token with login");
    } else {
      console.log("1. Set USERNAME and PASSWORD in your .env file");
      console.log("2. Or create a user first with: POST /api/auth/register");
      console.log("3. Or provide a valid token: npm run dev:client -- --token=YOUR_TOKEN");
    }
    console.log("4. Check that the server is running");
    process.exit(1);
  }
}

function bindSocket(socket: Socket, user: any) {
  socket.on("connect", () => {
    console.log(`🔌 Connected as ${user.username}. Socket ID: ${socket.id}`);
  });

  socket.on("reminder", (data: { title: string; message: string; timestamp: number }) => {
    console.log(`\n📢 [REMINDER] ${data.title}: ${data.message}`);
    console.log(`   📅 ${new Date(data.timestamp).toLocaleString()}`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`🔌 Disconnected: ${reason}`);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Connection error:", err.message);
    
    if (err.message === "Authentication token required") {
      console.log("💡 Token de autenticación requerido");
    } else if (err.message === "Invalid or expired token") {
      console.log("💡 Token inválido o expirado. Vuelve a hacer login.");
    }
  });
}

// Start the client
console.log("🚀 Starting authenticated Socket.IO client...");
console.log(`🌐 Server: ${serverUrl}`);

if (jwtToken) {
  console.log(`🔑 Using provided token (skipping login)`);
} else {
  console.log(`👤 Username: ${username}`);
  console.log(`💡 Use --token=YOUR_TOKEN to skip login`);
}

loginAndConnect();