let socket = null;
let authToken = null;

const $ = (sel) => document.querySelector(sel);
const connStatus = $("#connStatus");
const serverUrlInput = $("#serverUrl");
const userIdInput = $("#userId");
const list = $("#list");

// Helpers
function apiBase() {
  return (serverUrlInput?.value?.trim() || "http://localhost:4000").replace(/\/$/, "");
}

// Register
const registerBtn = $("#registerBtn");
if (registerBtn) {
  registerBtn.addEventListener("click", async () => {
    const name = $("#regName").value.trim();
    const username = $("#regUsername").value.trim();
    const password = $("#regPassword").value.trim();
    const out = $("#registerResult");
    out.textContent = "";

    if (!name || !username || !password) {
      out.textContent = "Faltan campos";
      return;
    }

    try {
      const res = await fetch(`${apiBase()}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error de registro');
      out.textContent = 'Registro exitoso';
    } catch (e) {
      out.textContent = String(e.message || e);
    }
  });
}

// Login (form)
const loginBtn = $("#loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const username = $("#loginUsername").value.trim();
    const password = $("#loginPassword").value.trim();
    const out = $("#loginResult");
    out.textContent = "";

    try {
      const user = await login(username, password);
      out.textContent = `Bienvenido ${user.name} (${user.username})`;
    } catch (e) {
      out.textContent = String(e.message || e);
    }
  });
}

// Google login
const googleBtn = $("#googleBtn");
if (googleBtn) {
  googleBtn.addEventListener("click", () => {
    window.location.href = `${apiBase()}/api/auth/google`;
  });
}

// Login function to get JWT token
async function login(username, password) {
  try {
    const url = apiBase();
    const response = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Login failed');
    }
    
    const data = await response.json();
    authToken = data.token;
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
    const url = apiBase();
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

  const url = apiBase();
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

// Logout
const logoutBtn = document.querySelector('#logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      const url = apiBase();
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetch(`${url}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        }).catch(() => {});
      }
    } finally {
      localStorage.removeItem('authToken');
      authToken = null;
      if (socket) {
        try { socket.disconnect(); } catch {}
        socket = null;
      }
      connStatus.textContent = 'Desconectado';
      connStatus.classList.remove('ok');
      connStatus.classList.add('err');
      const out = document.querySelector('#loginResult');
      if (out) out.textContent = 'Sesión cerrada';
    }
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.addEventListener('load', () => {
  const savedToken = localStorage.getItem('authToken');
  if (savedToken) {
    authToken = savedToken;
    console.log('Found saved token');
  }
});