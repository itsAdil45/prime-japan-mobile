// components/OfflineProvider.jsx
"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

const OfflineContext = createContext(false);
export const useOffline = () => useContext(OfflineContext);

const PING_TIMEOUT = 4000;

export default function OfflineProvider({ children }) {
  const [isOffline, setIsOffline] = useState(false);
  const networkRef = useRef(null);

  const checkViaFetch = useCallback(async () => {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), PING_TIMEOUT);
      await fetch(`/api/ping?t=${Date.now()}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(t);
      setIsOffline(false);
      return true;
    } catch {
      setIsOffline(true);
      return false;
    }
  }, []);

  const checkConnectivity = useCallback(async () => {
    const Network = networkRef.current;
    if (!Network) return checkViaFetch();
    try {
      const status = await Network.getStatus();
      // "connected" on the OS level doesn't guarantee real internet
      // (e.g. wifi with no route out), so confirm with an actual fetch.
      if (!status.connected) {
        setIsOffline(true);
        return false;
      }
      return checkViaFetch();
    } catch {
      return checkViaFetch();
    }
  }, [checkViaFetch]);

  useEffect(() => {
    let removeListener = null;

    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.isNativePlatform()) {
          const { Network } = await import("@capacitor/network");
          networkRef.current = Network;
          const listener = await Network.addListener(
            "networkStatusChange",
            (status) => {
              status.connected ? checkConnectivity() : setIsOffline(true);
            },
          );
          removeListener = () => listener.remove();
        }
      } catch {
        // running in a plain browser, no Capacitor bridge — fetch fallback covers it
      }
      checkConnectivity();
    })();

    const onOnline = () => checkConnectivity();
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const interval = setInterval(checkConnectivity, 15000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(interval);
      removeListener?.();
    };
  }, [checkConnectivity]);

  return (
    <OfflineContext.Provider value={isOffline}>
      {children}
      {isOffline && <OfflineOverlay onRetry={checkConnectivity} />}
    </OfflineContext.Provider>
  );
}

function OfflineOverlay({ onRetry }) {
  const [retrying, setRetrying] = useState(false);
  const handleRetry = async () => {
    setRetrying(true);
    const ok = await onRetry();
    setRetrying(false);
    if (ok) window.location.reload();
  };
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <div className="text-lg font-semibold text-zinc-800">
        No Internet Connection
      </div>
      <p className="text-sm text-zinc-500">
        Please check your connection and try again.
      </p>
      <button
        onClick={handleRetry}
        disabled={retrying}
        className="rounded-full bg-[#02ab86] px-6 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {retrying ? "Checking…" : "Retry"}
      </button>
    </div>
  );
}
