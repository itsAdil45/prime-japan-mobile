"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { App } from "@capacitor/app";

const HOME_PATH = "/home";

export default function BackToHomeGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const listenerPromise = App.addListener("backButton", () => {
      if (pathnameRef.current !== HOME_PATH) {
        router.replace(HOME_PATH);
      } else {
        // Already on Home — hardware back should actually exit here
        App.exitApp();
      }
    });

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, [router]);

  return null;
}
