"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  Paperclip,
  X,
  Send,
  RefreshCcw,
  AlertTriangle,
  FileText,
} from "lucide-react";

const StyleBlock = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
    .font-display { font-family: 'Space Grotesk', sans-serif; }
    .font-ui { font-family: 'Inter', sans-serif; }
  `}</style>
);

const MAX_FILES = 5;
const MAX_MB = 10;
const ACCEPTED = "image/png,image/jpeg,image/gif,image/webp,application/pdf";

const MOCK_CONVERSATION = { id: 501, status: "open", admin: { name: "Agent" } };

const MOCK_MESSAGES = [
  {
    id: 1,
    sender_type: "admin",
    body: "Hi! How can I help with your shipment today?",
    created_at: "2026-07-10T09:00:00Z",
  },
  {
    id: 2,
    sender_type: "user",
    body: "I wanted to ask about the destination port for my last bid.",
    created_at: "2026-07-10T09:01:00Z",
  },
  {
    id: 3,
    sender_type: "admin",
    body: "Sure — could you tell me which shipping method you're using?",
    created_at: "2026-07-10T09:01:30Z",
    options: [{ label: "Container" }, { label: "RoRo" }],
  },
  {
    id: 4,
    sender_type: "user",
    body: "Container",
    created_at: "2026-07-10T09:02:00Z",
  },
  {
    id: 5,
    sender_type: "admin",
    body: "Got it — container shipments to Mombasa currently take 28-32 days from Yokohama port.",
    created_at: "2026-07-10T09:03:00Z",
  },
];

/* ---------- Formatting ---------- */

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/* ---------- Message bubble ---------- */

function MessageBubble({ message, onAction }) {
  const isUser = message.sender_type === "user";

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`font-ui max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm overflow-hidden ${
          isUser
            ? "rounded-br-md bg-zinc-900 text-white"
            : "rounded-bl-md bg-white text-zinc-800 shadow-sm"
        }`}
      >
        {message.attachments?.map((att, i) =>
          att.type?.startsWith("image/") ? (
            <img
              key={i}
              src={att.url}
              alt={att.name}
              className="mb-1.5 max-h-40 w-full rounded-lg object-cover"
            />
          ) : (
            <div
              key={i}
              className={`mb-1.5 flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs ${
                isUser ? "bg-white/10" : "bg-zinc-100"
              }`}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{att.name}</span>
            </div>
          ),
        )}
        {message.body && <p className="whitespace-pre-wrap">{message.body}</p>}
      </div>

      {message.options?.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {message.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => onAction(message, opt)}
              className="font-ui rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <span className="font-ui mt-1 px-1 text-[10px] text-zinc-400">
        {formatTime(message.created_at)}
      </span>
    </div>
  );
}

/* ---------- Connecting / Error states ---------- */

function ConnectingState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-zinc-200 border-t-orange-600" />
      <p className="font-ui text-sm text-zinc-500">Connecting to support…</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <AlertTriangle className="h-8 w-8 text-orange-600" strokeWidth={1.5} />
      <p className="font-ui text-sm text-zinc-500">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="font-ui mt-1 flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Try again
        </button>
      )}
    </div>
  );
}

function ChatHeader({ agentName, status, onBack }) {
  const initial = (agentName ?? "S").charAt(0).toUpperCase();
  return (
    <div
      className="fixed inset-x-0 top-0 z-20 mx-auto flex w-full max-w-sm items-center gap-3 border-b border-zinc-100 bg-white/95 px-4 py-3.5 backdrop-blur"
      style={{ paddingTop: "max(0.875rem, env(safe-area-inset-top))" }}
    >
      {/* <button
        onClick={onBack}
        className="rounded-full bg-zinc-100 p-2"
        aria-label="Go back"
      >
        <ChevronLeft className="h-4.5 w-4.5 text-zinc-700" />
      </button> */}
      <div className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display truncate text-sm font-semibold text-zinc-900">
          {agentName ?? "Support"}
        </p>
        <p className="font-ui text-[11px] text-zinc-400">
          Powered by Prime Japan
        </p>
      </div>
      <span
        className={`font-ui shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
          status === "open"
            ? "bg-emerald-50 text-emerald-600"
            : "bg-zinc-100 text-zinc-500"
        }`}
      >
        {status === "open" ? "● Online" : "Closed"}
      </span>
    </div>
  );
}

const HEADER_HEIGHT = 68;
const TAB_BAR_HEIGHT = 64;

function AttachmentStrip({ attachments, onRemove }) {
  if (attachments.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-2 pt-2 [scrollbar-width:none]">
      {attachments.map((a) => (
        <div key={a.id} className="relative shrink-0">
          {a.previewUrl ? (
            <img
              src={a.previewUrl}
              alt={a.file.name}
              className="h-14 w-14 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-lg bg-zinc-100 px-1 text-center">
              <FileText className="h-4 w-4 text-zinc-400" />
              <span className="font-ui truncate text-[8px] text-zinc-500">
                {a.file.name}
              </span>
            </div>
          )}
          <button
            onClick={() => onRemove(a.id)}
            className="absolute -right-1.5 -top-1.5 rounded-full bg-zinc-900 p-1"
            aria-label="Remove attachment"
          >
            <X className="h-2.5 w-2.5 text-white" />
          </button>
        </div>
      ))}
    </div>
  );
}

function ChatInput({ isClosed, onSend }) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleFileChange = (e) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    const valid = picked.filter((f) => f.size <= MAX_MB * 1024 * 1024);
    const next = [
      ...attachments,
      ...valid.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
      })),
    ].slice(0, MAX_FILES);
    setAttachments(next);
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = async () => {
    const body = input.trim();
    if ((!body && attachments.length === 0) || sending) return;
    setSending(true);
    try {
      await onSend(
        body,
        attachments.map((a) => a.file),
      );
      setInput("");
      setAttachments([]);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } finally {
      setSending(false);
    }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 100) + "px";
  };

  if (isClosed) {
    return (
      <div
        className="fixed inset-x-0 z-20 mx-auto w-full max-w-sm border-t border-zinc-100 bg-white px-4 py-4"
        style={{ bottom: TAB_BAR_HEIGHT }}
      >
        <p className="font-ui text-center text-xs text-zinc-400">
          This conversation is closed.
        </p>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-x-0 z-20 mx-auto w-full max-w-sm border-t border-zinc-100 bg-white"
      style={{ bottom: TAB_BAR_HEIGHT }}
    >
      <AttachmentStrip attachments={attachments} onRemove={removeAttachment} />
      <div className="flex items-end gap-2 px-4 py-3">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || attachments.length >= MAX_FILES}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100"
          aria-label="Attach file"
        >
          <Paperclip className="h-4 w-4 text-zinc-600" />
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleTextareaChange}
          placeholder="Type a message…"
          disabled={sending}
          className="font-ui max-h-24 flex-1 resize-none rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900"
        />
        <button
          onClick={handleSend}
          disabled={sending || (!input.trim() && attachments.length === 0)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#02ab86] disabled:opacity-40"
          aria-label="Send message"
        >
          {sending ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <Send className="h-4 w-4 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}

/* ---------- Root ---------- */

export default function ChatScreen({
  conversation = MOCK_CONVERSATION,
  messages = MOCK_MESSAGES,
  isConnecting = false,
  isConnected = true,
  connectionError = null,
  isClosed = false,
  hasMore = false,
  onSend = async () => {},
  onLoadMore = async () => {},
  onAction = () => {},
  onRetry = () => {},
  onBack = () => {},
}) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const prevLengthRef = useRef(messages.length);

  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLengthRef.current = messages.length;
  }, [messages]);

  const handleScroll = useCallback(async () => {
    const container = containerRef.current;
    if (!container || !hasMore || loadingMoreRef.current) return;
    if (container.scrollTop < 60) {
      loadingMoreRef.current = true;
      const prevHeight = container.scrollHeight;
      await onLoadMore();
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight - prevHeight;
        loadingMoreRef.current = false;
      });
    }
  }, [hasMore, onLoadMore]);

  return (
    <div className="flex h-screen overflow-hidden flex-col bg-zinc-50 font-sans">
      <StyleBlock />

      {isConnecting ? (
        <>
          <ChatHeader agentName={null} status="open" onBack={onBack} />
          <ConnectingState />
        </>
      ) : connectionError ? (
        <>
          <ChatHeader agentName={null} status="open" onBack={onBack} />
          <ErrorState message={connectionError} onRetry={onRetry} />
        </>
      ) : (
        <>
          <ChatHeader
            agentName={conversation?.admin?.name}
            status={conversation?.status ?? "open"}
            onBack={onBack}
          />

          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 space-y-4 overflow-y-auto px-4"
            style={{
              paddingTop: `calc(${HEADER_HEIGHT}px + env(safe-area-inset-top) + 1rem)`,
              paddingBottom: `calc(${TAB_BAR_HEIGHT}px + 7.5rem)`,
            }}
          >
            {hasMore && (
              <div className="font-ui flex items-center justify-center gap-2 text-xs text-zinc-400">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-400" />
                Loading older messages…
              </div>
            )}
            {messages.length === 0 ? (
              <p className="font-ui py-16 text-center text-sm text-zinc-400">
                No messages yet. Say hello! 👋
              </p>
            ) : (
              messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} onAction={onAction} />
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <ChatInput isClosed={isClosed} onSend={onSend} />
        </>
      )}
    </div>
  );
}
