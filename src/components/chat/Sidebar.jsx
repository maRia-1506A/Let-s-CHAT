import React from "react";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/chat/UserAvatar";
import NotificationBell from "@/components/chat/NotificationBell";
import { isUserOnline, getOtherParticipantName } from "@/hooks/usePresence";
import {
  Search,
  MessageSquarePlus,
  LogOut,
  Image as ImageIcon,
  FileText,
} from "lucide-react";

export default function Sidebar({
  currentUser,
  profile,
  conversations,
  profiles,
  selectedConversationId,
  unreadByConv,
  notifications,
  onSelectConversation,
  onNewChat,
  onClearNotifications,
  onLogout,
  onOpenProfile,
}) {
  const [search, setSearch] = React.useState("");

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const otherName = getOtherParticipantName(c, currentUser.id);
    return (
      otherName.toLowerCase().includes(search.toLowerCase()) ||
      (c.last_message || "").toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-gradient-to-r from-blue-50 to-purple-50">
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 group rounded-xl p-1 -m-1 hover:bg-white/60 transition-colors text-left"
        >
          <UserAvatar
            name={
              profile?.full_name || currentUser?.full_name || currentUser?.email
            }
            src={profile?.avatar_url}
            size="md"
            isOnline={true}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate max-w-[120px] group-hover:text-primary transition-colors">
              {profile?.full_name || currentUser?.full_name || "You"}
            </p>
            <p className="text-xs text-green-600 font-medium">Active now</p>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <NotificationBell
            notifications={notifications}
            onOpenConversation={onSelectConversation}
            onClearAll={onClearNotifications}
          />
          <button
            onClick={onLogout}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Search & New Chat */}
      <div className="p-3 space-y-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
        >
          <MessageSquarePlus className="w-4 h-4" />
          New Chat
        </button>
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-0"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin pb-2">
        {filtered.length === 0 ? (
          <div className="text-center px-6 py-12">
            <MessageSquarePlus className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {conversations.length === 0
                ? "No conversations yet. Start a new chat!"
                : "No results found"}
            </p>
          </div>
        ) : (
          filtered.map((conv) => {
            const otherName = getOtherParticipantName(conv, currentUser.id, profiles);
            const pIds = Array.isArray(conv.participant_ids)
              ? conv.participant_ids
              : typeof conv.participant_ids === "string"
              ? JSON.parse(conv.participant_ids)
              : [];
            const otherId = pIds.find((id) => id !== currentUser.id);
            const otherProfile = profiles.find(
              (p) => p.id === otherId || p.user_id === otherId,
            );
            const isSelected = conv.id === selectedConversationId;
            const unread = unreadByConv[conv.id] || 0;
            const lastIsMine = conv.last_sender_id === currentUser.id;
            const isImg = conv.last_message_type === "image";
            const isFile = conv.last_message_type === "file";

            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left border-l-4",
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "border-transparent hover:bg-muted/60",
                )}
              >
                <UserAvatar
                  name={otherName}
                  src={otherProfile?.avatar_url}
                  size="md"
                  isOnline={isUserOnline(otherProfile?.last_active)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{otherName}</p>
                    {conv.last_message_at && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(conv.last_message_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      {lastIsMine && (
                        <span className="text-muted-foreground/70">You:</span>
                      )}
                      {isImg && (
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          Photo
                        </span>
                      )}
                      {isFile && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          File
                        </span>
                      )}
                      {!isImg &&
                        !isFile &&
                        (conv.last_message || "Start chatting")}
                    </p>
                    {unread > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
