import React, { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import {
  usePresence,
  isUserOnline,
  getOtherParticipantId,
  getOtherParticipantName,
} from "@/hooks/usePresence";
import Sidebar from "@/components/chat/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import NewChatDialog from "@/components/chat/NewChatDialog";
import CallModal from "@/components/chat/CallModal";
import ProfileSlideOver from "@/components/chat/ProfileSlideOver";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [mobileView, setMobileView] = useState("list");
  const [loading, setLoading] = useState(true);
  const [profileView, setProfileView] = useState(null);
  const [profileStats, setProfileStats] = useState(null);

  const selectedConvRef = useRef(null);
  const userRef = useRef(null);
  const profilesRef = useRef([]);

  selectedConvRef.current = selectedConv;
  userRef.current = user;
  profilesRef.current = profiles;

  usePresence(user, profile?.id, (now) => {
    setProfile((prev) => (prev ? { ...prev, last_active: now } : prev));
  });

  // --- Initial load ---
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const init = async () => {
      try {
        // 1. Fetch or create profile
        let { data: myProfile, error: profileErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (!myProfile) {
          const defaultName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "User";

          const { data: created, error: createErr } = await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              user_id: user.id,
              email: user.email,
              display_name: defaultName,
              last_active: new Date().toISOString(),
              is_online: true,
            })
            .select()
            .single();

          if (!createErr) myProfile = created;
        }

        if (cancelled) return;
        setProfile(myProfile);

        // 2. Fetch all profiles, conversations, notifications, calls in parallel
        const [
          { data: allProfiles },
          { data: allConvs },
          { data: allNotifs },
          { data: activeCalls },
        ] = await Promise.all([
          supabase.from("profiles").select("*").order("last_active", { ascending: false }),
          supabase.from("conversations").select("*").order("last_message_at", { ascending: false }),
          supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("calls")
            .select("*")
            .or(`initiator_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

        if (cancelled) return;

        setProfiles(allProfiles || []);

        // Filter conversations: Admins see all conversations, normal users see their own
        const isAdmin = myProfile?.role === "admin" || user.email === "zannatulfarzana363@gmail.com";
        const myConvs = (allConvs || []).filter((c) => {
          if (isAdmin) return true;
          const pIds = Array.isArray(c.participant_ids)
            ? c.participant_ids
            : typeof c.participant_ids === "string"
              ? JSON.parse(c.participant_ids)
              : [];
          return pIds.includes(user.id);
        });
        setConversations(myConvs);
        setNotifications(allNotifs || []);

        const active = (activeCalls || []).find(
          (c) =>
            (c.initiator_id === user.id || c.receiver_id === user.id) &&
            (c.status === "initiating" || c.status === "active"),
        );
        if (active) setActiveCall(active);
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // --- Browser Notifications Permission ---
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => { });
    }
  }, []);

  // --- Poll profiles for online status ---
  useEffect(() => {
    if (!user) return;
    const poll = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .order("last_active", { ascending: false });
        if (data) setProfiles(data);
      } catch (e) { }
    };
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // --- Realtime Subscriptions ---
  useEffect(() => {
    if (!user) return;

    const showBrowserNotification = (title, body) => {
      if (
        document.hidden &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(title, { body });
        } catch (e) { }
      }
    };

    const channel = supabase
      .channel("app-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          const currentUser = userRef.current;
          const currentConv = selectedConvRef.current;
          if (!currentUser) return;
          const msg = payload.new;
          if (!msg) return;

          if (currentConv && msg.conversation_id === currentConv.id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg].sort(
                (a, b) => new Date(a.created_at) - new Date(b.created_at),
              );
            });
            if (msg.sender_id !== currentUser.id && !msg.read) {
              supabase.from("messages").update({ read: true }).eq("id", msg.id).then();
            }
          }

          if (msg.sender_id !== currentUser.id) {
            if (!currentConv || msg.conversation_id !== currentConv.id) {
              const sender = profilesRef.current.find((p) => p.id === msg.sender_id);
              const senderName = msg.sender_name || sender?.display_name || "Someone";
              const preview = msg.file_url ? "📎 Attachment" : msg.content;
              showBrowserNotification(senderName, preview || "New message");
            }
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        (payload) => {
          const currentUser = userRef.current;
          if (!currentUser) return;
          const conv = payload.new;
          if (!conv) return;
          const pIds = Array.isArray(conv.participant_ids)
            ? conv.participant_ids
            : typeof conv.participant_ids === "string"
              ? JSON.parse(conv.participant_ids)
              : [];
          const isAdmin = profile?.role === "admin" || currentUser.email === "zannatulfarzana363@gmail.com";
          if (!isAdmin && !pIds.includes(currentUser.id)) return;

          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.id === conv.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = conv;
              return updated.sort(
                (a, b) =>
                  new Date(b.last_message_at || b.created_at) -
                  new Date(a.last_message_at || a.created_at),
              );
            }
            return [conv, ...prev];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload) => {
          const currentUser = userRef.current;
          if (!currentUser) return;
          const notif = payload.new;
          if (!notif || notif.user_id !== currentUser.id) return;

          setNotifications((prev) => {
            const idx = prev.findIndex((n) => n.id === notif.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = notif;
              return updated;
            }
            return [notif, ...prev].sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at),
            );
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calls" },
        (payload) => {
          const currentUser = userRef.current;
          if (!currentUser) return;
          const call = payload.new;
          if (!call) return;
          if (call.initiator_id !== currentUser.id && call.receiver_id !== currentUser.id)
            return;

          setActiveCall(call);
          if (call.status === "initiating" && call.receiver_id === currentUser.id) {
            showBrowserNotification(call.initiator_name || "Someone", "Incoming call");
          }
          if (call.status === "ended" || call.status === "declined") {
            setTimeout(() => {
              setActiveCall((prev) => (prev?.id === call.id ? null : prev));
            }, 2500);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // --- Select conversation ---
  const handleSelectConversation = useCallback(
    async (convId) => {
      const conv = conversations.find((c) => c.id === convId);
      if (!conv) return;
      setSelectedConv(conv);
      setMobileView("chat");
      setMessages([]);

      try {
        const { data: msgs } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", convId)
          .order("created_at", { ascending: true });

        setMessages(msgs || []);

        // Mark unread messages as read
        const unreadMsgs = (msgs || []).filter(
          (m) => m.sender_id !== user.id && !m.read,
        );
        if (unreadMsgs.length > 0) {
          await supabase
            .from("messages")
            .update({ read: true })
            .in(
              "id",
              unreadMsgs.map((m) => m.id),
            );
        }

        // Clear notifications
        const convNotifs = notifications.filter(
          (n) => n.conversation_id === convId && !n.read,
        );
        if (convNotifs.length > 0) {
          await supabase
            .from("notifications")
            .update({ read: true })
            .in(
              "id",
              convNotifs.map((n) => n.id),
            );
          setNotifications((prev) =>
            prev.map((n) =>
              n.conversation_id === convId ? { ...n, read: true } : n,
            ),
          );
        }
      } catch (err) {
        console.error("Error loading messages:", err);
      }
    },
    [conversations, notifications, user],
  );

  // --- Send message ---
  const handleSend = useCallback(
    async (data) => {
      if (!selectedConv || !user || !profile) return;
      const otherId = getOtherParticipantId(selectedConv, user.id);
      const myName = profile.display_name || user.email?.split("@")[0] || "User";

      try {
        const { data: newMsg, error } = await supabase
          .from("messages")
          .insert({
            conversation_id: selectedConv.id,
            sender_id: user.id,
            sender_name: myName,
            sender_avatar: profile.avatar_url,
            content: data.content || "",
            file_url: data.file_url || "",
            file_type: data.message_type || "text",
            read: false,
          })
          .select()
          .single();

        if (error) throw error;

        setMessages((prev) =>
          prev.some((m) => m.id === newMsg.id)
            ? prev
            : [...prev, newMsg].sort(
              (a, b) => new Date(a.created_at) - new Date(b.created_at),
            ),
        );

        const lastMsgPreview =
          data.content ||
          (data.message_type === "image" ? "📷 Photo" : "📎 File");

        await supabase
          .from("conversations")
          .update({
            last_message: lastMsgPreview,
            last_message_at: new Date().toISOString(),
          })
          .eq("id", selectedConv.id);

        if (otherId) {
          await supabase.from("notifications").insert({
            user_id: otherId,
            sender_id: user.id,
            sender_name: myName,
            sender_avatar: profile.avatar_url,
            type: "message",
            conversation_id: selectedConv.id,
            title: "New Message",
            message: lastMsgPreview,
            read: false,
          });
        }
      } catch (err) {
        console.error("Send error:", err);
      }
    },
    [selectedConv, user, profile],
  );

  // --- Start new chat ---
  const handleStartChat = useCallback(
    async (otherProfile) => {
      setNewChatOpen(false);
      if (!user) return;

      const otherUserId = otherProfile.id || otherProfile.user_id;

      const existing = conversations.find((c) => {
        const pIds = Array.isArray(c.participant_ids)
          ? c.participant_ids
          : typeof c.participant_ids === "string"
            ? JSON.parse(c.participant_ids)
            : [];
        return pIds.includes(user.id) && pIds.includes(otherUserId);
      });

      if (existing) {
        handleSelectConversation(existing.id);
        return;
      }

      try {
        const participantIds = [user.id, otherUserId];

        const { data: newConv, error } = await supabase
          .from("conversations")
          .insert({
            participant_ids: participantIds,
            is_group: false,
            last_message: "",
            last_message_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        setConversations((prev) => [newConv, ...prev]);
        setSelectedConv(newConv);
        setMobileView("chat");
        setMessages([]);
      } catch (err) {
        console.error("Start chat error:", err);
      }
    },
    [conversations, user, handleSelectConversation],
  );

  // --- Call handlers ---
  const handleStartCall = useCallback(
    async (callType) => {
      if (!selectedConv || !user || !profile) return;
      const otherId = getOtherParticipantId(selectedConv, user.id);
      const otherProf = profiles.find((p) => p.id === otherId || p.user_id === otherId);
      const myName = profile.display_name || user.email?.split("@")[0] || "User";

      try {
        const { data: call, error } = await supabase
          .from("calls")
          .insert({
            initiator_id: user.id,
            initiator_name: myName,
            initiator_avatar: profile.avatar_url,
            receiver_id: otherId,
            receiver_name: otherProf?.display_name || "User",
            receiver_avatar: otherProf?.avatar_url,
            type: callType,
            status: "initiating",
          })
          .select()
          .single();

        if (error) throw error;
        setActiveCall(call);
      } catch (err) {
        console.error("Call error:", err);
      }
    },
    [selectedConv, user, profile, profiles],
  );

  const handleAcceptCall = useCallback(async () => {
    if (!activeCall) return;
    try {
      await supabase.from("calls").update({ status: "active" }).eq("id", activeCall.id);
    } catch (err) {
      console.error(err);
    }
  }, [activeCall]);

  const handleDeclineCall = useCallback(async () => {
    if (!activeCall) return;
    try {
      await supabase.from("calls").update({ status: "declined" }).eq("id", activeCall.id);
    } catch (err) {
      console.error(err);
    }
  }, [activeCall]);

  const handleEndCall = useCallback(async () => {
    if (!activeCall) return;
    if (activeCall.status === "declined" || activeCall.status === "ended") {
      setActiveCall(null);
      return;
    }
    try {
      await supabase.from("calls").update({ status: "ended" }).eq("id", activeCall.id);
    } catch (err) {
      console.error(err);
    }
  }, [activeCall]);

  const handleClearNotifications = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .in(
          "id",
          unread.map((n) => n.id),
        );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  }, [notifications]);

  // --- Profile slide-over handlers ---
  const handleOpenOwnProfile = useCallback(async () => {
    if (!profile || !user) return;
    setProfileView({ profile, isOwn: true });
    try {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("sender_id", user.id);

      setProfileStats({
        conversations: conversations.length,
        messagesSent: count ?? 0,
      });
    } catch (e) {
      setProfileStats({ conversations: conversations.length, messagesSent: 0 });
    }
  }, [profile, user, conversations]);

  const handleOpenOtherProfile = useCallback((otherProf) => {
    if (!otherProf) return;
    setProfileView({ profile: otherProf, isOwn: false });
    setProfileStats(null);
  }, []);

  const handleCloseProfile = useCallback(() => setProfileView(null), []);

  const handleExpandProfile = useCallback(() => {
    if (!profileView?.profile?.id) return;
    const pid = profileView.profile.id;
    setProfileView(null);
    navigate(`/profile/${pid}`);
  }, [profileView, navigate]);

  const handleEditProfile = useCallback(() => {
    setProfileView(null);
    navigate("/profile/edit");
  }, [navigate]);

  const unreadByConv = {};
  notifications.forEach((n) => {
    if (!n.read && n.conversation_id)
      unreadByConv[n.conversation_id] =
        (unreadByConv[n.conversation_id] || 0) + 1;
  });

  const otherId = selectedConv
    ? getOtherParticipantId(selectedConv, user?.id)
    : null;
  const otherProfile = otherId
    ? profiles.find((p) => p.id === otherId || p.user_id === otherId)
    : null;

  const callOtherId = activeCall
    ? activeCall.initiator_id === user?.id
      ? activeCall.receiver_id
      : activeCall.initiator_id
    : null;
  const callOtherProfile = callOtherId
    ? profiles.find((p) => p.id === callOtherId || p.user_id === callOtherId)
    : null;
  const callOtherName =
    callOtherProfile?.display_name || activeCall?.initiator_name || "Unknown";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-blue-50/40 to-purple-50/40">
      <div
        className={cn(
          "w-full md:w-80 lg:w-96 shrink-0 border-r border-border",
          mobileView === "chat" && "hidden md:block",
        )}
      >
        <Sidebar
          currentUser={user}
          profile={profile}
          conversations={conversations}
          profiles={profiles}
          selectedConversationId={selectedConv?.id}
          unreadByConv={unreadByConv}
          notifications={notifications}
          onSelectConversation={handleSelectConversation}
          onNewChat={() => setNewChatOpen(true)}
          onClearNotifications={handleClearNotifications}
          onLogout={() => logout()}
          onOpenProfile={handleOpenOwnProfile}
        />
      </div>

      <div
        className={cn(
          "flex-1 min-w-0",
          mobileView === "list" && "hidden md:flex",
        )}
      >
        <ChatWindow
          conversation={selectedConv}
          messages={messages}
          currentUser={user}
          otherProfile={otherProfile}
          onSend={handleSend}
          onCall={handleStartCall}
          onBack={() => setMobileView("list")}
          onOpenProfile={() => handleOpenOtherProfile(otherProfile)}
        />
      </div>

      <NewChatDialog
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        profiles={profiles}
        currentUser={user}
        onStartChat={handleStartChat}
        existingConversations={conversations}
      />

      {activeCall && (
        <CallModal
          activeCall={activeCall}
          currentUser={user}
          otherName={callOtherName}
          otherAvatar={callOtherProfile?.avatar_url}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
          onEnd={handleEndCall}
        />
      )}

      <ProfileSlideOver
        open={!!profileView}
        profile={profileView?.profile}
        isOwn={profileView?.isOwn}
        email={user?.email}
        stats={profileStats}
        onClose={handleCloseProfile}
        onEdit={handleEditProfile}
        onExpand={handleExpandProfile}
      />
    </div>
  );
}
