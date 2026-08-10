"use client";

import { useEffect, useRef, useCallback } from "react";
import useChatStore from "@/store/ChatStore";
import chatApi from "@/libs/chatApi";
import { getChatEcho, disconnectChatEcho } from "@/libs/ChatEcho";

/* ------------------------------------------------------------------ */
/*  Ported from web's customHooks/useChat.js. Kept identical:            */
/*    connect(), sendMessage(), disconnect(), fetchOlderMessages(),      */
/*    the Echo subscription + listen(".message.sent") logic.             */
/*                                                                        */
/*  ADAPTED vs. web: the "if (!isOpen) fireToast(...)" branch is gone,    */
/*  since Chat is a tab now — there's no floating overlay for a toast to  */
/*  point at. Replaced with an `unreadCount` the tab bar can badge        */
/*  instead: it increments on an incoming admin message while the Chat    */
/*  screen isn't the active tab, and clears once the user actually opens  */
/*  it (call `clearUnread()` from the Chat screen's mount effect).        */
/* ------------------------------------------------------------------ */

export default function useChat() {
  const {
    chatToken,
    setChatToken,
    clearChatToken,
    conversation,
    messages,
    connectionStatus,
    connectionError,
    setConversation,
    setMessages,
    setConnectionStatus,
    setConnectionError,
    appendMessage,
    hasMore,
    setHasMore,
    prependMessages,
    unreadCount,
    incrementUnread,
    clearUnread,
  } = useChatStore();

  const fetchOlderMessages = useCallback(async () => {
    if (!chatToken || !hasMore) return;

    const oldestId = useChatStore.getState().messages[0]?.id;
    if (!oldestId) return;

    try {
      const res = await chatApi.fetchOlderMessages(chatToken, oldestId);
      const older = res.data ?? [];

      if (older.length === 0) {
        setHasMore(false);
        return;
      }

      prependMessages(older);
      if (older.length < 20) setHasMore(false);
    } catch (err) {
      console.warn("[useChat] fetchOlderMessages failed:", err);
    }
  }, [chatToken, hasMore, setHasMore, prependMessages]);

  const echoChannelRef = useRef(null);
  const subscribedConvIdRef = useRef(null);

  const subscribeToEcho = useCallback(
    async (token, conversationId) => {
      if (subscribedConvIdRef.current === conversationId) return;
      subscribedConvIdRef.current = conversationId;

      try {
        const echo = await getChatEcho(token);
        const channel = echo.private(`conversation.${conversationId}`);

        channel.listen(".message.sent", (data) => {
          if (data.sender_type !== "admin") return;

          appendMessage(data);
          chatApi.markRead(token).catch(() => {});

          // Tab-bar badge instead of a corner toast — active tab is
          // tracked by whoever mounts this hook calling clearUnread().
          incrementUnread();
        });

        echoChannelRef.current = channel;
      } catch (err) {
        subscribedConvIdRef.current = null;
        console.warn("[useChat] Echo subscription failed:", err);
      }
    },
    [appendMessage, incrementUnread],
  );

  const connect = useCallback(
    async (token) => {
      setConnectionStatus("connecting");
      setConnectionError(null);

      try {
        const res = await chatApi.startConversation(token);
        if (!res.data?.conversation)
          throw new Error("Invalid response from server");

        const conv = res.data.conversation;
        const msgs = res.data.messages ?? [];

        setChatToken(token);
        setConversation(conv);
        setMessages(msgs);
        setConnectionStatus("connected");
        setHasMore(msgs.length >= 20);

        chatApi.markRead(token).catch(() => {});
        await subscribeToEcho(token, conv.id);
      } catch (err) {
        setConnectionStatus("error");
        setConnectionError(err.message ?? "Connection failed");
        throw err;
      }
    },
    [
      setChatToken,
      setConversation,
      setMessages,
      setConnectionStatus,
      setConnectionError,
      setHasMore,
      subscribeToEcho,
    ],
  );

  const sendMessage = useCallback(
    async (body, files = []) => {
      if (!chatToken) return;
      if (!body.trim() && files.length === 0) return;

      try {
        let res;
        if (files.length > 0) {
          res = await chatApi.sendMessageWithAttachments(
            chatToken,
            body.trim(),
            files,
          );
        } else {
          res = await chatApi.sendMessage(chatToken, body);
        }
        if (res.data) appendMessage(res.data);
      } catch (err) {
        throw err; // let the ChatInput's try/catch surface it as needed
      }
    },
    [chatToken, appendMessage],
  );

  const disconnect = useCallback(() => {
    if (echoChannelRef.current) {
      try {
        echoChannelRef.current.stopListening(".message.sent");
      } catch (_) {}
      echoChannelRef.current = null;
    }
    subscribedConvIdRef.current = null;
    disconnectChatEcho();
    clearChatToken();
  }, [clearChatToken]);

  useEffect(() => {
    return () => {
      if (echoChannelRef.current) {
        try {
          echoChannelRef.current.stopListening(".message.sent");
        } catch (_) {}
        echoChannelRef.current = null;
      }
      subscribedConvIdRef.current = null;
    };
  }, []);

  return {
    chatToken,
    conversation,
    messages,
    connectionStatus,
    connectionError,
    isConnected: connectionStatus === "connected",
    isConnecting: connectionStatus === "connecting",
    isClosed: conversation?.status === "closed",
    connect,
    sendMessage,
    disconnect,
    hasMore,
    fetchOlderMessages,
    unreadCount,
    clearUnread,
  };
}
