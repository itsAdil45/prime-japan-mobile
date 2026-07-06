// components/BackToHomeGuard.jsx
"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const HOME_PATH = "/home";

export default function BackToHomeGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    window.history.pushState({ tabTrap: true }, "", window.location.href);

    function handlePopState() {
      if (pathnameRef.current !== HOME_PATH) {
        router.replace(HOME_PATH);
        window.history.pushState({ tabTrap: true }, "", HOME_PATH);
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  return null;
}
