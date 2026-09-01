import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Bell, X, MessageCircle, Phone } from "lucide-react";
import { formatMessageTime } from "@/hooks/usePresence";

export default function NotificationBell({
  notifications,
  onOpenConversation,
  onClearAll,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unread = notifications.filter((n) => !n.read);

  const handleNotificationClick = (notif) => {
    onOpenConversation(notif.conversation_id);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-card rounded-2xl shadow-xl border border-border overflow-hidden z-40 animate-fade-in">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <div className="flex items-center gap-1">
              {unread.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-full hover:bg-muted"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto scrollbar-thin max-h-80">
            {notifications.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-10 px-4">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 30).map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left border-b border-border/40",
                    !notif.read && "bg-primary/5",
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-full shrink-0",
                      notif.type === "call"
                        ? "bg-green-100 text-green-600"
                        : "bg-blue-100 text-blue-600",
                    )}
                  >
                    {notif.type === "call" ? (
                      <Phone className="w-4 h-4" />
                    ) : (
                      <MessageCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">
                        {notif.sender_name || "Someone"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {notif.type === "call"
                          ? "is calling you"
                          : `sent: ${notif.content?.slice(0, 50) || "a message"}`}
                      </span>
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {formatMessageTime(notif.created_date)}
                    </span>
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
