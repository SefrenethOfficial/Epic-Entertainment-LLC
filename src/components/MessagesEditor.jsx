const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Trash2 } from "lucide-react";

export default function MessagesEditor({ open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [settingsId, setSettingsId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newMsg, setNewMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    async function load() {
      const settings = await db.entities.SiteSettings.list();
      if (settings.length > 0) {
        setMessages(settings[0].messages || []);
        setSettingsId(settings[0].id);
      } else {
        setMessages(["Welcome back, Player.", "Ready to play?", "Your games await."]);
        setSettingsId(null);
      }
    }
    load();
  }, [open]);

  const addMessage = () => {
    if (!newMsg.trim()) return;
    setMessages([...messages, newMsg.trim()]);
    setNewMsg("");
  };

  const removeMessage = (i) => setMessages(messages.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    if (settingsId) {
      await db.entities.SiteSettings.update(settingsId, { messages });
    } else {
      const created = await db.entities.SiteSettings.create({ messages });
      setSettingsId(created.id);
    }
    setSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold">Home Screen Messages</h2>
              <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">One of these will be randomly shown on the splash screen.</p>

            <div className="space-y-2 max-h-56 overflow-y-auto mb-4">
              {messages.map((msg, i) => (
                <div key={i} className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
                  <span className="flex-1 text-sm truncate">"{msg}"</span>
                  <button onClick={() => removeMessage(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-4">
              <Input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMessage()}
                placeholder="Add a new message..."
                className="bg-secondary border-0"
              />
              <Button size="icon" variant="outline" onClick={addMessage}><Plus className="w-4 h-4" /></Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}