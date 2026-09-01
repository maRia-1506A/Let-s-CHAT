import React from "react";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/chat/UserAvatar";
import { isUserOnline, formatLastActive } from "@/hooks/usePresence";
import { X, Pencil, Maximize2, Mail, Calendar } from "lucide-react";

export default function ProfileSlideOver({
  open,
  onClose,
  profile,
  isOwn,
  email,
  stats,
  onEdit,
  onExpand,
}) {
  if (!open || !profile) return null;

  const online = isOwn ? true : isUserOnline(profile.last_active);

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-card h-full shadow-2xl animate-slide-in-left flex flex-col">
        {/* Gradient header band */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 px-6 pt-5 pb-16 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar overlapping the band */}
        <div className="px-6 -mt-12">
          <div className="flex justify-center">
            <div className="rounded-full p-1 bg-card">
              <UserAvatar
                name={profile.display_name || profile.email || "User"}
                src={profile.avatar_url}
                size="xl"
                isOnline={online}
              />
            </div>
          </div>
        </div>

        {/* Name & status */}
        <div className="px-6 mt-3 text-center">
          <h2 className="text-xl font-bold truncate">{profile.display_name || profile.email || "User"}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {online ? "Active now" : formatLastActive(profile.last_active)}
          </p>
        </div>

        {/* Action buttons */}
        <div className="px-6 mt-4 flex gap-2">
          {isOwn ? (
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
            >
              <Pencil className="w-4 h-4" /> Edit profile
            </button>
          ) : null}
          <button
            onClick={onExpand}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition-colors",
              isOwn ? "" : "flex-1",
            )}
          >
            <Maximize2 className="w-4 h-4" /> Expand
          </button>
        </div>

        {/* Details */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 mt-6 space-y-4 pb-6">
          {isOwn && email && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium truncate">{email}</p>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              Bio
            </p>
            {profile.bio ? (
              <p className="text-sm leading-relaxed">{profile.bio}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {isOwn
                  ? "No bio yet. Add one to tell people about yourself."
                  : "No bio available."}
              </p>
            )}
          </div>

          {isOwn && stats && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 text-center">
                <p className="text-2xl font-bold text-primary">
                  {stats.conversations ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Conversations
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 text-center">
                <p className="text-2xl font-bold text-primary">
                  {stats.messagesSent ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Messages sent
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Member since</p>
              <p className="text-sm font-medium">
                {(() => {
                  const dateStr = profile.created_at || profile.created_date;
                  if (!dateStr) return "Recently";
                  const parsed = new Date(dateStr);
                  if (isNaN(parsed.getTime())) return "Recently";
                  return parsed.toLocaleDateString([], {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  });
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
