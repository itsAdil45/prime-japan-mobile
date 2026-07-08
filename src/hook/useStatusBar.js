"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

export function useStatusBar() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return; // skip on web/dev

    StatusBar.setBackgroundColor({ color: "#09090b" });
    StatusBar.setStyle({ style: Style.Dark });
  }, []);
}
