import React from "react";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-gradient-to-br from-blue-500 to-blue-600",
  "bg-gradient-to-br from-purple-500 to-purple-600",
  "bg-gradient-to-br from-pink-500 to-pink-600",
  "bg-gradient-to-br from-green-500 to-green-600",
  "bg-gradient-to-br from-orange-500 to-orange-600",
  "bg-gradient-to-br from-indigo-500 to-indigo-600",
  "bg-gradient-to-br from-teal-500 to-teal-600",
  "bg-gradient-to-br from-rose-500 to-rose-600",
];

export const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const SIZE_CLASSES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-24 h-24 text-3xl",
};

const DOT_SIZES = {
  sm: "w-2 h-2 border",
  md: "w-3 h-3 border-2",
  lg: "w-3.5 h-3.5 border-2",
  xl: "w-5 h-5 border-[3px]",
};

export default function UserAvatar({
  name,
  src,
  size = "md",
  isOnline,
  className,
}) {
  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      {src ? (
        <img
          src={src}
          alt={name || "User"}
          className={cn(
            "rounded-full object-cover ring-1 ring-black/5",
            SIZE_CLASSES[size],
          )}
        />
      ) : (
        <div
          className={cn(
            "rounded-full flex items-center justify-center text-white font-semibold shadow-sm",
            SIZE_CLASSES[size],
            getAvatarColor(name),
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {isOnline !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-white bg-white flex items-center justify-center",
            DOT_SIZES[size],
          )}
        >
          <span
            className={cn(
              "w-full h-full rounded-full",
              isOnline ? "bg-green-500" : "bg-gray-400",
            )}
          />
        </span>
      )}
    </div>
  );
}
