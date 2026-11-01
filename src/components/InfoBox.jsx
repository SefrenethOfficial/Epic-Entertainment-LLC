const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Info, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

export default function InfoBox({ isEditor }) {
  const [content, setContent] = useState("");
  const [settingsId, setSettingsId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const settings = await db.entities.SiteSettings.list();
        if (settings.length > 0) {
          setSettingsId(settings[0].id);
          setContent(settings[0].info_box || "");
        }
      } catch (e) { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const openEditor = () => {
    if (!isEditor) return;
    setDraft(content);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settingsId) {
        await db.entities.SiteSettings.update(settingsId, { info_box: draft });
      } else {
        const created = await db.entities.SiteSettings.create({ info_box: draft });
        setSettingsId(created.id);
      }
      setContent(draft);
      setEditing(false);
    } catch (e) { /* ignore */ }
    setSaving(false);
  };

  if (loading) return null;
  if (!content && !isEditor) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-2 left-1/2 -translate-x-1/2 z-30 max-w-md w-[90%]"
      >
        <div
          onClick={isEditor ? openEditor : undefined}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-card/90 border border-border shadow-2xl backdrop-blur-xl ${
            isEditor ? "cursor-pointer hover:border-primary/50" : ""
          }`}
        >
          <Info className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-sm text-foreground/80 flex-1 line-clamp-2">
            {content || (isEditor ? "Click to add an info message..." : "")}
          </p>
          {isEditor && <Pencil className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
        </div>
      </motion.div>

      <AnimatePresence>
        {editing && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setEditing(false)}
          >
            <motion.div
              className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-foreground">Edit Info Box</h3>
                <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Enter info box content..."
                rows={4}
                className="bg-secondary border-border resize-none"
              />
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