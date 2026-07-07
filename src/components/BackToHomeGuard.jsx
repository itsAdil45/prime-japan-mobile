"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { App } from "@capacitor/app";

const HOME_PATH = "/home";
const TAB_ROOTS = ["/home", "/search", "/watchlist", "/orders", "/account"];

export default function BackToHomeGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const listenerPromise = App.addListener("backButton", () => {
      const current = pathnameRef.current;
      const isTabRoot = TAB_ROOTS.includes(current);

      if (!isTabRoot) {
        // Nested/detail screen — pop one level within the current tab's stack
        router.back();
        return;
      }

      if (current === HOME_PATH) {
        App.exitApp(); // already at Home — nothing left to go back to
      } else {
        router.replace(HOME_PATH); // on another tab's root — jump to Home
      }
    });

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, [router]);

  return null;
}
