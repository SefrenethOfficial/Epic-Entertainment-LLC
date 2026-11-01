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
import { Code, Globe, Save, Loader2, Upload } from "lucide-react";

const CATEGORIES = [
  { value: "action", label: "🎯 Action" },
  { value: "puzzle", label: "🧩 Puzzle" },
  { value: "arcade", label: "👾 Arcade" },
  { value: "strategy", label: "♟️ Strategy" },
  { value: "casual", label: "🎮 Casual" },
  { value: "other", label: "🕹️ Other" },
];

export default function GameFormDialog({ open, onOpenChange, game, onSave, isApp = false }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "html",
    html_code: "",
    embed_url: "",
    thumbnail_url: "",
    category: "other",
    is_app: false,
    play_count: 0,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingHtml, setUploadingHtml] = useState(false);

  useEffect(() => {
    if (game) {
      setForm({
        title: game.title || "",
        description: game.description || "",
        type: game.type || "html",
        html_code: game.html_code || "",
        embed_url: game.embed_url || "",
        thumbnail_url: game.thumbnail_url || "",
        category: game.category || "other",
        is_app: game.is_app || false,
        play_count: game.play_count || 0,
      });
    } else {
      setForm({
        title: "",
        description: "",
        type: "html",
        html_code: "",
        embed_url: "",
        thumbnail_url: "",
        category: "other",
        is_app: isApp,
        play_count: 0,
      });
    }
  }, [game, open]);

  const handleHtmlFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingHtml(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, html_code: "", embed_url: file_url, type: "embed" }));
    setUploadingHtml(false);
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
            {game ? (game.is_app ? "Edit App" : "Edit Game") : isApp ? "Add New App" : "Add New Game"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Game name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
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

          {game && (
            <div className="space-y-2">
              <Label>Play Count</Label>
              <Input
                type="number"
                min="0"
                value={form.play_count}
                onChange={(e) => setForm({ ...form, play_count: parseInt(e.target.value) || 0 })}
              />
            </div>
          )}

          <Tabs
            value={form.type}
            onValueChange={(v) => setForm({ ...form, type: v })}
          >
            <TabsList className="bg-secondary">
              <TabsTrigger value="html" className="gap-1.5">
                <Code className="w-3.5 h-3.5" /> HTML Code
              </TabsTrigger>
              <TabsTrigger value="embed" className="gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Embed URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="html" className="mt-3">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Paste your HTML game code</Label>
                  <Textarea
                    value={form.html_code}
                    onChange={(e) =>
                      setForm({ ...form, html_code: e.target.value })
                    }
                    placeholder="<html>...</html>"
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-xs text-muted-foreground">or upload an HTML file</span>
                  <div className="flex-1 border-t border-border" />
                </div>
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary/50 cursor-pointer text-sm text-muted-foreground transition-colors">
                  <input type="file" accept=".html,.htm" className="hidden" onChange={handleHtmlFileUpload} />
                  <Upload className="w-4 h-4 flex-shrink-0" />
                  {uploadingHtml ? "Uploading..." : "Upload .html file (handles large games)"}
                </label>
              </div>
            </TabsContent>

            <TabsContent value="embed" className="mt-3">
              <div className="space-y-2">
                <Label>Embed URL</Label>
                <Input
                  value={form.embed_url}
                  onChange={(e) =>
                    setForm({ ...form, embed_url: e.target.value })
                  }
                  placeholder="https://example.com/game"
                />
                <p className="text-xs text-muted-foreground">
                  Paste the URL from an iframe embed code, or a direct game URL.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {game ? "Update" : isApp ? "Add App" : "Add Game"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}