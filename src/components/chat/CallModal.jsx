import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  X,
} from "lucide-react";
import UserAvatar from "@/components/chat/UserAvatar";
import { formatCallDuration } from "@/hooks/usePresence";

export default function CallModal({
  activeCall,
  currentUser,
  otherName,
  otherAvatar,
  onAccept,
  onDecline,
  onEnd,
}) {
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const isCaller =
    (activeCall?.caller_id || activeCall?.initiator_id) === currentUser?.id;
  const rawStatus = activeCall?.status;
  const status =
    rawStatus === "initiating"
      ? "ringing"
      : rawStatus === "active"
      ? "accepted"
      : rawStatus;

  useEffect(() => {
    if (status === "accepted") {
      const startTime = (activeCall?.started_at || activeCall?.created_at)
        ? new Date(activeCall.started_at || activeCall.created_at).getTime()
        : Date.now();
      const tick = () =>
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      tick();
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }
  }, [status, activeCall?.started_at, activeCall?.created_at]);

  if (!activeCall) return null;

  const isVideo = (activeCall.call_type || activeCall.type) === "video";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 animate-fade-in">
      {/* Top right close button */}
      <button
        onClick={onEnd}
        className="absolute top-6 right-6 z-20 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        title="Close Call"
      >
        <X className="w-6 h-6" />
      </button>
      {/* Glow background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse-ring" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse-ring"
          style={{ animationDelay: "0.5s" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm px-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          {status === "ringing" && (
            <div className="animate-pulse-ring rounded-full">
              <UserAvatar name={otherName} src={otherAvatar} size="xl" />
            </div>
          )}
          {status !== "ringing" && (
            <UserAvatar name={otherName} src={otherAvatar} size="xl" />
          )}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white">{otherName}</h2>
            <p className="text-blue-200/70 mt-1">
              {status === "ringing" &&
                (isCaller ? "Calling..." : "Incoming call")}
              {status === "accepted" && formatCallDuration(duration)}
              {status === "declined" && "Call declined"}
              {status === "ended" && "Call ended"}
            </p>
            {isVideo && status === "accepted" && (
              <p className="text-blue-300/50 text-xs mt-2">
                Demo call — connect audio/video hardware for live calls
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        {status === "ringing" && !isCaller && (
          <div className="flex items-center gap-12 mt-8">
            <button
              onClick={onDecline}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
                <PhoneOff className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm text-white/80">Decline</span>
            </button>
            <button
              onClick={onAccept}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors animate-pulse-ring">
                <Phone className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm text-white/80">Accept</span>
            </button>
          </div>
        )}

        {status === "ringing" && isCaller && (
          <button
            onClick={onEnd}
            className="flex flex-col items-center gap-2 mt-8"
          >
            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
              <PhoneOff className="w-7 h-7 text-white" />
            </div>
            <span className="text-sm text-white/80">Cancel</span>
          </button>
        )}

        {status === "accepted" && (
          <div className="flex items-center gap-6 mt-8">
            <button
              onClick={() => setMuted(!muted)}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
                muted
                  ? "bg-white text-slate-900"
                  : "bg-white/10 text-white hover:bg-white/20",
              )}
            >
              {muted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>
            {isVideo && (
              <button
                onClick={() => setVideoOff(!videoOff)}
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
                  videoOff
                    ? "bg-white text-slate-900"
                    : "bg-white/10 text-white hover:bg-white/20",
                )}
              >
                {videoOff ? (
                  <VideoOff className="w-6 h-6" />
                ) : (
                  <Video className="w-6 h-6" />
                )}
              </button>
            )}
            <button className="w-14 h-14 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors">
              <Volume2 className="w-6 h-6" />
            </button>
            <button
              onClick={onEnd}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        )}

        {(status === "declined" || status === "ended") && (
          <button
            onClick={onEnd}
            className="mt-8 px-8 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-sm font-medium"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
