let socket = null;
let authToken = null;

const $ = (sel) => document.querySelector(sel);
const connStatus = $("#connStatus");
const serverUrlInput = $("#serverUrl");
const userIdInput = $("#userId");
const list = $("#list");

// Login function to get JWT token
async function login(username, password) {
  try {
    const url = serverUrlInput.value.trim() || "http://localhost:4000";
    const response = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const data = await response.json();
    authToken = data.token;
    
    // Store token in localStorage
    localStorage.setItem('authToken', authToken);
    
    return data.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Connect to Socket.IO with authentication
const connectBtn = $("#connectBtn");
connectBtn.addEventListener("click", async () => {
  try {
    const url = serverUrlInput.value.trim();
    const username = userIdInput.value.trim();
    const password = prompt("Enter password for " + username);
    
    if (!username || !password) {
      alert("Username and password are required");
      return;
    }

    // Login to get token
    const user = await login(username, password);
    console.log(`Logged in as ${user.name} (${user.username})`);

    if (socket) {
      socket.disconnect();
    }

    // Connect to Socket.IO with JWT token
    socket = window.io(url, {
      transports: ["websocket"],
      auth: {
        token: authToken
      }
    });

    bindSocket(socket);
  } catch (error) {
    alert("Connection failed: " + error.message);
    connStatus.textContent = "Error";
    connStatus.classList.remove("ok");
    connStatus.classList.add("err");
  }
});

function bindSocket(s) {
  s.on("connect", () => {
    connStatus.textContent = "Conectado";
    connStatus.classList.remove("err");
    connStatus.classList.add("ok");
  });

  s.on("connect_error", (error) => {
    console.error("Connection error:", error);
    connStatus.textContent = "Error de Auth";
    connStatus.classList.remove("ok");
    connStatus.classList.add("err");
    
    if (error.message === "Authentication token required") {
      alert("Token de autenticación requerido");
    } else if (error.message === "Invalid or expired token") {
      alert("Token inválido o expirado. Por favor, vuelve a hacer login.");
      localStorage.removeItem('authToken');
      authToken = null;
    }
  });

  s.on("disconnect", (reason) => {
    connStatus.textContent = "Desconectado";
    connStatus.classList.remove("ok");
    connStatus.classList.add("err");
    console.log(`Disconnected: ${reason}`);
  });

  s.on("reminder", (data) => {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <div class="title">${escapeHtml(data.title)}</div>
      <div>${escapeHtml(data.message)}</div>
      <div class="meta">${new Date(data.timestamp).toLocaleString()}</div>
    `;
    list.prepend(li);

    // Optional: Web Notifications
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(data.title, { body: data.message });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  });
}

const sendBtn = $("#sendBtn");
sendBtn.addEventListener("click", async () => {
  if (!authToken) {
    alert("Please login first");
    return;
  }

  const url = serverUrlInput.value.trim() || "http://localhost:4000";
  const title = $("#title").value.trim();
  const message = $("#message").value.trim();
  const delaySeconds = Number($("#delay").value || 0);
  const at = delaySeconds > 0 ? Date.now() + delaySeconds * 1000 : undefined;

  const payload = { title, message, at, broadcast: false };
  const resEl = $("#sendResult");
  resEl.textContent = "";
  
  try {
    const res = await fetch(`${url}/api/reminders`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    resEl.textContent = JSON.stringify(data);
  } catch (e) {
    resEl.textContent = String(e);
  }
});

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Check for existing token on page load
window.addEventListener('load', () => {
  const savedToken = localStorage.getItem('authToken');
  if (savedToken) {
    authToken = savedToken;
    console.log('Found saved token');
  }
});