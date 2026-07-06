"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, Package, User } from "lucide-react";

const TABS = [
  { key: "home", label: "Home", href: "/home", icon: Home },
  { key: "search", label: "Search", href: "/search", icon: Search },
  { key: "watchlist", label: "Watchlist", href: "/watchlist", icon: Heart },
  { key: "orders", label: "Orders", href: "/orders", icon: Package },
  { key: "account", label: "Account", href: "/account", icon: User },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-sm items-stretch border-t border-zinc-200 bg-white/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map(({ key, label, href, icon: Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={key}
            href={href}
            replace
            className="flex flex-1 flex-col items-center gap-1 py-2.5"
          >
            <span className="relative">
              <Icon
                className={`h-5 w-5 ${isActive ? "text-orange-600" : "text-zinc-400"}`}
                strokeWidth={isActive ? 2.25 : 2}
              />
              {isActive && (
                <span className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-orange-600" />
              )}
            </span>
            <span
              className={`text-[10px] ${
                isActive
                  ? "font-semibold text-orange-600"
                  : "font-medium text-zinc-400"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
