"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Circle,
  Sparkles,
  Coins,
  Video,
  ExternalLink,
} from "lucide-react";

export default function AmraNavigation() {
  const pathname = usePathname();

  const isRouteActive = (route: string) => {
    if (route === "/sacred-geometry") {
      return pathname === "/sacred-geometry" || pathname === "/geometry";
    }
    if (route === "/sacred-objects") {
      return pathname === "/sacred-objects" || pathname === "/objects";
    }
    if (route === "/treasury") {
      return pathname === "/treasury";
    }
    return pathname === route;
  };

  const navItems = [
    {
      href: "/sacred-geometry",
      label: "Sacred Backgrounds",
      subLabel: "Toroidal Harmonics & Multivariate Color",
      icon: Circle,
      color: "text-cyan-400",
      activeBorder: "border-cyan-500/50",
      activeBg: "bg-cyan-950/40 text-cyan-300",
      glow: "shadow-[0_0_15px_rgba(6,182,212,0.15)]",
    },
    {
      href: "/sacred-objects",
      label: "Sacred Objects",
      subLabel: "Āmra Rūpa Mango & Living Expressions",
      icon: Sparkles,
      color: "text-amber-400",
      activeBorder: "border-amber-500/50",
      activeBg: "bg-amber-950/40 text-amber-300",
      glow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
    },
    {
      href: "/treasury",
      label: "Financial Treasury",
      subLabel: "ACID Ledger, SaaS MRR & Partner Revenue",
      icon: Coins,
      color: "text-emerald-400",
      activeBorder: "border-emerald-500/50",
      activeBg: "bg-emerald-950/40 text-emerald-300",
      glow: "shadow-[0_0_15px_rgba(16,185,129,0.15)]",
    },
  ];

  return (
    <nav className="bg-[#0b111e]/90 border-b border-slate-800/80 sticky top-16 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 py-2">
          {/* Main 3 Navigation Workstations */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto scrollbar-none py-1">
            {navItems.map((item) => {
              const active = isRouteActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-mono transition-all flex items-center space-x-2.5 border whitespace-nowrap ${
                    active
                      ? `${item.activeBg} ${item.activeBorder} ${item.glow} font-semibold`
                      : "border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700 bg-slate-900/40"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.color} ${active ? "animate-pulse" : ""}`} />
                  <div className="text-left">
                    <div className="leading-tight">{item.label}</div>
                    <div className="text-[10px] opacity-60 font-sans hidden md:block">
                      {item.subLabel}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Foundations Studio Bridge */}
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <Link
              href="/foundations/"
              className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-300 text-xs font-mono flex items-center space-x-1.5 transition"
              title="Open Foundations YouTube Studio"
            >
              <Video className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden lg:inline">Foundations Studio</span>
              <ExternalLink className="w-3 h-3 text-red-400/80" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
