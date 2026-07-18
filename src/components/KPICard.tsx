"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  change?: number; // percentual
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "orange" | "purple" | "pink";
  sparkline?: number[]; // dados para sparkline simples
}

const colorClasses = {
  blue: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
  green: "from-green-500/10 to-green-500/5 border-green-500/20",
  orange: "from-orange-500/10 to-orange-500/5 border-orange-500/20",
  purple: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
  pink: "from-pink-500/10 to-pink-500/5 border-pink-500/20",
};

const textColors = {
  blue: "text-blue-400",
  green: "text-green-400",
  orange: "text-orange-400",
  purple: "text-purple-400",
  pink: "text-pink-400",
};

const badgeColors = {
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  green: "bg-green-500/10 text-green-400 border-green-500/20",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  pink: "bg-pink-500/10 text-pink-400 border-pink-500/20",
};

export function KPICard({
  label,
  value,
  change,
  changeLabel,
  icon,
  color = "blue",
  sparkline,
}: KPICardProps) {
  const isPositive = change && change >= 0;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-6 backdrop-blur-sm ${colorClasses[color]}`}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 opacity-50" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header: Label + Icon */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          {icon && <div className="text-2xl opacity-60">{icon}</div>}
        </div>

        {/* Main Value */}
        <div className="mb-4">
          <p className="text-3xl font-bold text-slate-100">{value}</p>
        </div>

        {/* Change Badge + Sparkline */}
        <div className="flex items-center justify-between">
          {change !== undefined && (
            <div
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${badgeColors[color]}`}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>
                {isPositive ? "+" : ""}
                {change}%
              </span>
            </div>
          )}

          {changeLabel && (
            <p className="text-xs text-slate-500">{changeLabel}</p>
          )}

          {sparkline && (
            <div className="flex h-6 items-center gap-0.5">
              {sparkline.slice(-8).map((val, i) => {
                const max = Math.max(...sparkline);
                const height = (val / max) * 100;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm ${textColors[color]} opacity-60`}
                    style={{
                      height: `${height}%`,
                      backgroundColor: "currentColor",
                      minHeight: "2px",
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
