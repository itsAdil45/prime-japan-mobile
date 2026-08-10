"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import useChat from "@/customHooks/useChat";
import ChatScreen from "@/components/Chat/ChatScreen"; // adjust path to wherever ChatScreen.jsx lives

/* ------------------------------------------------------------------ */
/*  This is the piece the ChatScreen.jsx file's own header comment       */
/*  already described as the intended integration shape — no changes     */
/*  needed to ChatScreen.jsx itself, since it was built prop-compatible   */
/*  with useChat() from the start.                                       */
/*                                                                        */
/*  Mirrors ChatWidget.jsx's connection-on-mount logic (hasConnectedRef    */
/*  guard, waits for sessionStatus to resolve before connecting) and its   */
/*  gate for unauthenticated users — just rendered as a full tab screen    */
/*  instead of an overlay.                                                */
/* ------------------------------------------------------------------ */

export default function ChatPage() {
  const { data: session, status: sessionStatus } = useSession();
  const chat = useChat();
  const hasConnectedRef = useRef(false);

  useEffect(() => {
    if (hasConnectedRef.current) return;
    if (chat.isConnected || chat.isConnecting) return;
    if (sessionStatus === "loading") return;

    const token = session?.user?.token;
    if (token) {
      hasConnectedRef.current = true;
      chat.connect(token);
    }
  }, [session?.user?.token, sessionStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear the tab-bar unread badge the moment this screen is actually open
  useEffect(() => {
    chat.clearUnread();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = (message, option) => {
    chat.sendMessage(option.label, []);
  };

  const handleRetry = () => {
    const token = session?.user?.token;
    if (token) chat.connect(token);
  };

  // Matches ChatWidget's gate: unauthenticated/no-token renders an error
  // state with a login prompt, same as web's "Please log in to access
  // support chat." — surfaced through connectionError so ChatScreen's
  // existing ErrorState handles it without any prop-shape changes.
  const isGuest = sessionStatus !== "loading" && !session?.user?.token;

  return (
    <ChatScreen
      conversation={chat.conversation}
      messages={chat.messages}
      isConnecting={sessionStatus === "loading" || chat.isConnecting}
      isConnected={chat.isConnected}
      connectionError={
        isGuest ? "Please log in to access support chat." : chat.connectionError
      }
      isClosed={chat.isClosed}
      hasMore={chat.hasMore}
      onSend={chat.sendMessage}
      onLoadMore={chat.fetchOlderMessages}
      onAction={handleAction}
      onRetry={handleRetry}
    />
  );
}
