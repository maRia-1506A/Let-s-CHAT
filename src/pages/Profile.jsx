import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import UserAvatar from "@/components/chat/UserAvatar";
import { isUserOnline, formatLastActive } from "@/hooks/usePresence";
import { ArrowLeft, Pencil, Mail, Calendar } from "lucide-react";

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .or(`id.eq.${userId},user_id.eq.${userId}`)
          .maybeSingle();

        if (error) console.error("Profile load error:", error);
        if (!cancelled) setProfile(data || null);
      } catch (e) {
        console.error("Profile load catch:", e);
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const isOwn = user?.id === userId;

  // Robust date formatter — won't show "Invalid Date"
  const formatMemberSince = (dateStr) => {
    const candidates = [
      dateStr,
      profile?.created_at,
      isOwn ? user?.created_at : null,
    ];
    for (const d of candidates) {
      if (!d) continue;
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString([], {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      }
    }
    return "N/A";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50/40 to-purple-50/40">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50/40 to-purple-50/40">
        <p className="text-muted-foreground">Profile not found</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-primary text-sm font-medium hover:underline"
        >
          Back to chats
        </button>
      </div>
    );
  }

  const online = isOwn ? true : isUserOnline(profile.last_active);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 to-purple-50/40">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-card rounded-3xl shadow-sm overflow-hidden">
          {/* gradient header band */}
          <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600" />

          {/* avatar overlapping */}
          <div className="px-6 -mt-16">
            <div className="rounded-full p-1.5 bg-card inline-block">
              <UserAvatar
                name={profile.display_name || profile.email}
                src={profile.avatar_url}
                size="xl"
                isOnline={online}
              />
            </div>
          </div>

          <div className="px-6 mt-3">
            <h1 className="text-2xl font-bold">{profile.display_name || profile.email}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {online ? "Active now" : formatLastActive(profile.last_active)}
            </p>
          </div>

          {isOwn && (
            <div className="px-6 mt-4">
              <button
                onClick={() => navigate("/profile/edit")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
              >
                <Pencil className="w-4 h-4" /> Edit profile
              </button>
            </div>
          )}

          <div className="px-6 py-6 space-y-4">
            {isOwn && user?.email && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium truncate">{user.email}</p>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Bio
              </p>
              <p className="text-sm leading-relaxed">
                {profile.bio ||
                  (isOwn
                    ? "No bio yet. Click edit to add one."
                    : "No bio available.")}
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Member since</p>
                <p className="text-sm font-medium">
                  {formatMemberSince(profile.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
