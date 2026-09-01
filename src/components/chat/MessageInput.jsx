import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Send, ImagePlus, Paperclip, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function MessageInput({ onSend }) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend({ content: text.trim(), message_type: "text" });
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e, isImage) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      const file_url = publicUrlData.publicUrl;

      if (isImage) {
        setPreview({ url: file_url, name: file.name, type: "image" });
      } else {
        onSend({ file_url, file_name: file.name, message_type: "file" });
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const sendImage = () => {
    if (!preview) return;
    onSend({
      file_url: preview.url,
      file_name: preview.name,
      message_type: "image",
    });
    setPreview(null);
  };

  return (
    <div className="border-t border-border bg-white/80 backdrop-blur-md px-3 py-3">
      {preview && (
        <div className="mb-2 flex items-center gap-2 bg-muted rounded-xl p-2 animate-fade-in">
          <img
            src={preview.url}
            alt="Preview"
            className="w-16 h-16 rounded-lg object-cover"
          />
          <span className="text-sm text-muted-foreground flex-1 truncate">
            {preview.name}
          </span>
          <button
            onClick={() => setPreview(null)}
            className="p-1.5 rounded-full hover:bg-muted-foreground/10"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={sendImage}
            className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium"
          >
            Send
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="flex items-center gap-1">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => handleFileSelect(e, true)}
          />
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={(e) => handleFileSelect(e, false)}
          />
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50"
            title="Send image"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50"
            title="Send file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex items-end gap-2 bg-muted rounded-2xl px-3 py-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none max-h-24 scrollbar-thin placeholder:text-muted-foreground"
            style={{ minHeight: "24px" }}
          />
          {uploading && (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin shrink-0" />
          )}
        </div>
        <button
          onClick={handleSend}
          disabled={!text.trim() || uploading}
          className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg disabled:opacity-40 disabled:shadow-none transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
