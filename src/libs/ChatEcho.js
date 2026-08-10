/* Direct port of web's lib/ChatEcho.js. Dynamic imports keep laravel-echo
   and pusher-js out of the server bundle (browser-only libs) — same
   reasoning applies in the Capacitor webview since this still runs as
   client-side JS, not native code. No changes needed vs. web. */

let echoInstance = null;
let echoToken = null;

export async function getChatEcho(token) {
  if (echoInstance && echoToken === token) return echoInstance;

  if (echoInstance) {
    try {
      echoInstance.disconnect();
    } catch (_) {}
    echoInstance = null;
    echoToken = null;
  }

  const [{ default: Echo }, { default: Pusher }] = await Promise.all([
    import("laravel-echo"),
    import("pusher-js"),
  ]);

  if (typeof window !== "undefined") {
    window.Pusher = Pusher;
  }

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_WS_HOST,
    wsPort: process.env.NEXT_PUBLIC_REVERB_PORT,
    wssPort: process.env.NEXT_PUBLIC_REVERB_PORT,
    forceTLS: process.env.NEXT_PUBLIC_REVERB_SCHEME,
    enabledTransports: ["ws", "wss"],
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(
            /\/api$/,
            "",
          )}/broadcasting/auth`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          },
        )
          .then((r) => r.json())
          .then((data) => callback(null, data))
          .catch((err) => callback(err));
      },
    }),
  });

  echoToken = token;
  return echoInstance;
}

export function disconnectChatEcho() {
  if (echoInstance) {
    try {
      echoInstance.disconnect();
    } catch (_) {}
    echoInstance = null;
    echoToken = null;
  }
}
