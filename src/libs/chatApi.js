const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/* Direct port of web's lib/ChatApi.js — same endpoints, same auth header
   pattern, same multipart-attachment handling. No changes needed here
   since this is pure API-call logic, not UI. */

async function chatRequest(path, token, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers ?? {}),
    },
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? `HTTP ${res.status}`);
  return json;
}

const chatApi = {
  startConversation: (token) => chatRequest("/chat", token, { method: "POST" }),

  sendMessage: (token, body) =>
    chatRequest("/chat/messages", token, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  sendMessageWithAttachments: (token, body, files) =>
    fetch(`${API_BASE}/chat/messages?body=${encodeURIComponent(body)}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        // No Content-Type — browser sets multipart boundary automatically
      },
      body: (() => {
        const fd = new FormData();
        files.forEach((f) => fd.append("attachment", f));
        return fd;
      })(),
    }).then(async (res) => {
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? `HTTP ${res.status}`);
      return json;
    }),

  markRead: (token) => chatRequest("/chat/read", token, { method: "POST" }),

  fetchOlderMessages: (token, beforeId) =>
    chatRequest(`/chat/messages?before_id=${beforeId}`, token, {
      method: "GET",
    }),
};

export default chatApi;
