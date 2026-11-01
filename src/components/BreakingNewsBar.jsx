const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Radio, Pencil, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export default function BreakingNewsBar({ isEditor }) {
  const [items, setItems] = useState([]);
  const [settingsId, setSettingsId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const settings = await db.entities.SiteSettings.list();
        if (settings.length > 0) {
          setSettingsId(settings[0].id);
          setItems(settings[0].breaking_news || []);
        }
      } catch (e) { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const openEditor = () => {
    if (!isEditor) return;
    setDraft(items.length > 0 ? [...items] : [""]);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const filtered = draft.filter((s) => s.trim());
    try {
      if (settingsId) {
        await db.entities.SiteSettings.update(settingsId, { breaking_news: filtered });
      } else {
        const created = await db.entities.SiteSettings.create({ breaking_news: filtered });
        setSettingsId(created.id);
      }
      setItems(filtered);
      setEditing(false);
    } catch (e) { /* ignore */ }
    setSaving(false);
  };

  if (loading) return null;
  if (items.length === 0 && !isEditor) return null;

  const scrollContent = items.length > 0 ? [...items, ...items] : [];

  return (
    <>
      <div
        onClick={isEditor ? openEditor : undefined}
        className={`fixed top-0 left-0 right-0 z-50 flex items-center gap-2 px-3 py-1 bg-black border-b border-red-600/50 ${isEditor ? "cursor-pointer" : ""}`}
      >
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600 flex-shrink-0">
          <Radio className="w-3 h-3 text-white animate-pulse" />
          <span className="text-xs font-bold text-white tracking-wide">BREAKING</span>
        </div>
        <div className="flex-1 overflow-hidden">
          {items.length > 0 ? (
            <motion.div
              className="flex items-center whitespace-nowrap"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: Math.max(10, items.length * 5), repeat: Infinity, ease: "linear" }}
            >
              {scrollContent.map((item, i) => (
                <span key={i} className="flex items-center text-xs text-white/90">
                  {item}
                  <span className="mx-3 text-red-500">•</span>
                </span>
              ))}
            </motion.div>
          ) : (
            <p className="text-xs text-white/50">Click to add breaking news...</p>
          )}
        </div>
        {isEditor && <Pencil className="w-3 h-3 text-white/50 flex-shrink-0" />}
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setEditing(false)}
          >
            <motion.div
              className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-foreground">Edit Breaking News</h3>
                <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {draft.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={item}
                      onChange={(e) => setDraft((d) => d.map((v, j) => (j === i ? e.target.value : v)))}
                      placeholder={`News item ${i + 1}`}
                      className="h-8 text-sm bg-secondary border-border"
                    />
                    <button
                      onClick={() => setDraft((d) => d.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-destructive flex-shrink-0 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDraft((d) => [...d, ""])}
                className="w-full mt-2 gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add News Item
              </Button>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}