import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, X, Loader2 } from "lucide-react";
import UserAvatar from "@/components/chat/UserAvatar";
import { isUserOnline } from "@/hooks/usePresence";

export default function NewChatDialog({
  open,
  onClose,
  profiles,
  currentUser,
  onStartChat,
  existingConversations,
}) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => dialogRef.current?.focus(), 100);
    }
  }, [open]);

  if (!open) return null;

  const filtered = profiles.filter((p) => {
    if (p.id === currentUser?.id || p.user_id === currentUser?.id) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const nameMatch = (p.display_name || "").toLowerCase().includes(q);
    const emailMatch = (p.email || "").toLowerCase().includes(q);
    return nameMatch || emailMatch;
  });

  const hasConversation = (profile) => {
    return existingConversations.some(
      (c) =>
        c.participants?.includes(profile.user_id) &&
        c.participants?.includes(currentUser.id),
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[70vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">New Chat</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              ref={dialogRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              {profiles.length <= 1
                ? "No other users yet. Invite friends to start chatting!"
                : "No users found"}
            </div>
          ) : (
            filtered.map((profile) => {
              const alreadyChatting = hasConversation(profile);
              return (
                <button
                  key={profile.id}
                  onClick={() => onStartChat(profile)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left",
                    alreadyChatting && "opacity-60",
                  )}
                >
                  <UserAvatar
                    name={profile.display_name || profile.email}
                    src={profile.avatar_url}
                    size="md"
                    isOnline={isUserOnline(profile.last_active)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {profile.display_name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isUserOnline(profile.last_active)
                        ? "Active now"
                        : "Offline"}
                    </p>
                  </div>
                  {alreadyChatting && (
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full shrink-0">
                      Existing
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
