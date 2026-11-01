import React from "react";

export const OWNER_EMAILS = ["epocendie@gmail.com"];

export const ROLES = [
  { id: "owner", label: "Owner", icon: "👑", className: "bg-yellow-400/15 text-yellow-400 border-yellow-400/40", desc: "Full control: manage all content, users, badges, shop, and site settings" },
  { id: "admin", label: "Admin", icon: "🛡️", className: "bg-red-400/15 text-red-400 border-red-400/40", desc: "Manage games, videos, news posts, and ban users" },
  { id: "moderator", label: "Moderator", icon: "🔨", className: "bg-blue-400/15 text-blue-400 border-blue-400/40", desc: "Moderate comments, ban users, and access detective tools" },
  { id: "editor", label: "Editor", icon: "✏️", className: "bg-green-400/15 text-green-400 border-green-400/40", desc: "Add and edit games, videos, and news posts" },
  { id: "vip", label: "VIP", icon: "⭐", className: "bg-purple-400/15 text-purple-400 border-purple-400/40", desc: "Premium member with an exclusive badge — no special powers" },
  { id: "member", label: "Member", icon: "🎮", className: "bg-secondary text-muted-foreground border-border", desc: "Standard member with access to all content" },
];

export function getBadge(badge, email) {
  if (email && OWNER_EMAILS.includes(email)) return "owner";
  return badge || "member";
}

export default function RoleBadge({ badge, email, size = "sm" }) {
  const effectiveBadge = getBadge(badge, email);
  const role = ROLES.find((r) => r.id === effectiveBadge);
  if (!role || role.id === "member") return null;
  const sizeClass = size === "xs" ? "text-[9px] px-1.5 py-0.5 gap-0.5" : "text-xs px-2 py-0.5 gap-1";
  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${role.className} ${sizeClass}`}>
      <span>{role.icon}</span>
      {role.label}
    </span>
  );
}