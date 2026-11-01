const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2, Youtube, FolderOpen, Music, Upload, Video } from "lucide-react";

const CATEGORIES = [
  { value: "anime", label: "🎌 Anime" },
  { value: "movie", label: "🎬 Movie" },
  { value: "series", label: "📺 Series" },
  { value: "music", label: "🎵 Music" },
  { value: "other", label: "📁 Other" },
];

export default function VideoFormDialog({ open, onOpenChange, video, onSave, defaultCategory = "other" }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    video_type: "youtube",
    youtube_url: "",
    drive_folder_url: "",
    mp3_url: "",
    thumbnail_url: "",
    category: "other",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileType, setUploadedFileType] = useState(null); // "audio" | "video"

  useEffect(() => {
    if (video) {
      setForm({
        title: video.title || "",
        description: video.description || "",
        video_type: video.video_type || "youtube",
        youtube_url: video.youtube_url || "",
        drive_folder_url: video.drive_folder_url || "",
        mp3_url: video.mp3_url || "",
        thumbnail_url: video.thumbnail_url || "",
        category: video.category || "other",
      });
    } else {
      setForm({
        title: "",
        description: "",
        video_type: "youtube",
        youtube_url: "",
        drive_folder_url: "",
        mp3_url: "",
        thumbnail_url: "",
        category: defaultCategory,
      });
    }
  }, [video, open]);

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const isVideo = file.type.startsWith("video/");
    setUploadedFileType(isVideo ? "video" : "audio");
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, mp3_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {video ? "Edit Video" : "Add New Video"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Video title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Thumbnail URL (optional)</Label>
            <Input
              value={form.thumbnail_url}
              onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <Tabs value={form.video_type} onValueChange={(v) => setForm({ ...form, video_type: v })}>
            <TabsList className="bg-secondary">
              <TabsTrigger value="youtube" className="gap-1.5">
                <Youtube className="w-3.5 h-3.5" /> YouTube
              </TabsTrigger>
              <TabsTrigger value="drive_folder" className="gap-1.5">
                <FolderOpen className="w-3.5 h-3.5" /> Drive Folder
              </TabsTrigger>
              <TabsTrigger value="mp3" className="gap-1.5">
                <Music className="w-3.5 h-3.5" /> Audio / MP4
              </TabsTrigger>
            </TabsList>

            <TabsContent value="youtube" className="mt-3 space-y-2">
              <Label>YouTube URL</Label>
              <Input
                value={form.youtube_url}
                onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-xs text-muted-foreground">Paste a YouTube video or playlist URL.</p>
            </TabsContent>

            <TabsContent value="drive_folder" className="mt-3 space-y-2">
              <Label>Google Drive Folder URL</Label>
              <Input
                value={form.drive_folder_url}
                onChange={(e) => setForm({ ...form, drive_folder_url: e.target.value })}
                placeholder="https://drive.google.com/drive/folders/..."
              />
              <p className="text-xs text-muted-foreground">
                Share a Google Drive folder containing episodes. Tapping the card will open the folder as an episode list.
              </p>
            </TabsContent>

            <TabsContent value="mp3" className="mt-3 space-y-2">
              <Label>Upload MP3 or MP4 File</Label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="audio/mp3,audio/mpeg,audio/*,video/mp4,video/*"
                    className="hidden"
                    onChange={handleMediaUpload}
                  />
                  <div className="flex items-center gap-2 px-4 py-2 rounded-md border border-dashed border-border hover:border-primary/60 transition-colors text-sm text-muted-foreground">
                    <Upload className="w-4 h-4" />
                    {uploading ? "Uploading..." : form.mp3_url ? "Replace file" : "Click to upload MP3 or MP4"}
                  </div>
                </label>
              </div>
              {form.mp3_url && (
                uploadedFileType === "video" || form.mp3_url.match(/\.mp4(\?|$)/i) ? (
                  <video controls src={form.mp3_url} className="w-full mt-2 rounded max-h-48" />
                ) : (
                  <audio controls src={form.mp3_url} className="w-full mt-2 h-10 rounded" />
                )
              )}
              <p className="text-xs text-muted-foreground">Supports MP3, M4A, WAV, OGG, MP4, MOV, and other common formats.</p>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || uploading} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {video ? "Update" : "Add Video"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}