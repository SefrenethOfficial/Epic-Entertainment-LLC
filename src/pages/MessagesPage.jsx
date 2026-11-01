const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";

import { ArrowLeft, Plus, Trash2, Save, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EDITOR_EMAILS = ["epocendie@gmail.com", "0322424@schoolsnet.act.edu.au"];

const DEFAULT_MESSAGES = [
  "Welcome back, Player.",
  "Ready to play?",
  "Your games await.",
  "Let's get into it.",
  "What are we playing today?",
];

/**
 * MessagesPage — editor-only page for managing splash screen rotating messages.
 * Accessible at /messages. Non-editors are redirected to home.
 */
export default function MessagesPage() {
  const [isEditor, setIsEditor] = useState(null); // null = loading
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [settingsId, setSettingsId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load auth + existing site settings
  useEffect(() => {
    async function load() {
      const user = await db.auth.me();
      const editor = EDITOR_EMAILS.includes(user.email) || user.role === "admin";
      setIsEditor(editor);
      if (!editor) return;

      const settings = await db.entities.SiteSettings.list();
      if (settings.length > 0) {
        setMessages(settings[0].messages || DEFAULT_MESSAGES);
        setSettingsId(settings[0].id);
      } else {
        setMessages(DEFAULT_MESSAGES);
      }
    }
    load();
  }, []);

  const handleAdd = () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, trimmed]);
    setNewMessage("");
  };

  const handleRemove = (index) => {
    setMessages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    if (settingsId) {
      await db.entities.SiteSettings.update(settingsId, { messages });
    } else {
      const created = await db.entities.SiteSettings.create({ messages });
      setSettingsId(created.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Still loading auth check
  if (isEditor === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect non-editors
  if (isEditor === false) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/60 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h1 className="font-heading text-xl font-bold">Splash Messages</h1>
            </div>
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : saved ? "Saved!" : "Save"}
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <p className="text-sm text-muted-foreground">
          These messages rotate randomly on the splash screen. Add, remove, or reorder them.
        </p>

        {/* Add new message */}
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder='Add a message e.g. "Good luck today!"'
            className="bg-secondary border-0"
            maxLength={100}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          />
          <Button onClick={handleAdd} disabled={!newMessage.trim()} className="gap-1.5 flex-shrink-0">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>

        {/* Messages list */}
        <div className="space-y-2">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No messages yet. Add one above.</p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border">
              <span className="text-xs text-muted-foreground flex-shrink-0 w-5 text-right">{i + 1}.</span>
              <p className="flex-1 text-sm text-foreground italic">"{msg}"</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                onClick={() => handleRemove(i)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}