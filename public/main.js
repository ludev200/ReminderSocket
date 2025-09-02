let socket = null;

const $ = (sel) => document.querySelector(sel);
const connStatus = $("#connStatus");
const serverUrlInput = $("#serverUrl");
const userIdInput = $("#userId");
const list = $("#list");

const connectBtn = $("#connectBtn");
connectBtn.addEventListener("click", () => {
  const url = serverUrlInput.value.trim();
  const userId = userIdInput.value.trim() || `web-${Math.random().toString(36).slice(2, 8)}`;

  if (socket) {
    socket.disconnect();
  }

  // global io is provided by /socket.io/socket.io.js served from the server
  socket = window.io(url, {
    transports: ["websocket"],
    query: { userId },
  });

  bindSocket(socket);
});

function bindSocket(s) {
  s.on("connect", () => {
    connStatus.textContent = "Conectado";
    connStatus.classList.remove("err");
    connStatus.classList.add("ok");
  });

  s.on("disconnect", () => {
    connStatus.textContent = "Desconectado";
    connStatus.classList.remove("ok");
    connStatus.classList.add("err");
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
  const url = serverUrlInput.value.trim() || "http://localhost:4000";
  const userId = userIdInput.value.trim();
  const title = $("#title").value.trim();
  const message = $("#message").value.trim();
  const delaySeconds = Number($("#delay").value || 0);
  const at = delaySeconds > 0 ? Date.now() + delaySeconds * 1000 : undefined;

  const payload = { userId: userId || undefined, title, message, at };
  const resEl = $("#sendResult");
  resEl.textContent = "";
  try {
    const res = await fetch(`${url}/api/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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