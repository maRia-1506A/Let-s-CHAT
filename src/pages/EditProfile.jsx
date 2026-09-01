import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import UserAvatar from "@/components/chat/UserAvatar";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";

export default function EditProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Profile load error:", error);
        }

        if (!cancelled && data) {
          setProfile(data);
          setFullName(data.display_name || "");
          setBio(data.bio || "");
          setAvatarUrl(data.avatar_url || "");
        }
      } catch (e) {
        console.error("Profile load catch:", e);
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrlData.publicUrl);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!user || !fullName.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      const updates = {
        id: user.id,
        user_id: user.id,
        display_name: fullName.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
      };

      const { error } = await supabase
        .from("profiles")
        .update({ display_name: fullName.trim(), bio: bio.trim(), avatar_url: avatarUrl })
        .eq("id", user.id);

      if (error) throw error;

      navigate(`/profile/${user.id}`, { replace: true });
    } catch (err) {
      console.error("Save error:", err);
      setSaveError(err.message || "Failed to save. Please try again.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50/40 to-purple-50/40">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 to-purple-50/40">
      <div className="max-w-xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-card rounded-3xl shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-6">Edit profile</h1>

          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <UserAvatar name={fullName || "User"} src={avatarUrl} size="xl" />
              <label className="absolute bottom-0 right-0 w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center cursor-pointer shadow-md border-2 border-card hover:scale-105 transition-transform">
                {uploading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Click the camera to change your photo
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Display name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Tell people about yourself..."
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none transition-shadow"
              />
            </div>
          </div>

          {saveError && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              ⚠️ {saveError}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !fullName.trim()}
              className="flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
