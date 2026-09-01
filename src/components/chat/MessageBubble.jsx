import React from "react";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/chat/UserAvatar";
import {
  isUserOnline,
  getOtherParticipantName,
  formatMessageTime,
} from "@/hooks/usePresence";
import { Check, CheckCheck, Image as ImageIcon, FileText } from "lucide-react";

export default function MessageBubble({
  message,
  isMine,
  showAvatar,
  senderName,
  senderAvatar,
  senderOnline,
}) {
  const hasUrl = Boolean(message.file_url && message.file_url.trim().length > 0);
  const isImage = hasUrl && (message.file_type === "image" || (message.file_type && message.file_type.startsWith("image/")));
  const isFile = hasUrl && (message.file_type === "file" || (message.file_type && !message.file_type.startsWith("image/")));

  return (
    <div
      className={cn(
        "flex gap-2 px-4 py-1 animate-fade-in",
        isMine ? "flex-row-reverse" : "flex-row",
      )}
    >
      {!isMine && (
        <div className="w-8 shrink-0 self-end">
          {showAvatar && (
            <UserAvatar
              name={senderName}
              src={senderAvatar}
              size="sm"
              isOnline={senderOnline}
            />
          )}
        </div>
      )}
      <div
        className={cn(
          "flex flex-col max-w-[75%] sm:max-w-[65%]",
          isMine ? "items-end" : "items-start",
        )}
      >
        {showAvatar && !isMine && (
          <span className="text-xs font-medium text-muted-foreground mb-0.5 px-1">
            {senderName}
          </span>
        )}
        <div
          className={cn(
            "rounded-2xl px-3 py-2 shadow-sm break-words",
            isMine
              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md"
              : "bg-white text-foreground rounded-bl-md border border-border/60",
          )}
        >
          {isImage && (
            <img
              src={message.file_url}
              alt={message.file_name || "Image"}
              className="rounded-lg max-w-full max-h-72 mb-1"
            />
          )}
          {isFile && (
            <a
              href={message.file_url}
              download={message.file_name}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2.5 rounded-lg p-2 hover:opacity-80 transition-opacity",
                isMine ? "bg-white/20" : "bg-muted",
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-lg",
                  isMine ? "bg-white/20" : "bg-primary/10",
                )}
              >
                <FileText
                  className={cn(
                    "w-5 h-5",
                    isMine ? "text-white" : "text-primary",
                  )}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium truncate max-w-[180px]">
                  {message.file_name}
                </span>
                <span
                  className={cn(
                    "text-xs",
                    isMine ? "text-white/70" : "text-muted-foreground",
                  )}
                >
                  Tap to download
                </span>
              </div>
            </a>
          )}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex items-center gap-1 mt-0.5 px-1",
            isMine ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span className="text-[10px] text-muted-foreground">
            {formatMessageTime(message.created_at)}
          </span>
          {isMine &&
            (message.read ? (
              <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
            ) : (
              <Check className="w-3.5 h-3.5 text-muted-foreground" />
            ))}
        </div>
      </div>
    </div>
  );
}
