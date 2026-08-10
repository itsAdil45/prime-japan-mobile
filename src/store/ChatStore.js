import { create } from "zustand";

/* ------------------------------------------------------------------ */
/*  Adapted from web's store/ChatStore.js. DROPPED vs. web:              */
/*    isOpen / openChat / closeChat / toggleChat                        */
/*  Web needed these to control the floating overlay widget's visibility.*/
/*  On mobile, Chat is a tab — the screen itself IS the open/closed       */
/*  state (mounted = open), so there's nothing for isOpen to represent.  */
/*                                                                        */
/*  KEPT: everything else, unchanged — chatToken, conversation, messages,*/
/*  connectionStatus, connectionError, hasMore, and all the setter/       */
/*  append/prepend actions. Using zustand here (not just component state) */
/*  is deliberate: it persists chat state across tab switches, so          */
/*  navigating Home → Chat → Home → Chat doesn't lose the conversation      */
/*  or force a reconnect each time — same motivation as the useGet cache   */
/*  fix from earlier.                                                     */
/*                                                                        */
/*  Requires zustand — not currently in package.json, needs               */
/*  `npm install zustand` (pure JS, no native plugin, no rebuild needed).  */
/* ------------------------------------------------------------------ */

const useChatStore = create((set) => ({
  chatToken: null,
  setChatToken: (token) => set({ chatToken: token }),
  clearChatToken: () =>
    set({
      chatToken: null,
      conversation: null,
      messages: [],
      connectionStatus: "idle",
      connectionError: null,
      hasMore: true,
    }),

  conversation: null,
  messages: [],
  connectionStatus: "idle",
  connectionError: null,
  hasMore: true,

  setConversation: (conversation) => set({ conversation }),
  setMessages: (messages) => set({ messages }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setConnectionError: (connectionError) => set({ connectionError }),
  setHasMore: (hasMore) => set({ hasMore }),

  appendMessage: (msg) =>
    set((state) => {
      const exists = state.messages.some((m) => m.id === msg.id);
      if (exists) return {};
      return { messages: [...state.messages, msg] };
    }),

  prependMessages: (older) =>
    set((state) => {
      const existingIds = new Set(state.messages.map((m) => m.id));
      const fresh = older.filter((m) => !existingIds.has(m.id));
      return { messages: [...fresh, ...state.messages] };
    }),

  updateConversationStatus: (status) =>
    set((state) => ({
      conversation: state.conversation
        ? { ...state.conversation, status }
        : state.conversation,
    })),

  // Tab-bar badge — mobile's replacement for web's "toast if !isOpen"
  unreadCount: 0,
  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),
  clearUnread: () => set({ unreadCount: 0 }),
}));

export default useChatStore;
