import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/chat/UserAvatar";
import MessageBubble from "@/components/chat/MessageBubble";
import MessageInput from "@/components/chat/MessageInput";
import { useVisualViewport } from "@/hooks/useVisualViewport";
import {
  isUserOnline,
  getOtherParticipantName,
  formatLastActive,
} from "@/hooks/usePresence";
import { Phone, Video, ArrowLeft, MessageSquare } from "lucide-react";

export default function ChatWindow({
  conversation,
  messages,
  currentUser,
  otherProfile,
  onSend,
  onCall,
  onBack,
  onOpenProfile,
}) {
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const { viewportHeight, isKeyboardOpen } = useVisualViewport();

  const scrollToBottom = (behavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior,
        block: "end",
      });
    }
  };

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages]);

  useEffect(() => {
    if (viewportHeight) {
      scrollToBottom("auto");
    }
  }, [viewportHeight]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50/50 to-purple-50/50 text-center px-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-4 shadow-sm">
          <MessageSquare className="w-12 h-12 text-primary/40" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Your Messages
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Select a conversation or start a new chat to begin messaging with your
          friends.
        </p>
      </div>
    );
  }

  const otherName =
    otherProfile?.display_name ||
    otherProfile?.email ||
    getOtherParticipantName(conversation, currentUser.id);
  const online = isUserOnline(otherProfile?.last_active);

  let lastDate = "";

  return (
    <div
      className="flex-1 flex flex-col h-full h-[100dvh] max-h-[100dvh] overflow-hidden min-h-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"
      style={
        viewportHeight && typeof window !== "undefined" && window.innerWidth < 768
          ? { height: `${viewportHeight}px` }
          : undefined
      }
    >
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-3 sm:px-4 py-2.5 border-b border-border bg-card/80 backdrop-blur-md">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 rounded-full hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-3 flex-1 min-w-0 text-left group rounded-xl hover:bg-muted/40 transition-colors p-1 -m-1"
        >
          <UserAvatar
            name={otherName}
            src={otherProfile?.avatar_url}
            size="md"
            isOnline={online}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
              {otherName}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {online
                ? "Active now"
                : formatLastActive(otherProfile?.last_active)}
            </p>
          </div>
        </button>
        <button
          onClick={() => onCall("voice")}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          title="Voice call"
        >
          <Phone className="w-5 h-5" />
        </button>
        <button
          onClick={() => onCall("video")}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          title="Video call"
        >
          <Video className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto scrollbar-thin py-2"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hi to {otherName}! 👋
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.sender_id === currentUser.id;
            const prevMsg = messages[i - 1];
            const showAvatar = !isMine && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
            const msgDate = msg.created_at ? new Date(msg.created_at).toDateString() : "";
            const showDateSeparator = msgDate && msgDate !== lastDate;
            if (msgDate) lastDate = msgDate;

            return (
              <React.Fragment key={msg.id}>
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-3">
                    <span className="text-[10px] font-medium text-muted-foreground bg-card px-3 py-1 rounded-full shadow-sm">
                      {new Date(msg.created_at).toLocaleDateString([], {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  isMine={isMine}
                  showAvatar={showAvatar}
                  senderName={msg.sender_name || otherName}
                  senderAvatar={otherProfile?.avatar_url}
                  senderOnline={online}
                />
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0">
        <MessageInput onSend={onSend} onFocusInput={() => scrollToBottom("auto")} />
      </div>
    </div>
  );
}
