import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function usePresence(user, profileId, onActiveUpdate) {
  useEffect(() => {
    if (!user || !profileId) return;

    const updateActive = async () => {
      try {
        const now = new Date().toISOString();
        await supabase
          .from("profiles")
          .update({ last_active: now, is_online: true })
          .eq("id", profileId);
        if (onActiveUpdate) onActiveUpdate(now);
      } catch (e) {
        // ignore presence errors
      }
    };

    updateActive();
    const interval = setInterval(updateActive, 15000);

    const handleVisibility = () => {
      if (!document.hidden) updateActive();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [user?.id, profileId]);
}

export const isUserOnline = (lastActive) => {
  if (!lastActive) return false;
  return Date.now() - new Date(lastActive).getTime() < 60000;
};

export const getOtherParticipantId = (conversation, currentUserId) => {
  if (!conversation?.participant_ids) return null;
  const pIds = Array.isArray(conversation.participant_ids)
    ? conversation.participant_ids
    : typeof conversation.participant_ids === "string"
    ? JSON.parse(conversation.participant_ids)
    : [];
  return pIds.find((id) => id !== currentUserId);
};

export const getOtherParticipantName = (conversation, currentUserId, profiles = []) => {
  const otherId = getOtherParticipantId(conversation, currentUserId);
  if (!otherId) return conversation?.group_name || "Unknown";
  const profile = profiles.find((p) => p.id === otherId || p.user_id === otherId);
  return profile?.display_name || profile?.email || "Unknown";
};

export const formatMessageTime = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (isToday) return time;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString())
    return `Yesterday ${time}`;
  return (
    date.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + time
  );
};

export const formatCallDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export const formatLastActive = (lastActive) => {
  if (!lastActive) return "Offline";
  if (isUserOnline(lastActive)) return "Active now";
  const date = new Date(lastActive);
  const now = new Date();
  const diffMin = Math.floor((now - date) / 60000);
  if (diffMin < 1) return "Active now";
  if (diffMin < 60) return `Last active ${diffMin}m ago`;
  const isToday = date.toDateString() === now.toDateString();
  if (isToday)
    return `Last active at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString())
    return `Last active yesterday`;
  return `Last active ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
};
